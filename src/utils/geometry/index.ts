import * as THREE from 'three';
import { SHAPE_CONFIGS } from './shapes';
import type { ActiveShapeId, TopSurfaceInfo } from './types';

export * from './types';
export { SHAPE_CONFIGS } from './shapes';

const geometryCache = new Map<string, THREE.BufferGeometry>();

export function getBufferGeometry(
  shape = 'full',
  w: number,
  h: number,
  d: number,
  flipX = false,
  flipY = false,
  flipZ = false
): THREE.BufferGeometry {
  const key = `${shape}_${w}_${h}_${d}_${flipX ? '1' : '0'}_${flipY ? '1' : '0'}_${flipZ ? '1' : '0'}`;
  const cached = geometryCache.get(key);
  if (cached) return cached;

  const config = (shape in SHAPE_CONFIGS)
    ? SHAPE_CONFIGS[shape as ActiveShapeId]
    : SHAPE_CONFIGS.full;
  const geom = config.generateGeometry(w, h, d);

  let finalGeom = geom;

  if (flipX || flipY || flipZ) {
    const geomClone = geom.clone();
    const posAttr = geomClone.getAttribute('position') as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    // Apply mirroring
    for (let i = 0; i < arr.length; i += 3) {
      if (flipX) arr[i] = w - arr[i];
      if (flipY) arr[i + 1] = h - arr[i + 1];
      if (flipZ) arr[i + 2] = d - arr[i + 2];
    }

    // If winding order is inverted (odd number of flips), reverse the triangle index order to keep normals facing outward
    const isWindingInverted = (flipX ? 1 : 0) ^ (flipY ? 1 : 0) ^ (flipZ ? 1 : 0);
    if (isWindingInverted) {
      const indexAttr = geomClone.getIndex();
      if (indexAttr) {
        const indices = indexAttr.array.slice() as Uint16Array | Uint32Array;
        for (let i = 0; i < indices.length; i += 3) {
          const temp = indices[i + 1];
          indices[i + 1] = indices[i + 2];
          indices[i + 2] = temp;
        }
        geomClone.setIndex(new THREE.BufferAttribute(indices, 1));
      } else {
        // Non-indexed: swap vertex 1 and vertex 2 of each triangle
        for (let i = 0; i < arr.length; i += 9) {
          for (let j = 0; j < 3; j++) {
            const temp = arr[i + 3 + j];
            arr[i + 3 + j] = arr[i + 6 + j];
            arr[i + 6 + j] = temp;
          }
        }
      }
    }

    posAttr.needsUpdate = true;
    geomClone.computeVertexNormals();
    finalGeom = geomClone;
  }

  geometryCache.set(key, finalGeom);
  return finalGeom;
}

/**
 * Evaluates the top surface height (y) and Z-axis tilt (in radians)
 * at a given local X coordinate for a specific block shape.
 */
export function getTopSurfaceAt(
  shape: ActiveShapeId,
  x: number,
  w: number,
  h: number,
  flipX = false
): TopSurfaceInfo {
  const xEval = flipX ? (w - x) : x;
  const config = SHAPE_CONFIGS[shape] || SHAPE_CONFIGS.full;
  const { y, tilt: initialTilt } = config.getTopSurfaceAt
    ? config.getTopSurfaceAt(xEval, w, h)
    : { y: h, tilt: 0 };

  const tilt = flipX ? -initialTilt : initialTilt;
  return { y, tilt };
}

/**
 * Retrieves the 2D SVG path representing the given shape's cross section.
 */
export function getShapeSvgPath(shapeId: ActiveShapeId): string {
  const config = SHAPE_CONFIGS[shapeId] || SHAPE_CONFIGS.full;
  return config.svgPath;
}
