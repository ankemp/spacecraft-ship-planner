import { v4 as uuidv4 } from 'uuid';
import type { BlockInstance } from '../store/shipStore';

export function serializeBlocks(blocks: BlockInstance[]): string {
  const serialized = blocks.map(b => {
    const [x, y, z] = b.position;
    const rxIdx = Math.round(b.rotation[0] / (Math.PI / 2)) % 4;
    const ryIdx = Math.round(b.rotation[1] / (Math.PI / 2)) % 4;
    const rzIdx = Math.round(b.rotation[2] / (Math.PI / 2)) % 4;
    const item: (string | number | null | undefined)[] = [
      b.type,
      x,
      y,
      z,
      rxIdx,
      ryIdx,
      rzIdx
    ];
    if (b.color || b.shape || b.flipX || b.flipY || b.flipZ) {
      item.push(b.color || null);
    }
    if (b.shape || b.flipX || b.flipY || b.flipZ) {
      item.push(b.shape || null);
    }
    if (b.flipX || b.flipY || b.flipZ) {
      item.push(b.flipX ? 1 : 0);
      item.push(b.flipY ? 1 : 0);
      item.push(b.flipZ ? 1 : 0);
    }
    return item;
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
    const data = JSON.parse(json) as (string | number | null)[][];
    
    return data.map(arr => {
      const [type, x, y, z, rxIdx, ryIdx, rzIdx, p7, p8, p9, p10, p11] = arr;
      
      let color: string | undefined = undefined;
      let shape: string | undefined = undefined;
      
      if (p7 !== undefined && p7 !== null) {
        const p7Str = p7 as string;
        if (p7Str.startsWith('#')) {
          color = p7Str;
          if (p8 !== undefined && p8 !== null) {
            shape = p8 as string;
          }
        } else {
          shape = p7Str;
        }
      } else if (p8 !== undefined && p8 !== null) {
        shape = p8 as string;
      }

      const flipX = p9 === 1;
      const flipY = p10 === 1;
      const flipZ = p11 === 1;
      
      return {
        id: uuidv4(),
        type: type as string,
        position: [x as number, y as number, z as number],
        rotation: [
          ((rxIdx as number) || 0) * (Math.PI / 2),
          ((ryIdx as number) || 0) * (Math.PI / 2),
          ((rzIdx as number) || 0) * (Math.PI / 2)
        ],
        ...(color ? { color } : {}),
        ...(shape ? { shape } : {}),
        ...(flipX ? { flipX } : {}),
        ...(flipY ? { flipY } : {}),
        ...(flipZ ? { flipZ } : {})
      };
    });
  } catch (e) {
    console.error('Failed to deserialize blocks', e);
    return [];
  }
}
