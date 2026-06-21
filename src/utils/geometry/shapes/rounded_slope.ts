import * as THREE from 'three';
import type { ShapeConfig } from '../types';

export const rounded_slope: ShapeConfig = {
  id: 'rounded_slope',
  name: 'Rounded Slope',
  svgPath: 'M 6,26 L 6,12.67 Q 6,6 12.67,6 L 26,6 L 26,26 Z',
  generateGeometry(w: number, h: number, d: number) {
    const sx = w / 3.0;
    const sy = h / 3.0;

    const profile: number[][] = [];
    profile.push([0, 0]);
    profile.push([w, 0]);
    profile.push([w, h]);
    profile.push([0.5 * sx, h]);

    const steps = 12;
    for (let i = steps - 1; i >= 0; i--) {
      const theta = (i / (steps - 1)) * (Math.PI / 2);
      const x = 0.5 * sx * (1 - Math.cos(theta));
      const y = 2.0 * sy + 1.0 * sy * Math.sin(theta);
      if (i === steps - 1) continue; // Avoid duplicating [0.5 * sx, h]
      profile.push([x, y]);
    }

    const N = profile.length;
    const vertices: number[][] = [];

    // Back cap (z = 0)
    for (let i = 0; i < N; i++) {
      vertices.push([profile[i][0], profile[i][1], 0]);
    }
    // Front cap (z = d)
    for (let i = 0; i < N; i++) {
      vertices.push([profile[i][0], profile[i][1], d]);
    }

    const indices: number[] = [];

    // Back cap triangulation (CCW facing -Z)
    for (let i = 1; i < N - 1; i++) {
      indices.push(0, i, i + 1);
    }

    // Front cap triangulation (CW facing +Z)
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
  getTopSurfaceAt(x: number, w: number, h: number) {
    const sx = w / 3.0;
    const sy = h / 3.0;
    const rx = 0.5 * sx;
    const ry = 1.0 * sy;

    if (x >= rx) {
      return { y: h, tilt: 0 };
    }

    const u = Math.min(1, Math.max(0, 1 - x / rx));
    const sin_theta = Math.sqrt(1 - u * u);
    const cos_theta = u;

    const y = 2.0 * sy + ry * sin_theta;
    const tilt = Math.atan2(ry * cos_theta, rx * sin_theta);

    return { y, tilt };
  },
};
