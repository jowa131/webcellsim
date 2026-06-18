# Windows Setup

## Requirements

- Node.js LTS
- Rust through rustup
- `wasm-pack`

## Setup and Build

```powershell
.\setup-windows.ps1
npm run dev
```

The WASM build command passes the crate directory directly, so it does not
depend on Bash directory-changing syntax.
