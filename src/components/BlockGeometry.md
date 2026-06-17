# How to Add New Block Shapes

This document serves as a reference guide for adding custom geometries/shapes to the Spacecraft Shipbuilder.

## Steps to Add a Shape

1. **Define the shape geometry generator function in `BlockGeometry.tsx`**:
   - For custom vertex-based shapes, create a function that defines its vertices and triangle indices, builds a `THREE.BufferGeometry`, and returns it.
   - For Three.js built-in geometries, instantiate the geometry (e.g., `CylinderGeometry`, `SphereGeometry`), scale/translate it to fit inside the bounding box of `w`, `h`, `d`, and return it.

2. **Add the generator to the `SHAPE_GENERATORS` lookup dictionary in `BlockGeometry.tsx`**:
   ```typescript
   const SHAPE_GENERATORS: Record<ActiveShapeId, (w: number, h: number, d: number) => THREE.BufferGeometry> = {
     full: getBoxGeometry,
     slope: getSlopeGeometry, // register shape id
     ...
   };
   ```

3. **Update the `HULL_SHAPES` configuration array in `src/config/blocks.ts` to expose the new shape to the UI**:
   ```typescript
   export const HULL_SHAPES = [
     { id: 'full', name: 'Full Block' },
     { id: 'slope', name: 'Slope' }, // add your shape here
   ] as const;
   ```

---

## Reference Implementation Examples

Below are reference implementations of custom geometries that you can use as starting points:

### 1. Slope (Ramp)
```typescript
function getSlopeGeometry(w: number, h: number, d: number): THREE.BufferGeometry {
  const vertices = [
    [0, 0, 0], // bottom-left-front
    [w, 0, 0], // bottom-right-front
    [0, 0, d], // bottom-left-back
    [w, 0, d], // bottom-right-back
    [0, h, d], // top-left-back
    [w, h, d], // top-right-back
  ];
  const indices = [
    0, 2, 3,  0, 3, 1, // bottom face
    2, 3, 5,  2, 5, 4, // back face
    0, 4, 2,           // left face (triangle)
    1, 3, 5,           // right face (triangle)
    0, 1, 5,  0, 5, 4, // slope face
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

### 2. Corner
```typescript
function getCornerGeometry(w: number, h: number, d: number): THREE.BufferGeometry {
  const vertices = [
    [0, 0, 0], // front-left-bottom
    [w, 0, 0], // front-right-bottom
    [0, 0, d], // back-left-bottom
    [w, 0, d], // back-right-bottom
    [0, h, d], // back-left-top (apex)
  ];
  const indices = [
    0, 2, 3,  0, 3, 1, // bottom face
    2, 3, 4,           // back face (triangle)
    0, 4, 2,           // left face (triangle)
    0, 1, 4,           // front slope face (triangle)
    1, 3, 4,           // right slope face (triangle)
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

### 3. Pyramid
```typescript
function getPyramidGeometry(w: number, h: number, d: number): THREE.BufferGeometry {
  const vertices = [
    [0, 0, 0],   // front-left-bottom
    [w, 0, 0],   // front-right-bottom
    [0, 0, d],   // back-left-bottom
    [w, 0, d],   // back-right-bottom
    [w / 2, h, d / 2], // center-top (apex)
  ];
  const indices = [
    0, 2, 3,  0, 3, 1, // bottom face
    0, 1, 4,           // front face (triangle)
    3, 2, 4,           // back face (triangle)
    2, 0, 4,           // left face (triangle)
    1, 3, 4,           // right face (triangle)
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

### 4. Cylinder
```typescript
function getCylinderGeometry(w: number, h: number, d: number): THREE.BufferGeometry {
  const geom = new THREE.CylinderGeometry(1, 1, 1, 32);
  geom.scale(w / 2, h, d / 2);
  geom.translate(w / 2, h / 2, d / 2);
  return geom;
}
```
