$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

foreach ($command in @("node", "npm", "cargo", "wasm-pack")) {
    if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
        throw "$command is not available on PATH."
    }
}

npm ci
npm run wasm:build
npm run build
