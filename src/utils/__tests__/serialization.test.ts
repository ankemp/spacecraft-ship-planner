import { describe, it, expect } from 'vitest';
import { serializeBlocks, deserializeBlocks } from '../serialization';
import type { BlockInstance } from '../../store/shipStore';

describe('serialization utils', () => {
  it('should serialize and deserialize an empty list of blocks', () => {
    const serialized = serializeBlocks([]);
    expect(serialized).toBe('W10');
    const deserialized = deserializeBlocks(serialized);
    expect(deserialized).toEqual([]);
  });

  it('should handle corrupt or invalid deserialization strings gracefully', () => {
    expect(deserializeBlocks('invalid-base64-string')).toEqual([]);
    expect(deserializeBlocks('')).toEqual([]);
    expect(deserializeBlocks('{}')).toEqual([]);
  });

  it('should round-trip simple block instances', () => {
    const blocks: BlockInstance[] = [
      {
        id: '1',
        type: 'steel_block',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
      },
      {
        id: '2',
        type: 'titanium_block',
        position: [1, 2, 3],
        rotation: [Math.PI / 2, Math.PI, 0],
      },
    ];

    const serialized = serializeBlocks(blocks);
    expect(typeof serialized).toBe('string');
    expect(serialized.length).toBeGreaterThan(0);

    const deserialized = deserializeBlocks(serialized);
    expect(deserialized).toHaveLength(2);

    // Note: deserialization generates new IDs using uuidv4, so we ignore IDs in comparison
    expect(deserialized[0].type).toBe(blocks[0].type);
    expect(deserialized[0].position).toEqual(blocks[0].position);
    expect(deserialized[0].rotation).toEqual(blocks[0].rotation);

    expect(deserialized[1].type).toBe(blocks[1].type);
    expect(deserialized[1].position).toEqual(blocks[1].position);
    expect(deserialized[1].rotation).toEqual(blocks[1].rotation);
  });

  it('should preserve color, shape, and flip states', () => {
    const blocks: BlockInstance[] = [
      {
        id: '1',
        type: 'steel_block',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        color: '#ff0000',
        shape: 'slope',
        flipX: true,
        flipY: false,
        flipZ: true,
      },
    ];

    const serialized = serializeBlocks(blocks);
    const deserialized = deserializeBlocks(serialized);
    expect(deserialized).toHaveLength(1);

    const result = deserialized[0];
    expect(result.type).toBe('steel_block');
    expect(result.position).toEqual([0, 0, 0]);
    expect(result.color).toBe('#ff0000');
    expect(result.shape).toBe('slope');
    expect(result.flipX).toBe(true);
    expect(result.flipY).toBeUndefined(); // false is omitted from serialized/deserialized output
    expect(result.flipZ).toBe(true);
  });
});
