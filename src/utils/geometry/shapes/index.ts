import type { ShapeConfig, ActiveShapeId } from '../types';
import { full } from './full';
import { slope } from './slope';
import { slope_flat } from './slope_flat';
import { beveled_edge } from './beveled_edge';
import { double_beveled_edge } from './double_beveled_edge';
import { beveled_corner } from './beveled_corner';
import { wedge } from './wedge';
import { wedge_flat } from './wedge_flat';
import { rounded_edge } from './rounded_edge';
import { rounded_corner } from './rounded_corner';
import { rounded_edge_vertical } from './rounded_edge_vertical';
import { double_rounded_edge } from './double_rounded_edge';
import { rounded_slope } from './rounded_slope';

export const SHAPE_CONFIGS: Record<ActiveShapeId, ShapeConfig> = {
  beveled_corner,
  beveled_edge,
  rounded_corner,
  double_beveled_edge,
  double_rounded_edge,
  full,
  rounded_edge,
  rounded_edge_vertical,
  rounded_slope,
  slope,
  slope_flat,
  wedge,
  wedge_flat,
};
