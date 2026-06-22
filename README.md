# Spacecraft Shipbuilder

A high-performance, web-based 3D design and planning utility for engineering modular spacecraft. Built on a volumetric grid system, it enables players to plan layout physics, structural integrity, power grids, and thermal profiles prior to in-game ship deployment.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Core Simulation & Game Mechanics](#core-simulation--game-mechanics)
   - [Grid & Coordinate System](#grid--coordinate-system)
   - [Adjacency & Connectivity (BFS)](#adjacency--connectivity-bfs)
   - [Orientation & Binary Flips](#orientation--binary-flips)
   - [System Support (SP) & Efficiency](#system-support-sp--efficiency)
   - [Power & Energy Systems](#power--energy-systems)
   - [Thermal & Dissipation Systems](#thermal--dissipation-systems)
   - [Structural Integrity & Hull Strength](#structural-integrity--hull-strength)
   - [Flight Dynamics & Boost](#flight-dynamics--boost)
   - [Cosmetic Hull Shapes](#cosmetic-hull-shapes)
3. [Technology Stack](#technology-stack)
4. [Extending Block Geometries](#extending-block-geometries)
   - [Coordinate Conventions](#coordinate-conventions)
   - [Steps to Add a Shape](#steps-to-add-a-shape)
   - [Shape Code Boilerplate](#shape-code-boilerplate)
5. [Performance Architecture & Potato Mode](#performance-architecture--potato-mode)
   - [WebGL Context Optimization](#webgl-context-optimization)
   - [On-Demand Rendering](#on-demand-rendering)
   - [Optimization Rules](#optimization-rules)
6. [Testing Strategy](#testing-strategy)
7. [Getting Started & Development](#getting-started--development)

---

## Project Overview

The **Spacecraft Shipbuilder** is a React and Three.js-based Single Page Application (SPA) designed to let players architect 3D spacecraft. The planner focuses on spatial geometry, Axis-Aligned Bounding Box (AABB) collision checks, and real-time physical simulation models. 

Every design is subjected to realistic in-game constraint validations—ensuring the resulting vessel remains structurally sound, powered, and thermally stable.

---

## Core Simulation & Game Mechanics

### Grid & Coordinate System
- **Integer Grid**: All coordinate bounds, offsets, and dimensions utilize integer units.
- **Anchor point**: Block positions are anchored at their absolute minimum bounds: $[X_{min}, Y_{min}, Z_{min}]$.
- **Floor Limit**: Placements cannot occur below the ground plane ($Y = 0$).

### Adjacency & Connectivity (BFS)
- **Contiguous Structure**: Ships must represent a single, contiguous physical body.
- **Face Connection**: Adjacent blocks must share a full physical face. Vertex-to-vertex or edge-to-edge connections are structurally invalid.
- **Cockpit Core dependency**: A Breadth-First Search (BFS) computes connectivity back to the cockpit/core block. Disconnected segments are flagged as invalid.

### Orientation & Binary Flips
- **Binary Flips**: Standard structural blocks do not use arbitrary 3D rotation vectors. Instead, they utilize a predefined base orientation adjusted via three independent binary flags:
  - **Flip X**: Mirrors the block along the East-West axis.
  - **Flip Y**: Mirrors the block along the Up-Down axis (upside down).
  - **Flip Z**: Mirrors the block along the North-South axis.
- **Thruster Rotations**: Thrusters are a key exception and can be rotated in 90-degree increments on their local X-axis to orient forward, lateral, and vertical thrust vectors.

### System Support (SP) & Efficiency
- **SP Providers**: Cockpits, structural blocks, and wings provide System Support (SP).
- **SP Consumers**: Components like thrusters, mining lasers, storage, and weaponry consume SP.
- **Efficiency Formula**: If requirements exceed supply, the ship operates at reduced efficiency:
  $$\text{Efficiency} = \min\left(1.0, \frac{\text{Total SP Provided}}{\text{Total SP Consumed}}\right)$$

### Power & Energy Systems
- **Energy Balance**: Solars, batteries, and fuel generators feed a global power grid.
- **Depletion Penalty**: If consumption exceeds generation and battery reserves are depleted, active components go offline and steering speed is throttled to **~15% of normal**.

### Thermal & Dissipation Systems
- **Global Heat Pool**: Simulated as a single global pool representing the ship's current thermal level.
- **Heat Capacity**: The cumulative thermal energy the ship can absorb before overheating.
- **Interface & Conductivity**: High-conductivity blocks increase the global **heat interface**, speeding up temperature equalization with environmental conditions.
- **Radiators**: Radiators and cockpits actively dissipate heat. If generation exceeds dissipation, thermal capacity fills, eventually causing system damage.

### Structural Integrity & Hull Strength
- **Integrity**: Computed via the **Total Frame to Total Weight** ratio. Heavy blocks (e.g., machinery) require structural frames (Steel, Titanium) to prevent buckling.
- **Hull Strength**: Sum of all block health pools. When Hull HP drops to 0, the ship is disabled.

### Flight Dynamics & Boost
- **Force vs. Thrust**: *Force* denotes engine power limits, while *Thrust* denotes linear force in kilonewtons (kN).
- **Boost Mechanics**: Boosting adds metrics additively to standard operation:
  - $\text{Total Thrust} = \text{Normal Thrust} + \text{Boost Thrust}$
  - $\text{Total Power} = \text{Normal Power} + \text{Boost Power}$
  - $\text{Total Heat} = \text{Normal Heat} + \text{Boost Heat}$

### Cosmetic Hull Shapes
- Selection of cosmetic hull shapes (Slope, Slope Flat, Full Block) is purely visual. They share the same physical collision bounding box and resource stats as standard Full Blocks to prevent structural exploits.

---

## Technology Stack

- **Core Framework**: React 19 + TypeScript (via Vite)
- **3D Graphics Engine**: Three.js mapped via React Three Fiber (R3F) & `@react-three/drei`
- **State Store**: Zustand (immutable actions, pure functional selectors)
- **Styling**: Tailwind CSS v4 (Overlay HUD, Stats panels, BOM indicators)
- **Tooling**: Node.js & Vite dev tooling

---

## Extending Block Geometries

The builder supports extending block shapes (Slopes, Corners, Wedges). All custom geometries are registered in `src/utils/geometry/`.

### Coordinate Conventions
All custom meshes must align to the coordinate system:
- **Depth (X-Axis)**: $X=0$ represents the **Front Face** (labelled "Front" when selected). $X=w$ represents the back edge. Custom slopes or tapers must rise/taper starting from $X=0$.
- **Height (Y-Axis)**: $Y=0$ is the bottom, $Y=h$ is the top.
- **Width (Z-Axis)**: $Z=0$ to $Z=d$ represent side-to-side boundaries.

### Steps to Add a Shape
1. Register the shape identifier in the `HULL_SHAPES` array in [blocks.ts](./src/config/blocks.ts).
2. Create a configuration file `src/utils/geometry/shapes/[shape_id].ts`.
3. Register the config in `SHAPE_CONFIGS` in [index.ts](./src/utils/geometry/shapes/index.ts).

### Shape Code Boilerplate
```typescript
import * as THREE from 'three';
import { ShapeConfig } from '../types';

export const custom_slope: ShapeConfig = {
  id: 'custom_slope',
  name: 'Custom Slope',
  svgPath: 'M 6,26 L 26,26 L 26,6 Z', // 2D SVG Icon
  
  generateGeometry(w: number, h: number, d: number) {
    const vertices = [
      [0, 0, 0], // v0 (bottom-left-front)
      [w, 0, 0], // v1 (bottom-right-front)
      [0, 0, d], // v2 (bottom-left-back)
      [w, 0, d], // v3 (bottom-right-back)
      [w, h, 0], // v4 (top-right-front)
      [w, h, d], // v5 (top-right-back)
    ];
    const indices = [
      0, 3, 2, 0, 1, 3, // Bottom
      1, 5, 3, 1, 4, 5, // Right
      0, 4, 1,          // Front
      2, 3, 5,          // Back
      0, 2, 5, 0, 5, 4, // Slope
    ];
    
    const positions: number[] = [];
    for (const idx of indices) {
      positions.push(...vertices[idx]);
    }
    
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.computeVertexNormals();
    return geom;
  },

  getTopSurfaceAt(x: number, w: number, h: number) {
    return {
      y: h * (x / w),
      tilt: Math.atan2(h, w),
    };
  }
};
```

---

## Performance Architecture & Potato Mode

To support low-specification machines and prevent browser limits on WebGL context bounds (usually capped at 8–16 per page), the builder includes a **Potato Mode**.

### WebGL Context Optimization
Rendering multiple small 3D canvases in sidebar lists forces the browser to instantiate multiple WebGL contexts. Potato Mode dynamically swaps all R3F canvases in UI panels with lightweight vector-based SVG graphics (`Shape2DPreview`), keeping the total context count to exactly **1** (the main viewport).

### On-Demand Rendering
To save GPU and CPU resources:
- The canvas uses `frameloop="demand"`. 
- Frameloop invalidations are driven by the `<Invalidator>` subscribing only to state mutations that physically impact visual representations.
- Heavy post-processing, env lights (`Environment preset="city"`), and rotating canvas icons are completely disabled.

### Optimization Rules
- **Gate non-essentials**: wrap cosmetic details in `{!potatoMode && <Component />}`.
- **Frame updates**: Never trigger React or Zustand state writes inside `useFrame`.
- **Derived Selectors**: Wrap calculations like BFS connectivity, SP efficiency, and BOM aggregates in `useMemo` hooks keyed on the `blocks` array.

---

## Testing Strategy

To ensure stability across modular shipbuilding math, collision systems, and connectivity algorithms, the codebase employs a unit testing strategy powered by **Vitest**.

### 1. Test Architecture & Environment
- **Runner**: [Vitest](https://vitest.dev/) acts as the native testing framework, integrating directly with our Vite compiler config.
- **Environment**: A lightweight, pure Node.js test environment is used for maximum speed. Browser APIs (like `window.location` or `localStorage`) are mocked or safely ignored using environment guards.
- **Location**: Test files reside in `__tests__/` subdirectories adjacent to the target modules.

### 2. Core Test Suites
We maintain test coverage across critical application layers:
- **Calculation Engine** ([shipStats.test.ts](./src/utils/__tests__/shipStats.test.ts)): Validates the correctness of formulas (SP efficiency limits, power balances, global heat pool balances, and structural frame ratios) and verifies thruster boost additive math according to [IN_GAME_SPEC.md](./IN_GAME_SPEC.md).
- **Adjacency & Connectivity (BFS)** ([shipStats.test.ts](./src/utils/__tests__/shipStats.test.ts)): Tests face-to-face adjacency checks (excluding invalid edge/corner contact) and checks that structural BFS connectivity traversal correctly marks floating block segments.
- **Serialization** ([serialization.test.ts](./src/utils/__tests__/serialization.test.ts)): Confirms URL-safe base64 string round-trips correctly preserve ship designs (including block types, coords, rotations, colors, custom shapes, and binary flips) and verify robust crash-prevention for invalid strings.
- **Geometry & Collision** ([shipStore.test.ts](./src/store/__tests__/shipStore.test.ts)): Validates vertex rotation calculations in `getBlockBounds` and overlap detection inside `isBoundsColliding`.
- **Store Actions** ([shipStore.test.ts](./src/store/__tests__/shipStore.test.ts)): Simulates Zustand store mutations like adding/deleting blocks, preventing placement overlap, and enforcing the single-cockpit limit.

### 3. Test Execution
- **Run Tests (CI/CD)**: `npm run test` (runs tests once).
- **Interactive Watch Mode**: `npm run test:watch` (automatically re-runs tests on file edits).

---

## Getting Started & Development

### Installation
Clone the repository and install npm packages:
```bash
npm install
```

### Dev Server
Launch Vite development server with Hot Module Replacement (HMR):
```bash
npm run dev
```

### Build Production Bundle
To build the application:
```bash
npm run build
```

### Export Icons & Shapes
Pre-render UI preview assets from geometry files:
```bash
npm run export-shapes
```

### Testing
Run the Vitest unit tests:
```bash
npm run test
```

### Linting
Enforce code quality with ESLint rules:
```bash
npm run lint
```
