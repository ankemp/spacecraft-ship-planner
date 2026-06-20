import * as THREE from 'three';
import type { ShapeConfig } from '../types';

export const beveled_corner: ShapeConfig = {
  id: 'beveled_corner',
  name: 'Beveled Corner',
  svgPath: 'M 11,6 L 26,6 L 26,22 L 11,26 Z',
  generateGeometry(w: number, h: number, d: number) {
    const sz = d / 3.0;

    const vertices = [
      // Left profile (x = 0) with all chamfers
      [0, 0, 0.05 * d],           // v0
      [0, 0, d - 0.05 * d],       // v1
      [0, 0.05 * h, d],           // v2
      [0, 0.9 * h, d],            // v3
      [0, h, d - 0.1 * d],        // v4
      [0, h, 0.85 * sz],          // v5
      [0, 0.95 * h, 0.75 * sz],   // v6
      [0, 0.22 * h, 0.05 * sz],   // v7
      [0, 0.15 * h, 0],           // v8
      [0, 0.05 * h, 0],           // v9

      // Right/back/front transition vertices
      [w, 0, d - 0.05 * d],       // v10 (bottom-back-right chamfer start)
      [w, 0.05 * h, d],           // v11 (bottom-back-right chamfer end)
      [w, 0.9 * h, d],            // v12 (top-back-right chamfer start)
      [w, h, d - 0.1 * d],        // v13 (top-back-right chamfer end)
      [w, 0, d - 0.5 * sz],       // v14 (front-right base point)
      [w / 2, 0, 0],              // v15 (front-center base point)
    ];

    const indices: number[] = [
      // 1. Left Face (x = 0)
      0, 1, 2,
      0, 2, 3,
      0, 3, 4,
      0, 4, 5,
      0, 5, 6,
      0, 6, 7,
      0, 7, 8,
      0, 8, 9,

      // 2. Back Face (z = d)
      2, 11, 12,
      2, 12, 3,

      // 3. Bottom-Right Chamfer Face
      1, 10, 11,
      1, 11, 2,

      // 4. Top-Right Chamfer Face
      3, 12, 13,
      3, 13, 4,

      // 5. Top Deck Face (y = h)
      4, 13, 5,

      // 6. Base Face (y = 0)
      0, 10, 1,
      0, 14, 10,
      0, 15, 14,

      // 7. Right Face (x = w)
      14, 13, 12,
      14, 12, 11,
      14, 11, 10,

      // 8. Diagonal transition faces
      5, 13, 6,
      6, 13, 14,
      6, 14, 7,
      7, 14, 15,
      7, 15, 8,
      8, 15, 9,
      9, 15, 0,
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
};
