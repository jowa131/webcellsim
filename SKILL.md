# webcellsim — Skill Profile

**webcellsim** — 브라우저 기반 iBwave 스타일 셀룰러 네트워크 플래닝 툴.
3.5GHz 무선 신호 Path Loss 및 RSRP를 Rust/WASM으로 연산하고 HTML5 Canvas로 히트맵을 렌더링한다.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript |
| Build Tool | Vite |
| Computation Engine | Rust + wasm-pack (WebAssembly) |
| Concurrency | Web Worker |
| Rendering | HTML5 Canvas |

---

## Directory Structure

```
webcellsim/
├── src/
│   ├── main.ts          ← UI entry point
│   ├── floorplan.ts     ← Floor plan data and rendering logic
│   ├── renderer.ts      ← Canvas rendering (heatmap)
│   ├── worker.ts        ← Web Worker entry point
│   ├── workerClient.ts  ← Main thread ↔ Worker messaging
│   └── wasm/            ← Compiled WASM output (generated)
├── wasm-engine/
│   ├── Cargo.toml
│   └── src/lib.rs       ← Rust: Path Loss and RSRP computation
├── public/
├── dist/                ← Production build output (generated)
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Key Modules

### wasm-engine (Rust)
- Computes Path Loss model for 3.5GHz signals.
- Computes RSRP (Reference Signal Received Power) per grid cell.
- Compiled to WASM via `wasm-pack build --target web`.
- Invoked from `worker.ts` via Web Worker to avoid blocking the main thread.

### worker.ts / workerClient.ts
- `worker.ts`: Web Worker that initializes WASM module and responds to computation requests.
- `workerClient.ts`: Main thread API that sends messages to the worker and receives results.

### renderer.ts
- Receives RSRP values from worker.
- Maps signal strength to color gradient and draws heatmap on Canvas.

### floorplan.ts
- Defines floor plan geometry (walls, rooms).
- Provides coordinate transformation utilities.

---

## Build Commands

```bash
# Install dependencies
npm install

# Compile WASM engine (required first time and after Rust changes)
cd wasm-engine && wasm-pack build --target web && cd ..

# Dev server
npm run dev

# Production build
npm run build
```

---

## Relevant Skills

- `/wasm-core` — WASM engine development
- `/canvas-ui` — Canvas heatmap rendering
- `/git-manager` — Commit milestones and update plan.md
