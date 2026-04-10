/* tslint:disable */
/* eslint-disable */

/**
 * Compute full-map RSRP heatmap for a single antenna.
 *
 * Returns Float32Array of length `rows × cols` with RSRP (dBm) clamped to [-140, -40].
 */
export function compute_rsrp_map(map_cells: Uint8Array, cols: number, rows: number, cell_size_m: number, tx_col: number, tx_row: number): Float32Array;

/**
 * Compute RSRP heatmap for multiple antennas; returns element-wise maximum.
 *
 * `tx_positions`: interleaved [col0, row0, col1, row1, ...]
 */
export function compute_rsrp_map_multi(map_cells: Uint8Array, cols: number, rows: number, cell_size_m: number, tx_positions: Float32Array): Float32Array;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly compute_rsrp_map: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number];
    readonly compute_rsrp_map_multi: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number];
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
