# Technical Specification — webcellsim

## Project Overview

- Service: webcellsim — 브라우저 기반 iBwave 스타일 셀룰러 플래닝 툴
- Goal: 3.5GHz 무선 신호의 Path Loss 및 RSRP를 브라우저에서 실시간으로 연산하고 히트맵으로 시각화.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript |
| Build Tool | Vite |
| Computation Engine | Rust + WebAssembly (wasm-pack) |
| Concurrency | Web Worker |
| Rendering | HTML5 Canvas |
| Package Manager | npm |

---

## System Architecture

```
[Browser]
  |
  |-- Canvas UI (TypeScript)
  |       |-- draws floor plan
  |       |-- renders RSRP heatmap
  |
  |-- Web Worker
  |       |-- runs WASM engine off main thread
  |
  |-- WASM Engine (Rust → wasm-pack)
          |-- computes Path Loss (3.5GHz)
          |-- computes RSRP
```

---

## Directory Structure

```
webcellsim/
├── CLAUDE.md
├── SKILL.md
├── tech_spec.md
├── plan.md
├── .antigravityrules
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── src/                     ← TypeScript source
│   ├── main.ts
│   ├── canvas/              ← Canvas rendering logic
│   └── worker/              ← Web Worker entry point
├── wasm-engine/             ← Rust project
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs
├── public/                  ← Static assets
└── dist/                    ← Build output (generated)
```

---

## Operating Environment

- Host OS: Windows 11 + WSL2 (Ubuntu)
- Runtime: Browser-only (100% client-side, no server)
- Node.js: for build tooling only (Vite)
- Rust toolchain: required for WASM compilation (`wasm-pack`)

---

## Key Constraints

- No server-side code. Everything runs in the browser.
- No E2E tests — local unit tests only.
- Computation must run in a Web Worker to avoid blocking the main thread.
- Targeted code edits only — never rewrite entire files.
- No Docker configuration.

---

## Build Commands

```bash
# Install dependencies
npm install

# Dev server
npm run dev

# Build WASM engine (run first time and after Rust changes)
cd wasm-engine && wasm-pack build --target web

# Production build
npm run build
```

## Completed Phases

| Phase | Description |
|---|---|
| 1 | Environment setup (Vite, TypeScript, Rust) |
| 2 | WASM engine development |
| 3 | Web Worker integration |
| 4 | Canvas heatmap rendering |
