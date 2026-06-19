import { useMemo } from 'react';
import * as THREE from 'three';
import { HULL_SHAPES } from '../config/blocks';

type ActiveShapeId = (typeof HULL_SHAPES)[number]['id'];

/**
 * FOR NEW BLOCK SHAPES & EXAMPLES:
 * See src/components/BlockGeometry.md for reference implementation examples and instructions.
 */

function getBoxGeometry(w: number, h: number, d: number): THREE.BufferGeometry {
  const geom = new THREE.BoxGeometry(w, h, d);
  geom.translate(w / 2, h / 2, d / 2);
  return geom;
}

function getSlopeGeometry(w: number, h: number, d: number): THREE.BufferGeometry {
  const vertices = [
    [0, 0, 0], // v0 (bottom-left-front)
    [w, 0, 0], // v1 (bottom-right-front)
    [0, 0, d], // v2 (bottom-left-back)
    [w, 0, d], // v3 (bottom-right-back)
    [w, h, 0], // v4 (top-right-front)
    [w, h, d], // v5 (top-right-back)
  ];
  // Winding order: counter-clockwise when viewed from outside of mesh
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

function getSlopeFlatGeometry(w: number, h: number, d: number): THREE.BufferGeometry {
  const transitionX = Math.min(w, 1);
  const vertices = [
    [0, 0, 0],         // v0 (bottom-left-front)
    [w, 0, 0],         // v1 (bottom-right-front)
    [0, 0, d],         // v2 (bottom-left-back)
    [w, 0, d],         // v3 (bottom-right-back)
    [transitionX, h, 0],     // v4 (slope-top-front transition)
    [transitionX, h, d],     // v5 (slope-top-back transition)
    [w, h, 0],         // v6 (top-right-front)
    [w, h, d],         // v7 (top-right-back)
  ];
  // Winding order: counter-clockwise when viewed from outside of mesh
  const indices = [
    // Bottom face (facing -Y)
    0, 3, 2,  0, 1, 3,
    // Right face (facing +X)
    1, 7, 3,  1, 6, 7,
    // Front face (facing -Z)
    0, 4, 1,  1, 4, 6,
    // Back face (facing +Z)
    2, 3, 5,  3, 7, 5,
    // Slope face (facing left-up)
    0, 2, 5,  0, 5, 4,
    // Flat top face (facing +Y)
    4, 5, 7,  4, 7, 6,
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


const SHAPE_GENERATORS: Record<ActiveShapeId, (w: number, h: number, d: number) => THREE.BufferGeometry> = {
  full: getBoxGeometry,
  slope: getSlopeGeometry,
  slope_flat: getSlopeFlatGeometry,
};

interface BlockGeometryProps {
  shape?: string;
  w: number;
  h: number;
  d: number;
  flipX?: boolean;
  flipY?: boolean;
  flipZ?: boolean;
}

export function BlockGeometry({ shape = 'full', w, h, d, flipX = false, flipY = false, flipZ = false }: BlockGeometryProps) {
  const geometry = useMemo(() => {
    const generator = (shape in SHAPE_GENERATORS)
      ? SHAPE_GENERATORS[shape as ActiveShapeId]
      : SHAPE_GENERATORS.full;
    const geom = generator(w, h, d);

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
      return geomClone;
    }

    return geom;
  }, [shape, w, h, d, flipX, flipY, flipZ]);

  return <primitive object={geometry} attach="geometry" />;
}

