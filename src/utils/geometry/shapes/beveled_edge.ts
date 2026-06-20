import * as THREE from 'three';
import type { ShapeConfig } from '../types';

export const beveled_edge: ShapeConfig = {
  id: 'beveled_edge',
  name: 'Beveled Edge',
  svgPath: 'M 6,26 L 6,22 L 11,6 L 26,6 L 26,26 Z',
  generateGeometry(w: number, h: number, d: number) {
    const sz = d / 3.0;
    const sy = h;
    const profile = [
      [0, 0],
      [3.0 * sz, 0],
      [3.0 * sz, h],
      [0.8 * sz, h],
      [0, 0.2 * sy],
    ];

    const N = profile.length;
    const vertices: number[][] = [];

    // Left cap (x = 0)
    for (let i = 0; i < N; i++) {
      vertices.push([0, profile[i][1], profile[i][0]]);
    }
    // Right cap (x = w)
    for (let i = 0; i < N; i++) {
      vertices.push([w, profile[i][1], profile[i][0]]);
    }

    const indices: number[] = [];

    // Left cap triangulation (CCW facing -X)
    for (let i = 1; i < N - 1; i++) {
      indices.push(0, i, i + 1);
    }

    // Right cap triangulation (CW facing +X)
    for (let i = 1; i < N - 1; i++) {
      indices.push(N, i + 1 + N, i + N);
    }

    // Side panels connection
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N;
      indices.push(i, i + N, j + N);
      indices.push(i, j + N, j);
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
