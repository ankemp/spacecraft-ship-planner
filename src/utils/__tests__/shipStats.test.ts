import { describe, it, expect } from 'vitest';
import { computeDerivedStats } from '../shipStats';
import type { BlockInstance } from '../../store/shipStore';

describe('shipStats computeDerivedStats', () => {
  it('should return default zeroed stats when the block list is empty', () => {
    const stats = computeDerivedStats([]);
    expect(stats.efficiency).toBe(1.0);
    expect(stats.totalWeight).toBe(0);
    expect(stats.totalFrame).toBe(0);
    expect(stats.frameToWeightRatio).toBe(0);
    expect(stats.connectedBlockIds).toEqual([]);
    expect(stats.disconnectedBlockIds).toEqual([]);
  });

  it('should calculate raw and derived stats correctly', () => {
    // 1x Cockpit: Pathfinder Cockpit
    // stats: { systemSupport: 200, frame: 48, weight: 40, heatCapacity: 40, heatInterface: 60 }
    // 1x Thruster: Cart Pusher
    // stats: { systemRequirements: 300, materialHeatConductivity: 60, force: 300, thrust: 50, powerConsumption: 35, steeringStrength: 8, boostThrust: 100, boostPowerConsumption: 100, boostHeatGeneration: 1000 }
    const blocks: BlockInstance[] = [
      {
        id: 'cockpit',
        type: 'cockpit_pathfinder',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
      },
      {
        id: 'thruster',
        type: 'thruster_cart_pusher',
        position: [3, 0, 0], // adjacent along X
        rotation: [0, 0, 0],
      },
    ];

    const stats = computeDerivedStats(blocks);

    // SP Provided and Consumed
    expect(stats.spProvided).toBe(200);
    expect(stats.spConsumed).toBe(300);
    // Efficiency: min(1, Provided/Consumed) = 200/300 = ~0.6667
    expect(stats.efficiency).toBeCloseTo(0.6667, 4);

    // Power
    expect(stats.powerGenerated).toBe(0);
    expect(stats.powerConsumed).toBe(35);
    expect(stats.powerBalance).toBe(-35);

    // Weight and Frame
    expect(stats.totalWeight).toBe(40); // thruster has no weight in config, cockpit has 40
    expect(stats.totalFrame).toBe(48);
    expect(stats.frameToWeightRatio).toBe(48 / 40);

    // Heat
    expect(stats.heatCapacity).toBe(40);
    expect(stats.heatInterface).toBe(60);
    expect(stats.heatGenerated).toBe(0);
    expect(stats.heatDissipated).toBe(0);

    // Thruster Boost Mechanics
    // boostTotalThrust = thrust (50) + boostThrust (100) = 150
    // boostTotalPower = powerConsumed (35) + boostPowerConsumption (100) = 135
    // boostTotalHeat = heatGenerated (0) + boostHeatGeneration (1000) = 1000
    expect(stats.totalForce).toBe(300);
    expect(stats.totalThrust).toBe(50);
    expect(stats.steeringStrength).toBe(8);
    expect(stats.boostTotalThrust).toBe(150);
    expect(stats.boostTotalPower).toBe(135);
    expect(stats.boostTotalHeat).toBe(1000);
  });

  describe('Adjacency & Structural Connectivity BFS', () => {
    it('should identify adjacent blocks correctly and run BFS from cockpit', () => {
      // Create a chain: Cockpit (0,0,0, size 3x2x3) -> Steel_4x3x1 (3,0,0, size 4x1x3) -> Steel_4x3x1 (7,0,0)
      // And a disconnected Steel block at (20,20,20)
      const blocks: BlockInstance[] = [
        {
          id: 'cockpit',
          type: 'cockpit_pathfinder', // size 3x2x3 (min corner 0,0,0 -> max 3,2,3)
          position: [0, 0, 0],
          rotation: [0, 0, 0],
        },
        {
          id: 'steel-1',
          type: 'steel_4x3x1', // size 4x1x3 (min corner 3,0,0 -> max 7,1,3)
          position: [3, 0, 0],
          rotation: [0, 0, 0],
        },
        {
          id: 'steel-2',
          type: 'steel_4x3x1', // size 4x1x3 (min corner 7,0,0 -> max 11,1,3)
          position: [7, 0, 0],
          rotation: [0, 0, 0],
        },
        {
          id: 'disconnected-steel',
          type: 'steel_4x3x1',
          position: [20, 20, 20],
          rotation: [0, 0, 0],
        },
      ];

      const stats = computeDerivedStats(blocks);

      expect(stats.connectedBlockIds).toContain('cockpit');
      expect(stats.connectedBlockIds).toContain('steel-1');
      expect(stats.connectedBlockIds).toContain('steel-2');
      expect(stats.connectedBlockIds).not.toContain('disconnected-steel');

      expect(stats.disconnectedBlockIds).toEqual(['disconnected-steel']);
    });

    it('should ignore connectivity analysis when skipConnectivity is true', () => {
      const blocks: BlockInstance[] = [
        {
          id: 'cockpit',
          type: 'cockpit_pathfinder',
          position: [0, 0, 0],
          rotation: [0, 0, 0],
        },
        {
          id: 'disconnected-steel',
          type: 'steel_4x3x1',
          position: [20, 20, 20],
          rotation: [0, 0, 0],
        },
      ];

      const stats = computeDerivedStats(blocks, true);
      expect(stats.connectedBlockIds).toEqual([]);
      expect(stats.disconnectedBlockIds).toEqual([]);
    });

    it('should fail adjacency on edge-only or corner-only contact', () => {
      const blocks: BlockInstance[] = [
        {
          id: 'cockpit',
          type: 'cockpit_pathfinder', // size 3x2x3 (min 0,0,0 -> max 3,2,3)
          position: [0, 0, 0],
          rotation: [0, 0, 0],
        },
        {
          id: 'edge-touch',
          type: 'steel_4x3x1', // size 4x1x3 (min 3,2,0 -> max 7,3,3)
          // Touches along X=3 boundary and Y=2 boundary, but does not overlap along Y (overlapY is 2 < 2, false)
          position: [3, 2, 0],
          rotation: [0, 0, 0],
        },
      ];

      const stats = computeDerivedStats(blocks);
      expect(stats.connectedBlockIds).toContain('cockpit');
      expect(stats.connectedBlockIds).not.toContain('edge-touch');
      expect(stats.disconnectedBlockIds).toContain('edge-touch');
    });
  });
});
