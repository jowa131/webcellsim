/**
 * Canvas UI renderer.
 * - Draws the floor plan (walls)
 * - Overlays RSRP heatmap (5×5 px tiles)
 * - Draws draggable antenna markers
 * - Renders a legend on the right
 */
import { COLS, ROWS, CellType } from './floorplan.js'

// ── Layout constants ──────────────────────────────────────────────────────────
const TILE = 5           // pixels per cell (heatmap)
const LEGEND_W = 80      // legend panel width (px)

export const CANVAS_W = COLS * TILE + LEGEND_W
export const CANVAS_H = ROWS * TILE

// RSRP display range
const RSRP_MIN = -120
const RSRP_MAX = -50

// ── Color helpers ─────────────────────────────────────────────────────────────

/** Map RSRP dBm → CSS rgb string. Blue(-120) → Cyan → Green → Yellow → Red(-50). */
function rsrpToColor(rsrp: number): [number, number, number] {
  const t = Math.max(0, Math.min(1, (rsrp - RSRP_MIN) / (RSRP_MAX - RSRP_MIN)))

  // 4-stop gradient: blue → cyan → green → yellow → red
  const stops: [number, number, number][] = [
    [0,   0,   255], // blue   t=0
    [0,   200, 255], // cyan   t=0.25
    [0,   220,  0],  // green  t=0.5
    [255, 220,  0],  // yellow t=0.75
    [255,   0,  0],  // red    t=1
  ]
  const seg = t * (stops.length - 1)
  const lo = Math.floor(seg)
  const hi = Math.min(lo + 1, stops.length - 1)
  const f = seg - lo
  const lerp = (a: number, b: number) => Math.round(a + (b - a) * f)
  return [lerp(stops[lo][0], stops[hi][0]), lerp(stops[lo][1], stops[hi][1]), lerp(stops[lo][2], stops[hi][2])]
}

// ── Renderer class ────────────────────────────────────────────────────────────

export class HeatmapRenderer {
  private ctx: CanvasRenderingContext2D

  constructor(canvas: HTMLCanvasElement) {
    canvas.width  = CANVAS_W
    canvas.height = CANVAS_H
    this.ctx = canvas.getContext('2d')!
  }

  /** Full redraw: heatmap + walls + antennas + legend */
  draw(
    rsrp: Float32Array | null,
    mapCells: Uint8Array,
    txPositions: [number, number][],
    dragIdx: number | null,
  ) {
    const ctx = this.ctx
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

    // 1. Heatmap tiles
    if (rsrp) {
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const val = rsrp[row * COLS + col]
          const [r, g, b] = rsrpToColor(val)
          ctx.fillStyle = `rgb(${r},${g},${b})`
          ctx.fillRect(col * TILE, row * TILE, TILE, TILE)
        }
      }
    } else {
      ctx.fillStyle = '#111'
      ctx.fillRect(0, 0, COLS * TILE, CANVAS_H)
    }

    // 2. Floor plan walls (semi-transparent overlay)
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const cell = mapCells[row * COLS + col]
        if (cell === CellType.Concrete) {
          ctx.fillStyle = 'rgba(40,40,40,0.85)'
          ctx.fillRect(col * TILE, row * TILE, TILE, TILE)
        } else if (cell === CellType.Drywall) {
          ctx.fillStyle = 'rgba(180,140,80,0.75)'
          ctx.fillRect(col * TILE, row * TILE, TILE, TILE)
        }
      }
    }

    // 3. Antenna markers
    txPositions.forEach(([col, row], i) => {
      const x = col * TILE + TILE / 2
      const y = row * TILE + TILE / 2
      ctx.beginPath()
      ctx.arc(x, y, 7, 0, Math.PI * 2)
      ctx.fillStyle = dragIdx === i ? '#fff' : '#ffdd00'
      ctx.fill()
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.fillStyle = '#000'
      ctx.font = 'bold 7px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`T${i + 1}`, x, y)
    })

    // 4. Legend
    this.drawLegend()
  }

  private drawLegend() {
    const ctx = this.ctx
    const lx = COLS * TILE + 8
    const lh = CANVAS_H - 40
    const ly = 20

    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(COLS * TILE, 0, LEGEND_W, CANVAS_H)

    // Gradient bar
    const grad = ctx.createLinearGradient(0, ly, 0, ly + lh)
    grad.addColorStop(0,    'rgb(255,0,0)')
    grad.addColorStop(0.25, 'rgb(255,220,0)')
    grad.addColorStop(0.5,  'rgb(0,220,0)')
    grad.addColorStop(0.75, 'rgb(0,200,255)')
    grad.addColorStop(1,    'rgb(0,0,255)')
    ctx.fillStyle = grad
    ctx.fillRect(lx, ly, 16, lh)
    ctx.strokeStyle = '#888'
    ctx.lineWidth = 0.5
    ctx.strokeRect(lx, ly, 16, lh)

    ctx.fillStyle = '#ccc'
    ctx.font = '9px sans-serif'
    ctx.textAlign = 'left'

    const labels = [
      { t: 0,    text: `${RSRP_MAX} dBm` },
      { t: 0.25, text: `${Math.round(RSRP_MIN + (RSRP_MAX - RSRP_MIN) * 0.75)} dBm` },
      { t: 0.5,  text: `${Math.round(RSRP_MIN + (RSRP_MAX - RSRP_MIN) * 0.5)} dBm` },
      { t: 0.75, text: `${Math.round(RSRP_MIN + (RSRP_MAX - RSRP_MIN) * 0.25)} dBm` },
      { t: 1,    text: `${RSRP_MIN} dBm` },
    ]
    labels.forEach(({ t, text }) => {
      const y = ly + t * lh
      ctx.fillStyle = '#aaa'
      ctx.fillText(text, lx + 20, y + 3)
    })

    ctx.fillStyle = '#888'
    ctx.font = '8px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('RSRP', lx + 8, ly - 8)
  }
}
