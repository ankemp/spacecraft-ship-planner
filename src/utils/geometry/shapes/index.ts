import type { ShapeConfig, ActiveShapeId } from '../types';
import { full } from './full';
import { slope } from './slope';
import { slope_flat } from './slope_flat';

export const SHAPE_CONFIGS: Record<ActiveShapeId, ShapeConfig> = {
  full,
  slope,
  slope_flat,
};
