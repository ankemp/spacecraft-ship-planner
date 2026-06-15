# Spacecraft Planner V1 - Technical Specification

## 1. Project Overview
The Spacecraft Planner V1 is a web-based Single Page Application (SPA) designed to allow players to architect and plan 3D spacecraft. The application focuses on volumetric layout, spatial collision detection, and automated resource calculation. V1 focuses exclusively on functional geometry and material costs using "Steel" block classes, abstracting away cosmetic shapes.

## 2. Technology Stack
To ensure maximum performance and maintainability by AI agents, the architecture enforces strict separation of concerns between state management, 3D rendering, and UI.

* **Core Framework:** React 18+ (via Vite)
* **3D Rendering Engine:** Three.js via React Three Fiber (R3F)
* **State Management:** Zustand (Immutable state, pure functional selectors)
* **Styling:** Tailwind CSS (Overlay UI, Palettes, BOM Panel)
* **Tooling/AI Hooks:** Model Context Protocol (MCP) for pre-UI structural generation.

---

## 3. Core Data Architecture

### 3.1. Block Dictionary (Static Configuration)
Blocks are predefined with fixed dimensions (`[width, height, depth]`) and associated resource costs.

```json
{
  "BLOCK_DEFINITIONS": {
    "steel_4x3x2": { "dim": [4, 3, 2], "costs": { "smallSteelParts": 2, "supportHardware": 4 } },
    "steel_4x3x1": { "dim": [4, 3, 1], "costs": { "smallSteelParts": 2, "supportHardware": 2 } },
    "steel_6x3x2": { "dim": [6, 3, 2], "costs": { "smallSteelParts": 3, "supportHardware": 6 } },
    "steel_6x3x1": { "dim": [6, 3, 1], "costs": { "smallSteelParts": 3, "supportHardware": 3 } },
    "steel_8x3x2": { "dim": [8, 3, 2], "costs": { "smallSteelParts": 4, "supportHardware": 8 } },
    "steel_8x3x1": { "dim": [8, 3, 1], "costs": { "smallSteelParts": 4, "supportHardware": 4 } }
  }
}

```

### 3.2. Grid & Anchor System

* **Coordinate Space:** Right-handed 3D Cartesian system (Y is up). Base unit = `1`.
* **Placement Anchors:** A block's `position` defines its absolute Minimum X, Minimum Y, and Minimum Z corner—*not* its center. This simplifies integer-based grid snapping and bounds checking.
* **Rotation Vectors:** Must be strictly bounded to 90-degree increments on the Y-axis for V1 (e.g., `[0, 0, 0]`, `[0, 90, 0]`, `[0, 180, 0]`, `[0, 270, 0]`).

### 3.3. State Machine (Zustand Store)

The `shipStore` contains the mutable blueprint of the spacecraft.

```typescript
interface BlockInstance {
  id: string;          // UUID v4
  type: string;        // Key from BLOCK_DEFINITIONS
  position: [number, number, number]; // [X, Y, Z] Anchor
  rotation: [number, number, number]; // Degrees, typically [0, 90|180|270, 0]
}

interface ShipState {
  blocks: BlockInstance[];
  addBlock: (block: BlockInstance) => void;
  removeBlock: (id: string) => void;
  clearShip: () => void;
}

```

---

## 4. Derived Logic & Engine Protocols

### 4.1. Collision Detection (AABB)

Before any `addBlock` action is committed to the store, the engine must perform an Axis-Aligned Bounding Box (AABB) intersection test against all existing `blocks` in the array.

Given a block with calculated dimensions (accounting for rotation) $W, H, D$ and anchor $X, Y, Z$:

1. $X_{min} = X$, $X_{max} = X + W$
2. $Y_{min} = Y$, $Y_{max} = Y + H$
3. $Z_{min} = Z$, $Z_{max} = Z + D$

Two blocks ($A$ and $B$) overlap if and only if:

* $(A.X_{min} < B.X_{max} \text{ and } A.X_{max} > B.X_{min}) \text{ AND }$
* $(A.Y_{min} < B.Y_{max} \text{ and } A.Y_{max} > B.Y_{min}) \text{ AND }$
* $(A.Z_{min} < B.Z_{max} \text{ and } A.Z_{max} > B.Z_{min})$

### 4.2. Bill of Materials (BOM) Calculator

BOM calculation must exist as a pure Zustand selector. It maps over the current `blocks` array, extracts the `costs` from `BLOCK_DEFINITIONS`, and returns an aggregated object. The UI simply subscribes to this selector.

---

## 5. UI / UX Layout

### 5.1. The 3D Canvas

* Occupies `100vw` and `100vh` via absolutely positioned underlying div.
* Contains `OrbitControls` (Pan, Zoom, Rotate).
* Displays an infinite or dynamically sized GridHelper on the XZ plane at $Y=0$.

### 5.2. Toolbars (Overlays)

* **Left Panel (Palette):** Allows selection of the active block type. Triggers state `activeToolType`.
* **Bottom Panel (Controls):** Displays keybindings (e.g., `[R]` to rotate 90 degrees, `[Click]` to place, `[Right Click]` or `[Esc]` to cancel).
* **Right Panel (BOM):** A live-updating list displaying the total required `smallSteelParts` and `supportHardware`.

---

## 6. AI Development Pipeline: Antigravity & Stitch (MCP)

Before UI implementation begins, AI agents must execute the following bootstrapping protocol:

### Phase 1: Pre-Computation via MCP

1. **Antigravity** establishes an MCP connection to **Stitch** (`mcp connect --server stitch-design-service --session spacecraft-planner-v1`).
2. Stitch defines the rigorous JSON schema matching the `ShipState` interface above.
3. Stitch generates three (3) distinct structural baselines strictly adhering to grid, rotation, and non-intersection constraints.
4. Stitch validates the BOM calculations for these models.
5. Stitch persists these to `/src/data/mock-templates/` as `.json` files.

### Phase 2: Frontend Implementation Strategy

1. **Initialize Environment:** Vite + React + TypeScript.
2. **Implement Store:** Write the Zustand store and collision math (pure functions, no UI).
3. **Seed Data:** Load the Stitch-generated templates to verify rendering without interactive placement.
4. **Build Render Layer:** Construct R3F canvas, iterate over `blocks` array to render `BoxGeometry`.
5. **Implement Raycasting & Ghosting:** Connect mouse coordinates to grid intersections. Render a semi-transparent active block.
6. **Interaction Binding:** Connect mouse clicks to the `addBlock` action, conditionally blocked by AABB logic.
