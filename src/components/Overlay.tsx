import { useState } from 'react';
import { useShipStore } from '../store/shipStore';
import { BLOCK_DEFINITIONS, BLOCK_GROUP_ORDER } from '../config/blocks';

// Subcomponents
import { Toast } from './overlay/Toast';
import { CategoryBar } from './overlay/CategoryBar';
import { BlockPalette } from './overlay/BlockPalette';
import { BOMCard } from './overlay/BOMCard';
import { SpecsCard } from './overlay/SpecsCard';
import { BlockInspector } from './overlay/BlockInspector';
import { ShipStorage } from './overlay/ShipStorage';
import { Toolbar } from './overlay/Toolbar';

export function Overlay() {
  const activeTool = useShipStore(s => s.activeTool);

  // Layout toggles
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('');

  const [prevActiveTool, setPrevActiveTool] = useState(activeTool);

  // Sync category on active tool change during render
  if (activeTool !== prevActiveTool) {
    setPrevActiveTool(activeTool);
    if (activeTool && activeTool !== 'select') {
      const def = BLOCK_DEFINITIONS[activeTool];
      if (def && def.group && def.group !== activeCategory) {
        setActiveCategory(def.group);
        setIsDetailPanelOpen(true);
      }
    }
  }

  // Group blocks by group property
  const groupedBlocks: Record<string, typeof BLOCK_DEFINITIONS[string][]> = {};
  Object.values(BLOCK_DEFINITIONS).forEach(def => {
    const group = def.group || 'Other';
    if (!groupedBlocks[group]) {
      groupedBlocks[group] = [];
    }
    groupedBlocks[group].push(def);
  });

  // Sort groups based on defined BLOCK_GROUP_ORDER, then alphabetically
  const groupNames = Object.keys(groupedBlocks).sort((a, b) => {
    const indexA = BLOCK_GROUP_ORDER.indexOf(a);
    const indexB = BLOCK_GROUP_ORDER.indexOf(b);
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });

  const currentCategory = activeCategory || groupNames[0] || 'Steel';

  return (
    <div className="absolute inset-0 pointer-events-none p-6">
      {/* Toast Notification */}
      <Toast />

      {/* Category Selector Bar */}
      <CategoryBar
        isPaletteOpen={isPaletteOpen}
        groupNames={groupNames}
        currentCategory={currentCategory}
        setActiveCategory={setActiveCategory}
        isDetailPanelOpen={isDetailPanelOpen}
        setIsDetailPanelOpen={setIsDetailPanelOpen}
      />

      {/* Detail Panel */}
      <BlockPalette
        isPaletteOpen={isPaletteOpen}
        isDetailPanelOpen={isDetailPanelOpen}
        setIsDetailPanelOpen={setIsDetailPanelOpen}
        currentCategory={currentCategory}
        groupedBlocks={groupedBlocks}
      />

      {/* Right Panel: BOM, Selected Block & Settings */}
      <div className="absolute top-6 right-6 bottom-6 w-[350px] flex flex-col gap-4 pointer-events-auto overflow-y-auto pr-1 select-none custom-scrollbar z-30">
        <BOMCard />
        <SpecsCard />
        <BlockInspector />
        <ShipStorage />
      </div>

      {/* Bottom Panel: Floating Toolbar & Hotkeys Popover */}
      <Toolbar isPaletteOpen={isPaletteOpen} setIsPaletteOpen={setIsPaletteOpen} />
    </div>
  );
}
