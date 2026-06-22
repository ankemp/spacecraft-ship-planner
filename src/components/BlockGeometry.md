# How to Add New Block Shapes

This document serves as a reference guide for adding custom geometries/shapes to the Spacecraft Shipbuilder.

## Coordinate Conventions

To ensure consistent block snapping, indicators, and shape logic, all custom geometries must strictly adhere to the following coordinate axes conventions:

* **Front-to-Back Axis (X-Axis)**: The X-axis represents the depth/length axis of the ship.
  - $X = 0$ is the **Front-Edge (Front Face)** of the block.
  - $X = w$ is the **Back-Edge (Back Face)** of the block.
  - **Important**: Any ramp (slope), curve, or taper must start rising or tapering at $X = 0$ (the Front).
* **Side-to-Side Width Axis (Z-Axis)**: The Z-axis represents the width/span axis of the ship.
  - $Z = 0$ and $Z = d$ represent the side-to-side width boundaries.
  - The standard width/depth dimension `d` corresponds to the middle number in block names like `8x3x1`.
  - Thus, the Front Face (perpendicular to the X-axis at $X = 0$) has width `d` (along the Z-axis) and is the **"middle number" wide side** (e.g., 3-wide for `8x3x1`, 6-wide for `16x6x2`).
* **Up-Down Axis (Y-Axis)**: $Y = 0$ is the **Bottom** of the block, and $Y = h$ is the **Top**.

### Visual Indicators Requirement

In the 3D builder interface, the **Front-Edge** (the face at $X = 0$, or $X = w$ if flipped X) **MUST always be labeled "Front"** when a block is selected. This requirement applies universally **regardless of the shape of the block or the block type** (e.g. Steel block, Titanium block, Cockpit, Thruster, Wing, etc.) to assist the user in orienting components correctly.

---

## Steps to Add a Shape

1. **Define the shape geometry generator function in [geometry.ts](../utils/geometry.ts)**:
   - For custom vertex-based shapes, create a function that defines its vertices and triangle indices, builds a `THREE.BufferGeometry`, and returns it.
   - For Three.js built-in geometries, instantiate the geometry (e.g., `CylinderGeometry`, `SphereGeometry`), scale/translate it to fit inside the bounding box of `w`, `h`, `d`, and return it.

2. **Add the generator to the `SHAPE_GENERATORS` lookup dictionary in [geometry.ts](../utils/geometry.ts)**:
   ```typescript
   const SHAPE_GENERATORS: Record<ActiveShapeId, (w: number, h: number, d: number) => THREE.BufferGeometry> = {
     full: getBoxGeometry,
     slope: getSlopeGeometry, // register shape id
     ...
   };
   ```

3. **Update the `HULL_SHAPES` configuration array in [blocks.ts](../config/blocks.ts) to expose the new shape to the UI**:
   ```typescript
   export const HULL_SHAPES = [
     { id: 'full', name: 'Full Block' },
     { id: 'slope', name: 'Slope' }, // add your shape here
   ] as const;
   ```

---

## Reference Implementation Examples

Below are reference implementations of custom geometries aligned to the front-to-back X-axis:

### 1. Slope (Ramp)
Rises from height 0 at the front ($X = 0$) to height $h$ at the back ($X = w$).
```typescript
function getSlopeGeometry(w: number, h: number, d: number): THREE.BufferGeometry {
  const vertices = [
    [0, 0, 0], // v0 (bottom-left-front)
    [w, 0, 0], // v1 (bottom-right-front)
    [0, 0, d], // v2 (bottom-left-back)
    [w, 0, d], // v3 (bottom-right-back)
    [w, h, 0], // v4 (top-right-front)
    [w, h, d], // v5 (top-right-back)
  ];
  const indices = [
    // Bottom face (facing -Y)
    0, 3, 2, 0, 1, 3,
    // Right face (facing +X)
    1, 5, 3, 1, 4, 5,
    // Front face (facing -Z)
    0, 4, 1,
    // Back face (facing +Z)
    2, 3, 5,
    // Slope face (facing left-up)
    0, 2, 5, 0, 5, 4,
  ];
  
  const positions: number[] = [];
  for (const idx of indices) {
    positions.push(...vertices[idx]);
  }
  
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.computeVertexNormals();
  return geom;
}
```

### 2. Slope Corner
Slopes up from $X = 0$ (front) and $Z = 0$ (left) to a single apex at the back-right-top `[w, h, d]`.
```typescript
function getSlopeCornerGeometry(w: number, h: number, d: number): THREE.BufferGeometry {
  const vertices = [
    [0, 0, 0], // v0 (bottom-left-front)
    [w, 0, 0], // v1 (bottom-right-front)
    [0, 0, d], // v2 (bottom-left-back)
    [w, 0, d], // v3 (bottom-right-back)
    [w, h, d], // v4 (top-right-back)
  ];
  const indices = [
    // Bottom face (facing -Y)
    0, 2, 3, 0, 3, 1,
    // Back face (facing +Z)
    2, 3, 4,
    // Right face (facing +X)
    1, 4, 3,
    // Slanted face
    0, 1, 4,
    0, 4, 2,
  ];
  
  const positions: number[] = [];
  for (const idx of indices) {
    positions.push(...vertices[idx]);
  }
  
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.computeVertexNormals();
  return geom;
}
```

### 3. Wedge
Tapers from a wide width $d$ at the back ($X = w$) to a single vertical edge/point at the front ($X = 0$).
```typescript
function getWedgeGeometry(w: number, h: number, d: number): THREE.BufferGeometry {
  const vertices = [
    [0, 0, 0], // v0 (bottom-front-left/point)
    [0, h, 0], // v1 (top-front-left/point)
    [w, 0, 0], // v2 (bottom-back-left)
    [w, 0, d], // v3 (bottom-back-right)
    [w, h, 0], // v4 (top-back-left)
    [w, h, d], // v5 (top-back-right)
  ];
  const indices = [
    // Bottom face (facing -Y)
    0, 2, 3,
    // Top face (facing +Y)
    1, 5, 4,
    // Left face (facing -Z)
    0, 4, 2, 0, 1, 4,
    // Back face (facing +X)
    2, 3, 5, 2, 5, 4,
    // Slanted face (facing left-up-front)
    0, 3, 5, 0, 5, 1,
  ];
  
  const positions: number[] = [];
  for (const idx of indices) {
    positions.push(...vertices[idx]);
  }
  
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.computeVertexNormals();
  return geom;
}
```
