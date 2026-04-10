---
name: canvas-ui
description: HTML5 Canvas를 이용해 도면을 그리고, Wasm에서 받아온 데이터로 RSRP 히트맵을 렌더링할 때 호출하십시오.
---
# Canvas Rendering Rules
1. Interaction: 사용자가 Canvas 위를 드래그하여 안테나(Tx) 위치를 변경할 수 있어야 합니다.
2. Heatmap Render: [CRITICAL] 광선(Ray)을 선으로 그리지 마십시오. Wasm 연산 결과를 바탕으로 5x5 px 단위의 '히트맵(Heatmap)'을 그리십시오.
3. Colors: 강전계(-50 dBm)는 Red, 약전계(-120 dBm)는 Blue 계열로 표현하고 우측에 범례를 표시하세요.
