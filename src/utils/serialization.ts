import { v4 as uuidv4 } from 'uuid';
import type { BlockInstance } from '../store/shipStore';

export function serializeBlocks(blocks: BlockInstance[]): string {
  const serialized = blocks.map(b => {
    const [x, y, z] = b.position;
    const rxIdx = Math.round(b.rotation[0] / (Math.PI / 2)) % 4;
    const ryIdx = Math.round(b.rotation[1] / (Math.PI / 2)) % 4;
    const rzIdx = Math.round(b.rotation[2] / (Math.PI / 2)) % 4;
    return [
      b.type,
      x,
      y,
      z,
      rxIdx,
      ryIdx,
      rzIdx
    ];
  });
  
  try {
    const json = JSON.stringify(serialized);
    // Base64 encode and make URL-safe
    const base64 = btoa(json);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    console.error('Failed to serialize blocks', e);
    return '';
  }
}

export function deserializeBlocks(str: string): BlockInstance[] {
  if (!str) return [];
  try {
    // Restore base64 padding and standard chars
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const json = atob(base64);
    const data = JSON.parse(json) as [string, number, number, number, number, number, number][];
    
    return data.map(arr => {
      const [type, x, y, z, rxIdx, ryIdx, rzIdx] = arr;
      return {
        id: uuidv4(),
        type,
        position: [x, y, z],
        rotation: [
          (rxIdx || 0) * (Math.PI / 2),
          (ryIdx || 0) * (Math.PI / 2),
          (rzIdx || 0) * (Math.PI / 2)
        ]
      };
    });
  } catch (e) {
    console.error('Failed to deserialize blocks', e);
    return [];
  }
}
