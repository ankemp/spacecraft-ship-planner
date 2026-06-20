import type { ShapeConfig, ActiveShapeId } from '../types';
import { full } from './full';
import { slope } from './slope';
import { slope_flat } from './slope_flat';
// import { beveled_edge } from './beveled_edge';
// import { double_beveled_edge } from './double_beveled_edge';
// import { beveled_corner } from './beveled_corner';
import { wedge } from './wedge';
import { wedge_flat } from './wedge_flat';
import { rounded_edge } from './rounded_edge';
// import { curved_corner } from './curved_corner';
import { rounded_edge_vertical } from './rounded_edge_vertical';
import { double_rounded_edge } from './double_rounded_edge';
import { curved_slope } from './curved_slope';

export const SHAPE_CONFIGS: Record<ActiveShapeId, ShapeConfig> = {
  full,
  slope,
  slope_flat,
  // beveled_edge,
  // double_beveled_edge,
  // beveled_corner,
  wedge,
  wedge_flat,
  rounded_edge,
  // curved_corner,
  rounded_edge_vertical,
  double_rounded_edge,
  curved_slope,
};
