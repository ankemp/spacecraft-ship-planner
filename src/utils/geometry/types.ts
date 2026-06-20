import * as THREE from 'three';
import { HULL_SHAPES } from '../../config/blocks';

export type ActiveShapeId = (typeof HULL_SHAPES)[number]['id'];

export interface ShapeConfig {
  id: ActiveShapeId;
  name: string;
  svgPath: string;
  generateGeometry: (w: number, h: number, d: number) => THREE.BufferGeometry;
  getTopSurfaceAt?: (x: number, w: number, h: number) => { y: number; tilt: number };
}

export interface TopSurfaceInfo {
  y: number;
  tilt: number;
}
