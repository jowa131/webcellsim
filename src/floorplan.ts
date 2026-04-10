/**
 * Hardcoded floor plan definition.
 * Cell encoding: 0=Free, 1=Concrete, 2=Drywall
 *
 * Layout (40×30 cells, each cell = 0.5 m → 20 m × 15 m room):
 *   - Outer border: Concrete walls
 *   - Inner partition at col 20: Drywall
 *   - Two concrete pillars
 */

export const COLS = 40
export const ROWS = 30
export const CELL_SIZE_M = 0.5 // metres per cell

export const enum CellType {
  Free     = 0,
  Concrete = 1,
  Drywall  = 2,
}

function buildFloorPlan(): Uint8Array {
  const map = new Uint8Array(COLS * ROWS) // all Free

  const set = (col: number, row: number, type: CellType) => {
    if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
      map[row * COLS + col] = type
    }
  }

  const hLine = (row: number, c0: number, c1: number, type: CellType) => {
    for (let c = c0; c <= c1; c++) set(c, row, type)
  }
  const vLine = (col: number, r0: number, r1: number, type: CellType) => {
    for (let r = r0; r <= r1; r++) set(col, r, type)
  }
  const rect = (c0: number, r0: number, c1: number, r1: number, type: CellType) => {
    hLine(r0, c0, c1, type); hLine(r1, c0, c1, type)
    vLine(c0, r0, r1, type); vLine(c1, r0, r1, type)
  }

  // Outer concrete walls
  rect(0, 0, COLS - 1, ROWS - 1, CellType.Concrete)

  // Inner drywall partition (vertical, with a doorway gap)
  for (let r = 1; r < ROWS - 1; r++) {
    if (r < 10 || r > 14) set(20, r, CellType.Drywall) // gap rows 10-14
  }

  // Concrete pillars
  rect(8, 8, 10, 10, CellType.Concrete)
  rect(28, 18, 30, 20, CellType.Concrete)

  return map
}

export const MAP_CELLS = buildFloorPlan()

/** Initial antenna positions [col, row] */
export const INITIAL_TX: [number, number][] = [
  [10, 15],
  [30, 10],
]
