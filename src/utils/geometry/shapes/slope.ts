import * as THREE from 'three';
import type { ShapeConfig } from '../types';

export const slope: ShapeConfig = {
  id: 'slope',
  name: 'Slope',
  svgPath: 'M 6,26 L 26,26 L 26,6 Z',
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
  },
  getTopSurfaceAt: (x, w, h) => ({
    y: h * (x / w),
    tilt: Math.atan2(h, w),
  }),
};
