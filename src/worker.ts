/**
 * Web Worker: RSRP computation broker.
 * Loads the Wasm engine and handles compute requests from the main thread.
 */
import init, { compute_rsrp_map, compute_rsrp_map_multi } from './wasm/wasm_engine.js'

// ── Message types ─────────────────────────────────────────────────────────────

export interface ComputeRequest {
  type: 'COMPUTE'
  id: number
  mapCells: Uint8Array     // flat [rows × cols]
  cols: number
  rows: number
  cellSizeM: number
  txPositions: Float32Array // interleaved [col0, row0, col1, row1, ...]
}

export interface ComputeResult {
  type: 'RESULT'
  id: number
  rsrp: Float32Array       // flat [rows × cols]
}

export interface WorkerReady {
  type: 'READY'
}

export type WorkerMessage = ComputeResult | WorkerReady

// ── Init & dispatch ───────────────────────────────────────────────────────────

let wasmReady = false

async function bootstrap() {
  await init()
  wasmReady = true
  const ready: WorkerReady = { type: 'READY' }
  self.postMessage(ready)
}

self.onmessage = (e: MessageEvent<ComputeRequest>) => {
  if (!wasmReady) {
    console.warn('[worker] Wasm not ready yet, dropping message')
    return
  }

  const { id, mapCells, cols, rows, cellSizeM, txPositions } = e.data

  const rsrp = compute_rsrp_map_multi(mapCells, cols, rows, cellSizeM, txPositions)

  const result: ComputeResult = { type: 'RESULT', id, rsrp }
  // Transfer the underlying buffer to avoid copying
  self.postMessage(result, { transfer: [result.rsrp.buffer] })
}

bootstrap()
