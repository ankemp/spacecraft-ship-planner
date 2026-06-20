# Geometry Shapes Module

This directory contains the definitions, 3D buffer geometries, surface calculations, and SVG paths for all block shapes available in the shipbuilder.

## Directory Structure

```
src/utils/geometry/
├── index.ts           # Core caching, mirroring, and public API helpers
├── types.ts           # TypeScript interfaces and type definitions
├── README.md          # This file
└── shapes/            # Directory containing individual shape configurations
    ├── index.ts       # Registers and exports the SHAPE_CONFIGS registry map
    ├── full.ts        # Full block shape config
    ├── slope.ts       # Slope shape config
    └── ...
```

---

## How to Add a New Shape

To add a new shape (e.g. `my_new_shape`), follow these three steps:

### 1. Register the Shape ID in Config
First, add your shape to the `HULL_SHAPES` array in [blocks.ts](file:///c:/Users/Andrew/workspace/spacecraft-shipbuilder/src/config/blocks.ts):
```typescript
export const HULL_SHAPES = [
  ...
  { id: 'my_new_shape', name: 'My New Shape' },
] as const;
```

### 2. Create the Shape File
Create a new file `src/utils/geometry/shapes/my_new_shape.ts` using the boilerplate below.

### 3. Register in Shapes Index
Import and add your shape config to the `SHAPE_CONFIGS` map in `src/utils/geometry/shapes/index.ts`:
```typescript
import { my_new_shape } from './my_new_shape';

export const SHAPE_CONFIGS: Record<ActiveShapeId, ShapeConfig> = {
  ...
  my_new_shape,
};
```

---

## Shape Boilerplate

Use this template as a starting point when adding a new shape:

```typescript
import * as THREE from 'three';
import { ShapeConfig } from '../types';

export const my_new_shape: ShapeConfig = {
  id: 'my_new_shape',
  name: 'My New Shape',
  // SVG path used for 2D interface icons and previews (32x32 viewport recommended)
  svgPath: 'M 6,26 L 26,26 L 26,6 Z',
  
  // Generates the 3D BufferGeometry for three.js rendering
  generateGeometry(w: number, h: number, d: number) {
    const vertices = [
      [0, 0, 0], // v0
      [w, 0, 0], // v1
      [0, 0, d], // v2
      [w, 0, d], // v3
      [w, h, d], // v4
    ];
    // Winding order must be counter-clockwise when viewed from the outside of the mesh
    const indices = [
      0, 2, 3, 0, 3, 1, // Bottom
      1, 4, 3,          // Right
      0, 1, 4,          // Slanted
      0, 4, 2,          // Slanted
      2, 3, 4,          // Back
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

  // Optional: Used if blocks can be attached/snapped onto this shape's top surface.
  // Returns the local height (y) and slope tilt (radians) at a given local X offset.
  getTopSurfaceAt(x: number, w: number, h: number) {
    return {
      y: h * (x / w),
      tilt: Math.atan2(h, w),
    };
  },
};
```
