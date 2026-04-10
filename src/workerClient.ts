/**
 * Main-thread wrapper around the RSRP worker.
 * Manages the worker lifecycle and provides a Promise-based API.
 */
import type { ComputeRequest, ComputeResult, WorkerMessage } from './worker.js'

type PendingResolve = (rsrp: Float32Array) => void

export class RsrpWorkerClient {
  private worker: Worker
  private ready: Promise<void>
  private pending = new Map<number, PendingResolve>()
  private nextId = 0

  constructor() {
    this.worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })

    this.ready = new Promise<void>((resolve) => {
      this.worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
        if (e.data.type === 'READY') {
          // Switch to normal message handler after init
          this.worker.onmessage = this.handleMessage.bind(this)
          resolve()
        }
      }
    })
  }

  /** Wait until Wasm is initialised inside the worker. */
  whenReady(): Promise<void> {
    return this.ready
  }

  /**
   * Request RSRP computation.
   * Transfers typed arrays to avoid memcpy.
   */
  compute(params: {
    mapCells: Uint8Array
    cols: number
    rows: number
    cellSizeM: number
    txPositions: Float32Array
  }): Promise<Float32Array> {
    return this.ready.then(() =>
      new Promise<Float32Array>((resolve) => {
        const id = this.nextId++
        this.pending.set(id, resolve)

        // Clone arrays before transfer so caller keeps its copies
        const cellsClone = params.mapCells.slice()
        const posClone = params.txPositions.slice()

        const msg: ComputeRequest = {
          type: 'COMPUTE',
          id,
          mapCells: cellsClone,
          cols: params.cols,
          rows: params.rows,
          cellSizeM: params.cellSizeM,
          txPositions: posClone,
        }
        this.worker.postMessage(msg, [cellsClone.buffer, posClone.buffer])
      })
    )
  }

  terminate() {
    this.worker.terminate()
  }

  private handleMessage(e: MessageEvent<WorkerMessage>) {
    if (e.data.type !== 'RESULT') return
    const { id, rsrp } = e.data as ComputeResult
    const resolve = this.pending.get(id)
    if (resolve) {
      this.pending.delete(id)
      resolve(rsrp)
    }
  }
}
