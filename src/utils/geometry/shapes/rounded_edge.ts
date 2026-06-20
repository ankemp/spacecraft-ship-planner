import * as THREE from 'three';
import type { ShapeConfig } from '../types';

export const rounded_edge: ShapeConfig = {
  id: 'rounded_edge',
  name: 'Rounded Edge',
  svgPath: 'M 6,26 L 6,22 Q 6,6 11,6 L 26,6 L 26,26 Z',
  generateGeometry(w: number, h: number, d: number) {
    const sz = d / 3.0;
    const sy = h;

    const profile: number[][] = [];
    profile.push([0, 0]);
    profile.push([3.0 * sz, 0]);
    profile.push([3.0 * sz, h]);
    profile.push([0.8 * sz, h]);

    const steps = 12;
    for (let i = steps - 1; i >= 0; i--) {
      const theta = (i / (steps - 1)) * (Math.PI / 2);
      const z = 0.8 * sz * (1 - Math.cos(theta));
      const y = 0.2 * sy + 0.8 * sy * Math.sin(theta);
      if (i === steps - 1) continue; // Avoid duplicating [0.8 * sz, h]
      profile.push([z, y]);
    }

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
