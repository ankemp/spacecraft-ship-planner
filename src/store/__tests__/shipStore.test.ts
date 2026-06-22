import { describe, it, expect, beforeEach } from 'vitest';
import { useShipStore, getBlockBounds, isBoundsColliding } from '../shipStore';

describe('shipStore geometry helpers', () => {
  describe('getBlockBounds', () => {
    it('should compute correct bounds for a non-rotated block', () => {
      // steel_4x3x1 has dimensions [4, 1, 3] in config
      const bounds = getBlockBounds('steel_4x3x1', [10, 20, 30], [0, 0, 0]);
      expect(bounds).toEqual({
        minX: 10,
        maxX: 14,
        minY: 20,
        maxY: 21,
        minZ: 30,
        maxZ: 33,
      });
    });

    it('should return zero bounds for an unknown block type', () => {
      const bounds = getBlockBounds('non_existent_block', [10, 20, 30], [0, 0, 0]);
      expect(bounds).toEqual({
        minX: 0,
        maxX: 0,
        minY: 0,
        maxY: 0,
        minZ: 0,
        maxZ: 0,
      });
    });
  });

  describe('isBoundsColliding', () => {
    it('should detect collision when boxes overlap', () => {
      const b1 = { minX: 0, maxX: 4, minY: 0, maxY: 4, minZ: 0, maxZ: 4 };
      const b2 = { minX: 2, maxX: 6, minY: 2, maxY: 6, minZ: 2, maxZ: 6 };
      expect(isBoundsColliding(b1, b2)).toBe(true);
    });

    it('should not detect collision when boxes only touch face-to-face', () => {
      const b1 = { minX: 0, maxX: 4, minY: 0, maxY: 4, minZ: 0, maxZ: 4 };
      const b2 = { minX: 4, maxX: 8, minY: 0, maxY: 4, minZ: 0, maxZ: 4 };
      expect(isBoundsColliding(b1, b2)).toBe(false);
    });

    it('should not detect collision when boxes are completely separated', () => {
      const b1 = { minX: 0, maxX: 2, minY: 0, maxY: 2, minZ: 0, maxZ: 2 };
      const b2 = { minX: 10, maxX: 12, minY: 10, maxY: 12, minZ: 10, maxZ: 12 };
      expect(isBoundsColliding(b1, b2)).toBe(false);
    });
  });
});

describe('shipStore Zustand actions', () => {
  beforeEach(() => {
    useShipStore.getState().clearShip();
  });

  it('should initialize with an empty blocks list', () => {
    expect(useShipStore.getState().blocks).toEqual([]);
  });

  it('should allow adding and removing a block', () => {
    // Add steel block at origin
    const added = useShipStore.getState().addBlock('steel_4x3x1', [0, 0, 0], [0, 0, 0]);
    expect(added).toBe(true);

    const state = useShipStore.getState();
    expect(state.blocks).toHaveLength(1);
    expect(state.blocks[0].type).toBe('steel_4x3x1');
    expect(state.blocks[0].position).toEqual([0, 0, 0]);

    // Remove block
    const blockId = state.blocks[0].id;
    useShipStore.getState().removeBlock(blockId);
    expect(useShipStore.getState().blocks).toHaveLength(0);
  });

  it('should prevent placing blocks that cause a collision', () => {
    // Add first block
    useShipStore.getState().addBlock('steel_4x3x1', [0, 0, 0], [0, 0, 0]);

    // Try to place second block overlapping first (at position [1, 0, 0])
    const added = useShipStore.getState().addBlock('steel_4x3x1', [1, 0, 0], [0, 0, 0]);
    expect(added).toBe(false); // Should fail due to collision
    expect(useShipStore.getState().blocks).toHaveLength(1);
  });

  it('should restrict cockpit count to one', () => {
    // Place pathfinder cockpit
    const firstCockpit = useShipStore.getState().addBlock('cockpit_pathfinder', [0, 0, 0], [0, 0, 0]);
    expect(firstCockpit).toBe(true);

    // Try to place a second cockpit (brick cockpit)
    const secondCockpit = useShipStore.getState().addBlock('cockpit_brick', [10, 10, 10], [0, 0, 0]);
    expect(secondCockpit).toBe(false);
    expect(useShipStore.getState().toast).toBe('Only one cockpit is allowed per ship!');
  });
});
