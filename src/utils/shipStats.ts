import { BLOCK_DEFINITIONS } from '../config/blocks';
import { getBlockBounds } from '../store/shipStore';
import type { BlockInstance, BlockBounds } from '../store/shipStore';

export interface DerivedShipStats {
  // Raw sums of all stats
  raw: Record<string, number>;

  // §4 — SP & Efficiency
  spProvided: number;
  spConsumed: number;
  efficiency: number; // min(1, provided/consumed), 1 when consumed=0

  // §5 — Power Balance
  powerGenerated: number;
  powerConsumed: number;
  powerBalance: number;
  hasBattery: boolean;
  powerStorage: number;
  maxChargeSpeed: number;
  theoreticalEfficiency: number;
  selfDischarge: number;

  // §6 — Heat & Thermal
  heatCapacity: number;
  heatInterface: number;
  heatGenerated: number;
  heatDissipated: number;
  heatBalance: number;

  // §7 — Structural Integrity
  totalFrame: number;
  totalWeight: number;
  frameToWeightRatio: number;
  totalHull: number;

  // §8 — Boost Totals & Flight Dynamics
  totalForce: number;
  totalThrust: number;
  steeringStrength: number;
  boostTotalThrust: number;
  boostTotalPower: number;
  boostTotalHeat: number;

  // Connectivity
  connectedBlockIds: string[];
  disconnectedBlockIds: string[];
}

// Check if two blocks touch face-to-face
function areAdjacent(b1: BlockBounds, b2: BlockBounds): boolean {
  // Touch along X (East-West)
  const touchX = b1.maxX === b2.minX || b1.minX === b2.maxX;
  const overlapY = Math.max(b1.minY, b2.minY) < Math.min(b1.maxY, b2.maxY);
  const overlapZ = Math.max(b1.minZ, b2.minZ) < Math.min(b1.maxZ, b2.maxZ);
  if (touchX && overlapY && overlapZ) return true;

  // Touch along Y (Up-Down)
  const touchY = b1.maxY === b2.minY || b1.minY === b2.maxY;
  const overlapX = Math.max(b1.minX, b2.minX) < Math.min(b1.maxX, b2.maxX);
  if (touchY && overlapX && overlapZ) return true;

  // Touch along Z (North-South)
  const touchZ = b1.maxZ === b2.minZ || b1.minZ === b2.maxZ;
  if (touchZ && overlapX && overlapY) return true;

  return false;
}

export function computeDerivedStats(blocks: BlockInstance[]): DerivedShipStats {
  const raw: Record<string, number> = {};

  // Compute raw sums
  blocks.forEach(b => {
    const def = BLOCK_DEFINITIONS[b.type];
    if (def && def.stats) {
      Object.entries(def.stats).forEach(([statName, value]) => {
        raw[statName] = (raw[statName] || 0) + value;
      });
    }
  });

  // Derived calculations
  const spProvided = raw.systemSupport || 0;
  const spConsumed = raw.systemRequirements || 0;
  const efficiency = spConsumed === 0 ? 1.0 : Math.min(1.0, spProvided / spConsumed);

  const powerGenerated = raw.powerGeneration || 0;
  const powerConsumed = raw.powerConsumption || 0;
  const powerBalance = powerGenerated - powerConsumed;

  // Battery detection (future proofing)
  let hasBattery = false;
  let batteryCount = 0;
  let totalTheoreticalEfficiency = 0;

  blocks.forEach(b => {
    const def = BLOCK_DEFINITIONS[b.type];
    if (def) {
      const isBattery = def.stats?.powerStorage !== undefined || def.group === 'Battery';
      if (isBattery) {
        hasBattery = true;
        batteryCount++;
        totalTheoreticalEfficiency += def.stats?.theoreticalEfficiency || 0;
      }
    }
  });

  const powerStorage = raw.powerStorage || 0;
  const maxChargeSpeed = raw.maxChargeSpeed || 0;
  const theoreticalEfficiency = batteryCount === 0 ? 0 : totalTheoreticalEfficiency / batteryCount;
  const selfDischarge = raw.selfDischarge || 0;

  const heatCapacity = raw.heatCapacity || 0;
  const heatInterface = raw.heatInterface || 0;
  const heatGenerated = raw.heatGeneration || 0;
  const heatDissipated = raw.heatDissipation || 0;
  const heatBalance = heatDissipated - heatGenerated;

  const totalFrame = raw.frame || 0;
  const totalWeight = raw.weight || 0;
  const frameToWeightRatio = totalWeight === 0 ? 0 : totalFrame / totalWeight;
  const totalHull = raw.hull || 0;

  const totalForce = raw.force || 0;
  const totalThrust = raw.thrust || 0;
  const steeringStrength = raw.steeringStrength || 0;

  const boostThrust = raw.boostThrust || 0;
  const boostPowerConsumption = raw.boostPowerConsumption || 0;
  const boostHeatGeneration = raw.boostHeatGeneration || 0;

  const boostTotalThrust = totalThrust + boostThrust;
  const boostTotalPower = powerConsumed + boostPowerConsumption;
  const boostTotalHeat = heatGenerated + boostHeatGeneration;

  // Connectivity analysis (BFS starting from cockpit/core blocks)
  const connectedBlockIds: string[] = [];
  const disconnectedBlockIds: string[] = [];

  if (blocks.length > 0) {
    const blockBounds = blocks.map(b => b.bounds || getBlockBounds(b.type, b.position, b.rotation));
    const isCockpit = blocks.map(b => BLOCK_DEFINITIONS[b.type]?.group === 'Cockpits');

    const visited = new Set<number>();
    const queue: number[] = [];

    // Initialize queue with all cockpits
    isCockpit.forEach((cockpit, idx) => {
      if (cockpit) {
        queue.push(idx);
        visited.add(idx);
      }
    });

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const currBounds = blockBounds[curr];

      for (let i = 0; i < blocks.length; i++) {
        if (!visited.has(i)) {
          if (areAdjacent(currBounds, blockBounds[i])) {
            visited.add(i);
            queue.push(i);
          }
        }
      }
    }

    blocks.forEach((b, idx) => {
      if (visited.has(idx)) {
        connectedBlockIds.push(b.id);
      } else {
        disconnectedBlockIds.push(b.id);
      }
    });
  }

  return {
    raw,
    spProvided,
    spConsumed,
    efficiency,
    powerGenerated,
    powerConsumed,
    powerBalance,
    hasBattery,
    powerStorage,
    maxChargeSpeed,
    theoreticalEfficiency,
    selfDischarge,
    heatCapacity,
    heatInterface,
    heatGenerated,
    heatDissipated,
    heatBalance,
    totalFrame,
    totalWeight,
    frameToWeightRatio,
    totalHull,
    totalForce,
    totalThrust,
    steeringStrength,
    boostTotalThrust,
    boostTotalPower,
    boostTotalHeat,
    connectedBlockIds,
    disconnectedBlockIds,
  };
}
