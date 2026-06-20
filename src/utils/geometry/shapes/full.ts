import * as THREE from 'three';
import type { ShapeConfig } from '../types';

export const full: ShapeConfig = {
  id: 'full',
  name: 'Full Block',
  svgPath: 'M 6,26 L 26,26 L 26,6 L 6,6 Z',
  generateGeometry(w: number, h: number, d: number) {
    const geom = new THREE.BoxGeometry(w, h, d);
    geom.translate(w / 2, h / 2, d / 2);
    return geom;
  },
};
