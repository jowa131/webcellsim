use wasm_bindgen::prelude::*;

// ── Constants ─────────────────────────────────────────────────────────────────
const TX_POWER_DBM: f32 = 40.0;
const ANTENNA_GAIN_DBI: f32 = 3.0;
const EIRP: f32 = TX_POWER_DBM + ANTENNA_GAIN_DBI; // 43 dBm

// FSPL(dB) = 20*log10(d_m) + 20*log10(f_MHz) + 27.55
// For 3500 MHz: 20*log10(3500) + 27.55 = 70.88 + 27.55 = 98.43
const FSPL_OFFSET: f32 = 98.43;

const ATTN_CONCRETE: f32 = 18.0;
const ATTN_DRYWALL: f32 = 5.0;

/// Map cell type — must match JS-side encoding
#[repr(u8)]
#[derive(Clone, Copy, PartialEq)]
enum Cell {
    Free     = 0,
    Concrete = 1,
    Drywall  = 2,
}

impl From<u8> for Cell {
    fn from(v: u8) -> Self {
        match v {
            1 => Cell::Concrete,
            2 => Cell::Drywall,
            _ => Cell::Free,
        }
    }
}

// ── Public API ────────────────────────────────────────────────────────────────

/// Compute full-map RSRP heatmap for a single antenna.
///
/// Returns Float32Array of length `rows × cols` with RSRP (dBm) clamped to [-140, -40].
#[wasm_bindgen]
pub fn compute_rsrp_map(
    map_cells: &[u8],
    cols: u32,
    rows: u32,
    cell_size_m: f32,
    tx_col: f32,
    tx_row: f32,
) -> Vec<f32> {
    let n = (cols * rows) as usize;
    let mut out = vec![0f32; n];

    for row in 0..rows {
        for col in 0..cols {
            let idx = (row * cols + col) as usize;

            let dx = (col as f32 - tx_col) * cell_size_m;
            let dy = (row as f32 - tx_row) * cell_size_m;
            let dist_m = (dx * dx + dy * dy).sqrt().max(0.1);

            let fspl = 20.0 * dist_m.log10() + FSPL_OFFSET;
            let wall_loss = wall_attenuation(map_cells, cols, rows, tx_col, tx_row, col as f32, row as f32);
            let rsrp = (EIRP - fspl - wall_loss).clamp(-140.0, -40.0);

            out[idx] = rsrp;
        }
    }
    out
}

/// Compute RSRP heatmap for multiple antennas; returns element-wise maximum.
///
/// `tx_positions`: interleaved [col0, row0, col1, row1, ...]
#[wasm_bindgen]
pub fn compute_rsrp_map_multi(
    map_cells: &[u8],
    cols: u32,
    rows: u32,
    cell_size_m: f32,
    tx_positions: &[f32],
) -> Vec<f32> {
    let n = (cols * rows) as usize;
    let mut out = vec![-140f32; n];

    let num_tx = tx_positions.len() / 2;
    for i in 0..num_tx {
        let tx_col = tx_positions[i * 2];
        let tx_row = tx_positions[i * 2 + 1];
        let single = compute_rsrp_map(map_cells, cols, rows, cell_size_m, tx_col, tx_row);
        for j in 0..n {
            if single[j] > out[j] {
                out[j] = single[j];
            }
        }
    }
    out
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/// Ray-march from Tx to destination cell, accumulating wall attenuation.
fn wall_attenuation(
    map_cells: &[u8],
    cols: u32,
    rows: u32,
    tx_col: f32,
    tx_row: f32,
    dst_col: f32,
    dst_row: f32,
) -> f32 {
    let steps = ((dst_col - tx_col).abs().max((dst_row - tx_row).abs()) as usize).max(1);
    let mut loss = 0.0f32;
    let mut prev_was_wall = false;

    for s in 1..=steps {
        let t = s as f32 / steps as f32;
        let c = (tx_col + (dst_col - tx_col) * t).round() as i32;
        let r = (tx_row + (dst_row - tx_row) * t).round() as i32;
        if c < 0 || r < 0 || c >= cols as i32 || r >= rows as i32 {
            continue;
        }
        let cell = Cell::from(map_cells[(r as u32 * cols + c as u32) as usize]);

        let is_wall = cell != Cell::Free;
        // Count attenuation only once per wall crossing (leading edge)
        if is_wall && !prev_was_wall {
            loss += match cell {
                Cell::Concrete => ATTN_CONCRETE,
                Cell::Drywall  => ATTN_DRYWALL,
                Cell::Free     => 0.0,
            };
        }
        prev_was_wall = is_wall;
    }
    loss
}

// ── Unit tests ────────────────────────────────────────────────────────────────
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn free_space_rsrp_decreases_with_distance() {
        let cols = 10u32;
        let rows = 1u32;
        let map = vec![0u8; (cols * rows) as usize];
        let rsrp = compute_rsrp_map(&map, cols, rows, 1.0, 0.0, 0.0);
        // RSRP at col=1 should be greater than at col=9
        assert!(rsrp[1] > rsrp[9], "RSRP must decrease with distance");
    }

    #[test]
    fn concrete_wall_reduces_rsrp() {
        let cols = 10u32;
        let rows = 1u32;
        let mut map = vec![0u8; (cols * rows) as usize];
        map[5] = 1; // Concrete wall at col=5
        let rsrp_wall = compute_rsrp_map(&map, cols, rows, 1.0, 0.0, 0.0);

        let map_free = vec![0u8; (cols * rows) as usize];
        let rsrp_free = compute_rsrp_map(&map_free, cols, rows, 1.0, 0.0, 0.0);

        // Beyond the wall, RSRP should be lower
        assert!(rsrp_wall[8] < rsrp_free[8], "Concrete wall must attenuate signal");
    }
}
