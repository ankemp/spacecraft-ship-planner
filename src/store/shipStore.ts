import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import * as THREE from 'three';
import { BLOCK_DEFINITIONS } from '../config/blocks';
import { deserializeBlocks } from '../utils/serialization';

export interface BlockInstance {
  id: string;
  type: string;
  position: [number, number, number]; // Grid coords of the minimum corner
  rotation: [number, number, number]; // Euler angles in radians
}

export interface BlockBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export interface SavedShip {
  id: string;
  name: string;
  blocks: BlockInstance[];
  totalBlocks: number;
  bom: {
    smallSteelParts: number;
    supportHardware: number;
  };
  createdAt: number;
}

interface ShipStore {
  blocks: BlockInstance[];
  activeTool: string;
  selectedBlockId: string | null;
  movingBlock: BlockInstance | null;
  savedShips: SavedShip[];
  setBlocks: (blocks: BlockInstance[]) => void;
  setActiveTool: (type: string) => void;
  setSelectedBlockId: (id: string | null) => void;
  setMovingBlock: (block: BlockInstance | null) => void;
  addBlock: (type: string, position: [number, number, number], rotation: [number, number, number]) => boolean;
  removeBlock: (id: string) => void;
  clearShip: () => void;
  checkCollision: (type: string, position: [number, number, number], rotation: [number, number, number]) => boolean;
  startMoveBlock: (id: string) => void;
  placeMovingBlock: (position: [number, number, number], rotation: [number, number, number]) => boolean;
  cancelMoveBlock: () => void;
  nudgeBlock: (id: string, delta: [number, number, number]) => boolean;
  rotateBlock: (id: string, axis: 'x' | 'y' | 'z') => boolean;
  saveCurrentShip: (name: string) => void;
  deleteSavedShip: (id: string) => void;
  renameSavedShip: (id: string, name: string) => void;
}

export function getBlockBounds(type: string, position: [number, number, number], rotation: [number, number, number]): BlockBounds {
  const def = BLOCK_DEFINITIONS[type];
  if (!def) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0 };
  }

  const [w, h, d] = def.dimensions;
  const [rx, ry, rz] = rotation;
  const euler = new THREE.Euler(rx, ry, rz, 'XYZ');

  const vertices = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(w, 0, 0),
    new THREE.Vector3(0, h, 0),
    new THREE.Vector3(w, h, 0),
    new THREE.Vector3(0, 0, d),
    new THREE.Vector3(w, 0, d),
    new THREE.Vector3(0, h, d),
    new THREE.Vector3(w, h, d),
  ];

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (const v of vertices) {
    v.applyEuler(euler);
    const x = Math.round(v.x);
    const y = Math.round(v.y);
    const z = Math.round(v.z);

    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }

  const [px, py, pz] = position;
  return {
    minX: px + minX,
    maxX: px + maxX,
    minY: py + minY,
    maxY: py + maxY,
    minZ: pz + minZ,
    maxZ: pz + maxZ,
  };
}

// AABB Intersection check
function isColliding(b1: { type: string, position: [number, number, number], rotation: [number, number, number] }, b2: BlockInstance): boolean {
  const bounds1 = getBlockBounds(b1.type, b1.position, b1.rotation);
  const bounds2 = getBlockBounds(b2.type, b2.position, b2.rotation);

  return (
    bounds1.minX < bounds2.maxX &&
    bounds1.maxX > bounds2.minX &&
    bounds1.minY < bounds2.maxY &&
    bounds1.maxY > bounds2.minY &&
    bounds1.minZ < bounds2.maxZ &&
    bounds1.maxZ > bounds2.minZ
  );
}

// Helpers for localStorage sync
const saveAutosave = (blocks: BlockInstance[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('spacecraft_shipbuilder_autosave', JSON.stringify(blocks));
  }
};

const getInitialBlocks = (): BlockInstance[] => {
  if (typeof window !== 'undefined') {
    // 1. Check URL query params for ?ship=...
    const params = new URLSearchParams(window.location.search);
    const shipParam = params.get('ship');
    if (shipParam) {
      const decoded = deserializeBlocks(shipParam);
      if (decoded && decoded.length > 0) {
        saveAutosave(decoded);
        // Clean the URL query param so refresh/edit has clean URL
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState(null, '', newUrl);
        return decoded;
      }
    }

    // 2. Check local storage autosave
    const autosave = localStorage.getItem('spacecraft_shipbuilder_autosave');
    if (autosave) {
      try {
        return JSON.parse(autosave);
      } catch (e) {
        console.error('Failed to parse autosave from localStorage', e);
      }
    }
  }
  return [];
};

