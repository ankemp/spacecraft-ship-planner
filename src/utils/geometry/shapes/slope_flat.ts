import * as THREE from 'three';
import type { ShapeConfig } from '../types';

export const slope_flat: ShapeConfig = {
  id: 'slope_flat',
  name: 'Slope Flat',
  svgPath: 'M 6,26 L 26,26 L 26,6 L 16,6 Z',
  generateGeometry(w: number, h: number, d: number) {
    const transitionX = Math.max(0, w - 3);
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
  },
  getTopSurfaceAt: (x, w, h) => {
    const run = Math.max(0, w - 3);
    if (run === 0) {
      return { y: h, tilt: 0 };
    }
    if (x < run) {
      return { y: h * (x / run), tilt: Math.atan2(h, run) };
    }
    return { y: h, tilt: 0 };
  },
};
