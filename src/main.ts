/**
 * webcellsim — main entry point
 * Wires up: floor plan → worker → renderer → drag interaction
 */
import { RsrpWorkerClient } from './workerClient.js'
import { HeatmapRenderer, CANVAS_W, CANVAS_H } from './renderer.js'
import { MAP_CELLS, COLS, ROWS, CELL_SIZE_M, INITIAL_TX } from './floorplan.js'

const TILE = 5 // must match renderer.ts

// ── DOM setup ─────────────────────────────────────────────────────────────────
const app = document.getElementById('app')!
app.innerHTML = ''

const canvas = document.createElement('canvas')
canvas.style.cursor = 'crosshair'
canvas.style.display = 'block'
canvas.style.border = '1px solid #333'
app.appendChild(canvas)

const statusEl = document.createElement('div')
statusEl.style.cssText = 'margin-top:8px;font-size:12px;color:#888;'
statusEl.textContent = 'Initializing Wasm engine…'
app.appendChild(statusEl)

// ── State ─────────────────────────────────────────────────────────────────────
const renderer = new HeatmapRenderer(canvas)
const worker   = new RsrpWorkerClient()

// Antenna positions (mutable)
const txPositions: [number, number][] = INITIAL_TX.map(([c, r]) => [c, r])

let latestRsrp: Float32Array | null = null
let dragIdx: number | null = null
let computePending = false

// ── Compute & render ──────────────────────────────────────────────────────────

async function requestCompute() {
  if (computePending) return
  computePending = true
  statusEl.textContent = 'Computing…'

  const flat = new Float32Array(txPositions.flatMap(([c, r]) => [c, r]))
  latestRsrp = await worker.compute({
    mapCells: MAP_CELLS,
    cols: COLS,
    rows: ROWS,
    cellSizeM: CELL_SIZE_M,
    txPositions: flat,
  })
  computePending = false
  statusEl.textContent = `RSRP computed — ${txPositions.length} antenna(s) | drag to reposition`
  render()
}

function render() {
  renderer.draw(latestRsrp, MAP_CELLS, txPositions, dragIdx)
}

// ── Drag interaction ──────────────────────────────────────────────────────────

function canvasCell(e: MouseEvent): [number, number] {
  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  return [Math.floor(x / TILE), Math.floor(y / TILE)]
}

function hitTest(col: number, row: number): number | null {
  for (let i = 0; i < txPositions.length; i++) {
    const [tc, tr] = txPositions[i]
    if (Math.abs(tc - col) <= 2 && Math.abs(tr - row) <= 2) return i
  }
  return null
}

canvas.addEventListener('mousedown', (e) => {
  const [col, row] = canvasCell(e)
  dragIdx = hitTest(col, row)
  if (dragIdx !== null) render()
})

canvas.addEventListener('mousemove', (e) => {
  if (dragIdx === null) return
  const [col, row] = canvasCell(e)
  // Clamp inside map
  const c = Math.max(1, Math.min(COLS - 2, col))
  const r = Math.max(1, Math.min(ROWS - 2, row))
  txPositions[dragIdx] = [c, r]
  render() // live preview while dragging
})

canvas.addEventListener('mouseup', () => {
  if (dragIdx !== null) {
    dragIdx = null
    requestCompute() // recompute on drop
  }
})

canvas.addEventListener('mouseleave', () => {
  if (dragIdx !== null) {
    dragIdx = null
    requestCompute()
  }
})

// ── Boot ──────────────────────────────────────────────────────────────────────

worker.whenReady().then(() => {
  statusEl.textContent = 'Wasm ready — computing initial heatmap…'
  requestCompute()
})
