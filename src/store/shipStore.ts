import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import * as THREE from 'three';
import { BLOCK_DEFINITIONS } from '../config/blocks';
import { deserializeBlocks } from '../utils/serialization';
import { computeDerivedStats } from '../utils/shipStats';

export interface BlockInstance {
  id: string;
  type: string;
  position: [number, number, number]; // Grid coords of the minimum corner
  rotation: [number, number, number]; // Euler angles in radians
  color?: string;
  shape?: string;
  flipX?: boolean;
  flipY?: boolean;
  flipZ?: boolean;
  bounds?: BlockBounds;
}

export interface BlockBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export function isBoundsColliding(b1: BlockBounds, b2: BlockBounds): boolean {
  return (
    b1.minX < b2.maxX &&
    b1.maxX > b2.minX &&
    b1.minY < b2.maxY &&
    b1.maxY > b2.minY &&
    b1.minZ < b2.maxZ &&
    b1.maxZ > b2.minZ
  );
}

export interface SavedShip {
  id: string;
  name: string;
  blocks: BlockInstance[];
  totalBlocks: number;
  bom: {
    smallSteelParts: number;
    smallTitaniumParts: number;
    titaniumParts: number;
    supportHardware: number;
  };
  stats: Record<string, number>;
  createdAt: number;
}