const getInitialSavedShips = (): SavedShip[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('spacecraft_shipbuilder_saved_ships');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved ships from localStorage', e);
      }
    }
  }
  return [];
};

export const useShipStore = create<ShipStore>((set, get) => ({
  blocks: getInitialBlocks(),
  activeTool: 'steel_4x3x2',
  selectedBlockId: null,
  movingBlock: null,
  savedShips: getInitialSavedShips(),

  setBlocks: (blocks) => {
    set({ blocks, selectedBlockId: null, movingBlock: null });
    saveAutosave(blocks);
  },
  setActiveTool: (type) => set({ activeTool: type }),
  setSelectedBlockId: (id) => set({ selectedBlockId: id }),
  setMovingBlock: (block) => set({ movingBlock: block }),

  checkCollision: (type, position, rotation) => {
    const { blocks } = get();
    
    // Check floor boundary
    const bounds = getBlockBounds(type, position, rotation);
    if (bounds.minY < 0) {
      return true;
    }

    const tempBlock = { type, position, rotation };
    for (const b of blocks) {
      if (isColliding(tempBlock, b)) {
        return true;
      }
    }
    return false;
  },

  addBlock: (type, position, rotation) => {
    const { checkCollision, blocks } = get();
    
    if (checkCollision(type, position, rotation)) {
      return false; // Collision detected
    }

    const newBlock: BlockInstance = {
      id: uuidv4(),
      type,
      position,
      rotation,
    };

    const nextBlocks = [...blocks, newBlock];
    set({ blocks: nextBlocks });
    saveAutosave(nextBlocks);
    return true;
  },

  removeBlock: (id) => {
    const { selectedBlockId, blocks } = get();
    const nextBlocks = blocks.filter(b => b.id !== id);
    set({
      blocks: nextBlocks,
      selectedBlockId: selectedBlockId === id ? null : selectedBlockId
    });
    saveAutosave(nextBlocks);
  },
  
  clearShip: () => {
    set({ blocks: [], selectedBlockId: null, movingBlock: null });
    saveAutosave([]);
  },

  startMoveBlock: (id) => {
    const { blocks } = get();
    const block = blocks.find(b => b.id === id);
    if (!block) return;
    
    const nextBlocks = blocks.filter(b => b.id !== id);
    set({
      movingBlock: block,
      blocks: nextBlocks,
      selectedBlockId: null
    });
    saveAutosave(nextBlocks);
  },

  placeMovingBlock: (position, rotation) => {
    const { movingBlock, checkCollision, blocks } = get();
    if (!movingBlock) return false;
    
    if (checkCollision(movingBlock.type, position, rotation)) {
      return false;
    }
    
    const placedBlock: BlockInstance = {
      ...movingBlock,
      position,
      rotation,
    };
    
    const nextBlocks = [...blocks, placedBlock];
    set({
      blocks: nextBlocks,
      movingBlock: null,
      selectedBlockId: placedBlock.id,
    });
    saveAutosave(nextBlocks);
    return true;
  },

  cancelMoveBlock: () => {
    const { movingBlock, blocks } = get();
    if (!movingBlock) return;
    
    const nextBlocks = [...blocks, movingBlock];
    set({
      blocks: nextBlocks,
      movingBlock: null,
      selectedBlockId: movingBlock.id,
    });
    saveAutosave(nextBlocks);
  },

  nudgeBlock: (id, delta) => {
    const { blocks } = get();
    const block = blocks.find(b => b.id === id);
    if (!block) return false;
    
    const newPos: [number, number, number] = [
      block.position[0] + delta[0],
      block.position[1] + delta[1],
      block.position[2] + delta[2],
    ];
    
    const otherBlocks = blocks.filter(b => b.id !== id);
    
    const bounds = getBlockBounds(block.type, newPos, block.rotation);
    if (bounds.minY < 0) {
      return false;
    }
    
    const tempBlock = { type: block.type, position: newPos, rotation: block.rotation };
    for (const b of otherBlocks) {
      if (isColliding(tempBlock, b)) {
        return false;
      }
    }
    
    const nextBlocks = blocks.map(b => b.id === id ? { ...b, position: newPos } : b);
    set({ blocks: nextBlocks });
    saveAutosave(nextBlocks);
    return true;
  },

  rotateBlock: (id, axis) => {
    const { blocks } = get();
    const block = blocks.find(b => b.id === id);
    if (!block) return false;
    
    // 1. Compute current center of bounding box
    const oldBounds = getBlockBounds(block.type, block.position, block.rotation);
    const oldCenterX = (oldBounds.minX + oldBounds.maxX) / 2;
    const oldCenterY = (oldBounds.minY + oldBounds.maxY) / 2;
    const oldCenterZ = (oldBounds.minZ + oldBounds.maxZ) / 2;

    // 2. Compute new rotation
    const newRot: [number, number, number] = [...block.rotation];
    const idx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    newRot[idx] = (newRot[idx] + Math.PI / 2) % (Math.PI * 2);

    // 3. Compute new local center
    const newLocalBounds = getBlockBounds(block.type, [0, 0, 0], newRot);
    const newLocalCenterX = (newLocalBounds.minX + newLocalBounds.maxX) / 2;
    const newLocalCenterY = (newLocalBounds.minY + newLocalBounds.maxY) / 2;
    const newLocalCenterZ = (newLocalBounds.minZ + newLocalBounds.maxZ) / 2;

    // 4. Compute new position to rotate around center
    const newPos: [number, number, number] = [
      Math.round(oldCenterX - newLocalCenterX),
      Math.round(oldCenterY - newLocalCenterY),
      Math.round(oldCenterZ - newLocalCenterZ),
    ];

    // Clamp Y to prevent going below floor
    newPos[1] = Math.max(0, newPos[1]);

    const otherBlocks = blocks.filter(b => b.id !== id);
    
    const bounds = getBlockBounds(block.type, newPos, newRot);
    if (bounds.minY < 0) {
      return false;
    }
    
    const tempBlock = { type: block.type, position: newPos, rotation: newRot };
    for (const b of otherBlocks) {
      if (isColliding(tempBlock, b)) {
        return false;
      }
    }
    
    const nextBlocks = blocks.map(b => b.id === id ? { ...b, position: newPos, rotation: newRot } : b);
    set({ blocks: nextBlocks });
    saveAutosave(nextBlocks);
    return true;
  },

  saveCurrentShip: (name) => {
    const { blocks } = get();
    const bom = selectBOM({ blocks });
    
    const newShip: SavedShip = {
      id: uuidv4(),
      name: name.trim() || 'Unnamed Ship',
      blocks: JSON.parse(JSON.stringify(blocks)),
      totalBlocks: blocks.length,
      bom,
      createdAt: Date.now()
    };

    set((state) => {
      const updated = [...state.savedShips, newShip];
      localStorage.setItem('spacecraft_shipbuilder_saved_ships', JSON.stringify(updated));
      return { savedShips: updated };
    });
  },

  deleteSavedShip: (id) => {
    set((state) => {
      const updated = state.savedShips.filter(s => s.id !== id);
      localStorage.setItem('spacecraft_shipbuilder_saved_ships', JSON.stringify(updated));
      return { savedShips: updated };
    });
  },

  renameSavedShip: (id, name) => {
    set((state) => {
      const updated = state.savedShips.map(s => 
        s.id === id ? { ...s, name: name.trim() || s.name } : s
      );
      localStorage.setItem('spacecraft_shipbuilder_saved_ships', JSON.stringify(updated));
      return { savedShips: updated };
    });
  }
}));

export const selectBOM = (state: ShipStore | { blocks: BlockInstance[] }) => {
  let smallSteelParts = 0;
  let supportHardware = 0;

  state.blocks.forEach(b => {
    const def = BLOCK_DEFINITIONS[b.type];
    if (def && def.costs) {
      smallSteelParts += def.costs.smallSteelParts || 0;
      supportHardware += def.costs.supportHardware || 0;
    }
  });

  return { smallSteelParts, supportHardware };
};
