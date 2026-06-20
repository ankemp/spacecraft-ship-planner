import * as THREE from 'three';
import type { ShapeConfig } from '../types';

export const wedge: ShapeConfig = {
  id: 'wedge',
  name: 'Wedge',
  svgPath: 'M 11,6 L 26,6 L 26,25 Z',
  generateGeometry(w: number, h: number, d: number) {
    const sx = w / 4.0;
    const sz = d / 3.0;

    const profile = [
      [0.8 * sx, d],
      [w, 0.2 * sz],
      [w, d],
    ];

    const N = profile.length;
    const vertices: number[][] = [];

    // Bottom cap (y = 0)
    for (let i = 0; i < N; i++) {
      vertices.push([profile[i][0], 0, profile[i][1]]);
    }
    // Top cap (y = h)
    for (let i = 0; i < N; i++) {
      vertices.push([profile[i][0], h, profile[i][1]]);
    }

    const indices: number[] = [];

    // Bottom cap (CW facing -Y)
    for (let i = 1; i < N - 1; i++) {
      indices.push(0, i + 1, i);
    }

    // Top cap (CCW facing +Y)
    for (let i = 1; i < N - 1; i++) {
      indices.push(N, i + N, i + 1 + N);
    }

    // Side walls connection
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N;
      indices.push(i, j + N, j);
      indices.push(i, i + N, j + N);
    }

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
