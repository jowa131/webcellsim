---
name: wasm-core
description: Rust와 WebAssembly를 사용하여 3.5GHz 무선 신호의 Path Loss 및 RSRP를 연산하는 백그라운드 엔진을 개발할 때 호출하십시오.
---
# Wasm Engine Rules
1. Tech Stack: Rust, wasm-bindgen.
2. Domain Logic: 
   - Tx Output: 40dBm, Antenna: Omni(3dBi).
   - RSRP Calculation: RSRP = 40 + 3 - Path_Loss.
   - Material Attenuation: Concrete(-18dB), Drywall(-5dB).
3. Optimization: 최종 목표는 '음영지역 최소화를 위한 다중 안테나 최적화'입니다. Wasm 엔진은 단일 광선(Ray)이 아닌 전체 맵의 RSRP 값을 배열 형태로 매우 빠르게 반환하도록 설계해야 합니다.