interface ShipStore {
  blocks: BlockInstance[];
  activeTool: string;
  activeShape: string;
  activeFlipX: boolean;
  activeFlipY: boolean;
  activeFlipZ: boolean;
  selectedBlockId: string | null;
  movingBlock: BlockInstance | null;
  savedShips: SavedShip[];
  toast: string | null;
  setToast: (toast: string | null) => void;
  setBlocks: (blocks: BlockInstance[]) => void;
  setActiveTool: (type: string) => void;
  setActiveShape: (shape: string) => void;
  setActiveFlipX: (flip: boolean) => void;
  setActiveFlipY: (flip: boolean) => void;
  setActiveFlipZ: (flip: boolean) => void;
  setSelectedBlockId: (id: string | null) => void;
  setMovingBlock: (block: BlockInstance | null) => void;
  addBlock: (type: string, position: [number, number, number], rotation: [number, number, number]) => boolean;
  removeBlock: (id: string) => void;
  clearShip: () => void;
  checkCollision: (type: string, position: [number, number, number], rotation: [number, number, number]) => boolean;
  nudgeBlock: (id: string, delta: [number, number, number]) => boolean;
  placeMovingBlock: (position: [number, number, number], rotation: [number, number, number]) => boolean;
  startMoveBlock: (id: string) => void;
  cancelMoveBlock: () => void;
  rotateBlock: (id: string, axis: 'x' | 'y' | 'z') => boolean;
  flipBlock: (id: string, axis: 'x' | 'y' | 'z') => boolean;
  saveCurrentShip: (name: string) => void;
  deleteSavedShip: (id: string) => void;
  renameSavedShip: (id: string, name: string) => void;
  updateBlockColor: (id: string, color: string | undefined) => void;
  updateBlockShape: (id: string, shape: string) => void;
  potatoMode: boolean;
  setPotatoMode: (enabled: boolean) => void;
  suggestPotatoMode: boolean;
  dismissedPotatoSuggestion: boolean;
  setSuggestPotatoMode: (suggest: boolean) => void;
  dismissPotatoSuggestion: () => void;
  background: 'atmosphere' | 'nebula' | 'orbit' | 'hangar';
  setBackground: (bg: 'atmosphere' | 'nebula' | 'orbit' | 'hangar') => void;
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



// Helpers for localStorage sync
// Debounced + idle-callback autosave:
// JSON.stringify on large block arrays is synchronous and can steal 5-15ms
// from the main thread on every mutation. By deferring 500ms and running
// during browser idle time, serialisation is moved completely off the
// critical input path. At most 500ms of work is lost if the tab is closed.
let _autosaveTimerId: ReturnType<typeof setTimeout> | null = null;

const saveAutosave = (blocks: BlockInstance[]) => {
  if (typeof window === 'undefined') return;

  // Cancel any pending save
  if (_autosaveTimerId !== null) {
    clearTimeout(_autosaveTimerId);
  }

  _autosaveTimerId = setTimeout(() => {
    _autosaveTimerId = null;
    const doSave = () => {
      localStorage.setItem('spacecraft_shipbuilder_autosave', JSON.stringify(blocks));
    };

    // Run during browser idle time if the API is available
    if ('requestIdleCallback' in window) {
      requestIdleCallback(doSave, { timeout: 2000 });
    } else {
      doSave();
    }
  }, 500);
};

const getInitialBlocks = (): BlockInstance[] => {
  if (typeof window !== 'undefined') {
    // 1. Check URL query params for ?ship=...
    const params = new URLSearchParams(window.location.search);
    const shipParam = params.get('ship');
    if (shipParam) {
      const decoded = deserializeBlocks(shipParam);
      if (decoded && decoded.length > 0) {
        const blocksWithBounds = decoded.map(b => b.bounds ? b : { ...b, bounds: getBlockBounds(b.type, b.position, b.rotation) });
        saveAutosave(blocksWithBounds);
        // Clean the URL query param so refresh/edit has clean URL
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState(null, '', newUrl);
        return blocksWithBounds;
      }
    }

    // 2. Check local storage autosave
    const autosave = localStorage.getItem('spacecraft_shipbuilder_autosave');
    if (autosave) {
      try {
        const parsed = JSON.parse(autosave) as BlockInstance[];
        return parsed.map(b => b.bounds ? b : { ...b, bounds: getBlockBounds(b.type, b.position, b.rotation) });
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

const checkIsLowSpecHardware = (): boolean => {
  if (typeof window === 'undefined') return false;

  // 1. Check logical cores
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
    return true;
  }

  // 2. Check memory (RAM)
  // @ts-expect-error deviceMemory is non-standard
  if (navigator.deviceMemory && navigator.deviceMemory < 4) {
    return true;
  }

  // 3. Check WebGL GPU renderer
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = (gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '') as string;
        const lowerRenderer = renderer.toLowerCase();
        if (
          lowerRenderer.includes('intel') ||
          lowerRenderer.includes('hd graphics') ||
          lowerRenderer.includes('uhd') ||
          lowerRenderer.includes('llvmpipe') ||
          lowerRenderer.includes('swiftshader')
        ) {
          return true;
        }
      }
    }
  } catch {
    return true;
  }

  return false;
};

export const useShipStore = create<ShipStore>((set, get) => ({
  blocks: getInitialBlocks(),
  activeTool: 'steel_4x3x2',
  activeShape: 'full',
  activeFlipX: false,
  activeFlipY: false,
  activeFlipZ: false,
  selectedBlockId: null,
  movingBlock: null,
  savedShips: getInitialSavedShips(),
  toast: null,
  setBlocks: (blocks) => {
    const blocksWithBounds = blocks.map(b => b.bounds ? b : { ...b, bounds: getBlockBounds(b.type, b.position, b.rotation) });
    set({ blocks: blocksWithBounds });
    saveAutosave(blocksWithBounds);
  },
  setActiveTool: (type) => set({ activeTool: type }),
  setActiveShape: (shape) => set({ activeShape: shape }),
  setActiveFlipX: (flip) => set({ activeFlipX: flip }),
  setActiveFlipY: (flip) => set({ activeFlipY: flip }),
  setActiveFlipZ: (flip) => set({ activeFlipZ: flip }),
  setSelectedBlockId: (id) => set({ selectedBlockId: id }),
  setMovingBlock: (block) => set({ movingBlock: block }),
  setToast: (toast) => set({ toast }),
  potatoMode: typeof window !== 'undefined' ? localStorage.getItem('spacecraft_shipbuilder_potato_mode') === 'true' : false,
  setPotatoMode: (enabled) => {
    set({ potatoMode: enabled });
    if (typeof window !== 'undefined') {
      localStorage.setItem('spacecraft_shipbuilder_potato_mode', String(enabled));
    }
  },
  suggestPotatoMode: typeof window !== 'undefined'
    ? localStorage.getItem('spacecraft_shipbuilder_potato_suggest_dismissed') !== 'true' &&
      localStorage.getItem('spacecraft_shipbuilder_potato_mode') !== 'true' &&
      checkIsLowSpecHardware()
    : false,
  dismissedPotatoSuggestion: typeof window !== 'undefined' ? localStorage.getItem('spacecraft_shipbuilder_potato_suggest_dismissed') === 'true' : false,
  setSuggestPotatoMode: (suggest) => set({ suggestPotatoMode: suggest }),
  dismissPotatoSuggestion: () => {
    set({ suggestPotatoMode: false, dismissedPotatoSuggestion: true });
    if (typeof window !== 'undefined') {
      localStorage.setItem('spacecraft_shipbuilder_potato_suggest_dismissed', 'true');
    }
  },
  background: typeof window !== 'undefined' ? ((localStorage.getItem('spacecraft_shipbuilder_background') as 'atmosphere' | 'nebula' | 'orbit' | 'hangar' | null) || 'nebula') : 'nebula',
  setBackground: (bg) => {
    set({ background: bg });
    if (typeof window !== 'undefined') {
      localStorage.setItem('spacecraft_shipbuilder_background', bg);
    }
  },

  checkCollision: (type, position, rotation) => {
    const { blocks } = get();
    
    // Check floor boundary
    const bounds1 = getBlockBounds(type, position, rotation);
    if (bounds1.minY < 0) {
      return true;
    }

    for (const b of blocks) {
      const bounds2 = b.bounds || getBlockBounds(b.type, b.position, b.rotation);
      if (isBoundsColliding(bounds1, bounds2)) {
        return true;
      }
    }
    return false;
  },

  addBlock: (type, position, rotation) => {
    const { checkCollision, blocks, activeShape, activeFlipX, activeFlipY, activeFlipZ } = get();
    
    if (checkCollision(type, position, rotation)) {
      return false; // Collision detected
    }

    const blockDef = BLOCK_DEFINITIONS[type];
    if (blockDef && blockDef.group === 'Cockpits') {
      const hasCockpit = blocks.some(b => BLOCK_DEFINITIONS[b.type]?.group === 'Cockpits');
      if (hasCockpit) {
        set({ toast: 'Only one cockpit is allowed per ship!' });
        return false;
      }
    }

    const isHull = blockDef && (blockDef.group === 'Steel' || blockDef.group === 'Titanium');
    const hasFlips = blockDef && blockDef.allowedFlips && blockDef.allowedFlips.length > 0;
    const bounds = getBlockBounds(type, position, rotation);

    const newBlock: BlockInstance = {
      id: uuidv4(),
      type,
      position,
      rotation,
      shape: isHull ? activeShape : undefined,
      flipX: hasFlips ? activeFlipX : undefined,
      flipY: hasFlips ? activeFlipY : undefined,
      flipZ: hasFlips ? activeFlipZ : undefined,
      bounds,
    };

    const nextBlocks = [...blocks, newBlock];
    const updatedState: Partial<ShipStore> = { blocks: nextBlocks };
    if (blockDef && blockDef.group === 'Cockpits') {
      updatedState.activeTool = 'select';
    }
    set(updatedState);
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
    const { movingBlock, checkCollision, blocks, activeFlipX, activeFlipY, activeFlipZ } = get();
    if (!movingBlock) return false;
    
    if (checkCollision(movingBlock.type, position, rotation)) {
      return false;
    }

    const blockDef = BLOCK_DEFINITIONS[movingBlock.type];
    if (blockDef && blockDef.group === 'Cockpits') {
      const hasCockpit = blocks.some(b => b.id !== movingBlock.id && BLOCK_DEFINITIONS[b.type]?.group === 'Cockpits');
      if (hasCockpit) {
        set({ toast: 'Only one cockpit is allowed per ship!' });
        return false;
      }
    }
    
    const hasFlips = blockDef && blockDef.allowedFlips && blockDef.allowedFlips.length > 0;
    const bounds = getBlockBounds(movingBlock.type, position, rotation);
    const placedBlock: BlockInstance = {
      ...movingBlock,
      position,
      rotation,
      ...(hasFlips ? {
        flipX: activeFlipX,
        flipY: activeFlipY,
        flipZ: activeFlipZ,
      } : {}),
      bounds,
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
    
    for (const b of otherBlocks) {
      const b2Bounds = b.bounds || getBlockBounds(b.type, b.position, b.rotation);
      if (isBoundsColliding(bounds, b2Bounds)) {
        return false;
      }
    }
    
    const nextBlocks = blocks.map(b => b.id === id ? { ...b, position: newPos, bounds } : b);
    set({ blocks: nextBlocks });
    saveAutosave(nextBlocks);
    return true;
  },

  rotateBlock: (id, axis) => {
    const { blocks } = get();
    const block = blocks.find(b => b.id === id);
    if (!block) return false;
    
    const def = BLOCK_DEFINITIONS[block.type];
    if (!def) return false;

    // Enforce configuration-driven constraints
    const allowedRotations = def.allowedRotations || [];
    if (!allowedRotations.includes(axis)) return false;

    const [w, h, d] = def.dimensions;

    // 1. Compute bounds
    const oldBounds = block.bounds || getBlockBounds(block.type, block.position, block.rotation);

    // 2. Compute new rotation
    const newRot: [number, number, number] = [...block.rotation];
    const idx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    newRot[idx] = (newRot[idx] + Math.PI / 2) % (Math.PI * 2);

    // 3. Compute new local bounds
    const newLocalBounds = getBlockBounds(block.type, [0, 0, 0], newRot);

    // 4. Compute new position (XZ rotates around a local integer-based pivot, Y preserves bottom level unless below 0)
    const pxLocal = Math.floor(w / 2);
    const pyLocal = Math.floor(h / 2);
    const pzLocal = Math.floor(d / 2);
    const pivotLocal = new THREE.Vector3(pxLocal, pyLocal, pzLocal);

    // Rotate pivot by old rotation
    const eulerOld = new THREE.Euler(block.rotation[0], block.rotation[1], block.rotation[2], 'XYZ');
    const pivotOld = pivotLocal.clone().applyEuler(eulerOld);
    const pxOld = Math.round(pivotOld.x);
    const pzOld = Math.round(pivotOld.z);

    // Rotate pivot by new rotation
    const eulerNew = new THREE.Euler(newRot[0], newRot[1], newRot[2], 'XYZ');
    const pivotNew = pivotLocal.clone().applyEuler(eulerNew);
    const pxNew = Math.round(pivotNew.x);
    const pzNew = Math.round(pivotNew.z);

    const newPosX = block.position[0] + pxOld - pxNew;
    const newPosZ = block.position[2] + pzOld - pzNew;
    
    let newPosY = oldBounds.minY - newLocalBounds.minY;
    newPosY = Math.max(-newLocalBounds.minY, newPosY);

    const newPos: [number, number, number] = [newPosX, newPosY, newPosZ];

    const otherBlocks = blocks.filter(b => b.id !== id);
    
    const bounds = getBlockBounds(block.type, newPos, newRot);
    if (bounds.minY < 0) {
      return false;
    }
    
    for (const b of otherBlocks) {
      const b2Bounds = b.bounds || getBlockBounds(b.type, b.position, b.rotation);
      if (isBoundsColliding(bounds, b2Bounds)) {
        return false;
      }
    }
    
    const nextBlocks = blocks.map(b => b.id === id ? { ...b, position: newPos, rotation: newRot, bounds } : b);
    set({ blocks: nextBlocks });
    saveAutosave(nextBlocks);
    return true;
  },

  flipBlock: (id, axis) => {
    const { blocks } = get();
    const block = blocks.find(b => b.id === id);
    if (!block) return false;

    const def = BLOCK_DEFINITIONS[block.type];
    if (!def) return false;

    // Enforce configuration-driven constraints
    const allowedFlips = def.allowedFlips || [];
    if (!allowedFlips.includes(axis)) return false;

    const nextBlocks = blocks.map(b => {
      if (b.id === id) {
        return {
          ...b,
          flipX: axis === 'x' ? !b.flipX : b.flipX,
          flipY: axis === 'y' ? !b.flipY : b.flipY,
          flipZ: axis === 'z' ? !b.flipZ : b.flipZ,
        };
      }
      return b;
    });

    set({ blocks: nextBlocks });
    saveAutosave(nextBlocks);
    return true;
  },

  saveCurrentShip: (name) => {
    const { blocks } = get();
    const bom = selectBOM({ blocks });
    const stats = selectStats({ blocks });
    
    const newShip: SavedShip = {
      id: uuidv4(),
      name: name.trim() || 'Unnamed Ship',
      blocks: JSON.parse(JSON.stringify(blocks)),
      totalBlocks: blocks.length,
      bom,
      stats,
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
  },

  updateBlockColor: (id, color) => {
    const { blocks } = get();
    const nextBlocks = blocks.map(b => b.id === id ? { ...b, color } : b);
    set({ blocks: nextBlocks });
    saveAutosave(nextBlocks);
  },

  updateBlockShape: (id, shape) => {
    const { blocks } = get();
    const nextBlocks = blocks.map(b => b.id === id ? { ...b, shape } : b);
    set({ blocks: nextBlocks });
    saveAutosave(nextBlocks);
  }
}));

export const selectBOM = (state: ShipStore | { blocks: BlockInstance[] }) => {
  let smallSteelParts = 0;
  let smallTitaniumParts = 0;
  let titaniumParts = 0;
  let supportHardware = 0;

  state.blocks.forEach(b => {
    const def = BLOCK_DEFINITIONS[b.type];
    if (def && def.costs) {
      smallSteelParts += def.costs.smallSteelParts || 0;
      smallTitaniumParts += def.costs.smallTitaniumParts || 0;
      titaniumParts += def.costs.titaniumParts || 0;
      supportHardware += def.costs.supportHardware || 0;
    }
  });

  return { smallSteelParts, smallTitaniumParts, titaniumParts, supportHardware };
};

export const selectStats = (state: ShipStore | { blocks: BlockInstance[] }) => {
  const totals: Record<string, number> = {};

  state.blocks.forEach(b => {
    const def = BLOCK_DEFINITIONS[b.type];
    if (def && def.stats) {
      Object.entries(def.stats).forEach(([statName, value]) => {
        totals[statName] = (totals[statName] || 0) + value;
      });
    }
  });

  return totals;
};

export const selectDerivedStats = (state: ShipStore | { blocks: BlockInstance[] }, skipConnectivity = false) => {
  return computeDerivedStats(state.blocks, skipConnectivity);
};
