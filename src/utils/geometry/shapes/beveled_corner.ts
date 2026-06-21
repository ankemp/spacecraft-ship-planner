import * as THREE from 'three';
import type { ShapeConfig } from '../types';

export const beveled_corner: ShapeConfig = {
  id: 'beveled_corner',
  name: 'Beveled Corner',
  svgPath: 'M 11,6 L 26,6 L 26,22 L 11,26 Z',
  generateGeometry(w: number, h: number, d: number) {
    const sx = w / 3.0;
    const sy = h / 3.0;
    const sz = d / 3.0;

    const rx = 0.5 * sx;
    const rz = 0.5 * sz;
    const ry = 1.0 * sy;

    const vertices: number[][] = [];
    function addVertex(vx: number, vy: number, vz: number): number {
      vertices.push([vx, vy, vz]);
      return vertices.length - 1;
    }

    const S = 1;
    const capIdx: number[][] = Array.from({ length: S + 1 }, () => []);

    // Apex at y = h
    const apex = addVertex(rx, h, rz);

    // Create Cap Grid (Linear interpolation)
    for (let i = 0; i <= S; i++) {
      const t_u = i / S;
      for (let j = 0; j <= S; j++) {
        if (j === S) {
          capIdx[i][j] = apex;
          continue;
        }
        const t_v = j / S;
        const vx = rx * (t_u * (1 - t_v) + t_v);
        const vz = rz * ((1 - t_u) * (1 - t_v) + t_v);
        const vy = 2.0 * sy + ry * t_v;
        capIdx[i][j] = addVertex(vx, vy, vz);
      }
    }

    // Base Cap vertices at y = 0
    const baseCap: number[] = [];
    for (let i = 0; i <= S; i++) {
      const t_u = i / S;
      baseCap.push(addVertex(t_u * rx, 0, (1 - t_u) * rz));
    }

    // Other Base vertices
    const baseFR = addVertex(w, 0, 0);
    const baseBR = addVertex(w, 0, d);
    const baseBL = addVertex(0, 0, d);

    // Lip top vertices
    const lipFR = addVertex(w, 2.0 * sy, 0);
    const lipBR = addVertex(w, 2.0 * sy, d);
    const lipBL = addVertex(0, 2.0 * sy, d);
    const lipL0 = addVertex(0, 2.0 * sy, rz);

    // Top Deck Vertices at y = h
    const T0 = addVertex(0, h, rz);
    const T1 = addVertex(0, h, d);
    const T2 = addVertex(w, h, d);
    const T3 = addVertex(w, h, rz);

    // Front Slope Profile at x = w
    const frontSlopeR: number[] = [];
    for (let j = 0; j <= S; j++) {
      if (j === 0) {
        frontSlopeR.push(lipFR);
        continue;
      }
      if (j === S) {
        frontSlopeR.push(T3);
        continue;
      }
      const t_v = j / S;
      const vy = 2.0 * sy + ry * t_v;
      const vz = rz * t_v;
      frontSlopeR.push(addVertex(w, vy, vz));
    }

    const indices: number[] = [];

    // 1. Cap Triangles
    for (let i = 0; i < S; i++) {
      for (let j = 0; j < S; j++) {
        const A = capIdx[i][j];
        const B = capIdx[i + 1][j];
        const C = capIdx[i + 1][j + 1];
        const D = capIdx[i][j + 1];

        if (A !== C && A !== B && B !== C) {
          indices.push(A, C, B);
        }
        if (A !== D && A !== C && D !== C) {
          indices.push(A, D, C);
        }
      }
    }

    // 2. Base Cap Lip (Vertical quads)
    for (let i = 0; i < S; i++) {
      const bA = baseCap[i];
      const bB = baseCap[i + 1];
      const tA = capIdx[i][0];
      const tB = capIdx[i + 1][0];

      indices.push(bA, tB, tA);
      indices.push(bA, bB, tB);
    }

    // 3. Front-Right Lip
    indices.push(baseCap[S], baseFR, lipFR);
    indices.push(baseCap[S], lipFR, capIdx[S][0]);

    // 4. Right Lip
    indices.push(baseFR, baseBR, lipBR);
    indices.push(baseFR, lipBR, lipFR);

    // 5. Back Lip
    indices.push(baseBR, baseBL, lipBL);
    indices.push(baseBR, lipBL, lipBR);

    // 6. Left Lip
    indices.push(baseBL, baseCap[0], lipL0);
    indices.push(baseBL, lipL0, lipBL);

    // 7. Left Wall above lip
    indices.push(lipL0, T1, T0);
    indices.push(lipL0, lipBL, T1);

    // 8. Back Wall above lip
    indices.push(lipBL, T2, T1);
    indices.push(lipBL, lipBR, T2);

    // 9. Right Wall above lip (Fanned to front slope curve)
    for (let j = 0; j < S; j++) {
      indices.push(lipBR, frontSlopeR[j], frontSlopeR[j + 1]);
    }
    indices.push(lipBR, T3, T2);

    // 10. Left transition curve gap filler (at z = rz)
    for (let j = 0; j < S; j++) {
      indices.push(T0, capIdx[0][j + 1], capIdx[0][j]);
    }

    // 11. Front Slope
    for (let j = 0; j < S; j++) {
      const tA = capIdx[S][j];
      const tB = capIdx[S][j + 1];
      const rA = frontSlopeR[j];
      const rB = frontSlopeR[j + 1];

      indices.push(tA, rB, rA);
      indices.push(tA, tB, rB);
    }

    // 12. Base Face (facing -Y)
    const baseVerts = [
      baseCap[0],
      ...baseCap.slice(1),
      baseFR,
      baseBR,
      baseBL,
    ];
    const numBase = baseVerts.length;
    for (let k = 1; k < numBase - 1; k++) {
      indices.push(baseVerts[0], baseVerts[k + 1], baseVerts[k]);
    }

    // 13. Top Deck (facing +Y)
    indices.push(T0, T3, T2);
    indices.push(T0, T2, T1);

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
