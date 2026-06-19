import { useState, useEffect, useRef } from 'react';
import { useShipStore, selectBOM, selectDerivedStats } from '../store/shipStore';
import { BLOCK_DEFINITIONS, STAT_METADATA, BLOCK_GROUP_ORDER, HULL_SHAPES } from '../config/blocks';
import { serializeBlocks } from '../utils/serialization';
import { CategoryIcon, GripIcon, StatIcon } from './Icon';
import { Shape3DPreview } from './Shape3DPreview';

const formatStatKey = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
};

export function Overlay() {
  const activeTool = useShipStore(s => s.activeTool);
  const activeDef = BLOCK_DEFINITIONS[activeTool];
  const activeColor = activeDef?.color || '#909090';
  const setActiveTool = useShipStore(s => s.setActiveTool);
  const activeShape = useShipStore(s => s.activeShape);
  const setActiveShape = useShipStore(s => s.setActiveShape);
  const clearShip = useShipStore(s => s.clearShip);
  const setBlocks = useShipStore(s => s.setBlocks);
  const blocks = useShipStore(s => s.blocks);
  const potatoMode = useShipStore(s => s.potatoMode);
  const setPotatoMode = useShipStore(s => s.setPotatoMode);
  const suggestPotatoMode = useShipStore(s => s.suggestPotatoMode);
  const dismissPotatoSuggestion = useShipStore(s => s.dismissPotatoSuggestion);

  const bom = selectBOM({ blocks });
  const { smallSteelParts, smallTitaniumParts, titaniumParts, supportHardware } = bom;

  const derivedStats = selectDerivedStats({ blocks });
  const shipStats = derivedStats.raw;
  const totalWeight = derivedStats.totalWeight;
  const totalForce = derivedStats.totalForce;

  const DISPLAY_STAT_KEYS = [
    'systemSupport',
    'systemRequirements',
    'hull',
    'weight',
    'thrust',
    'force',
    'powerConsumption',
    'steeringStrength',
    'heatCapacity',
    'heatInterface',
    'materialHeatConductivity',
    'boostThrust',
    'boostPowerConsumption',
    'boostHeatGeneration',
    'frame',
    'heatDissipation',
    'heatGeneration',
    'hullImpactDamage',
    'powerGeneration',
    'powerStorage',
    'maxChargeSpeed',
    'theoreticalEfficiency',
    'selfDischarge',
  ];

  // Combine known metadata stats with any extra dynamic stats present on the ship, prioritizing DISPLAY_STAT_KEYS first
  const baseStatKeys = Array.from(new Set([
    ...DISPLAY_STAT_KEYS,
    ...Object.keys(STAT_METADATA),
    ...Object.keys(shipStats)
  ]));

  const [customOrder, setCustomOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('spacecraft_shipbuilder_specs_order');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse custom specs order', e);
      return [];
    }
  });

  const allStatKeys = [...baseStatKeys];
  if (customOrder.length > 0) {
    allStatKeys.sort((a, b) => {
      const indexA = customOrder.indexOf(a);
      const indexB = customOrder.indexOf(b);
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return baseStatKeys.indexOf(a) - baseStatKeys.indexOf(b);
    });
  }

  const EXPLICIT_KEYS = new Set([
    'systemSupport',
    'systemRequirements',
    'powerGeneration',
    'powerConsumption',
    'powerStorage',
    'maxChargeSpeed',
    'theoreticalEfficiency',
    'selfDischarge',
    'heatGeneration',
    'heatDissipation',
    'heatCapacity',
    'heatInterface',
    'frame',
    'weight',
    'hull',
    'force',
    'thrust',
    'steeringStrength',
    'boostThrust',
    'boostPowerConsumption',
    'boostHeatGeneration',
  ]);
  const otherStatKeys = allStatKeys.filter(key => !EXPLICIT_KEYS.has(key));

  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const draggedKeyRef = useRef<string | null>(null);

  const handleDragStart = (e: React.DragEvent, key: string) => {
    e.dataTransfer.setData('text/plain', key);
    e.dataTransfer.effectAllowed = 'move';
    draggedKeyRef.current = key;
    setTimeout(() => {
      setDraggedKey(key);
    }, 0);
  };

  const handleDragEnter = (e: React.DragEvent, key: string) => {
    e.preventDefault();
    if (draggedKeyRef.current && draggedKeyRef.current !== key) {
      setDragOverKey(key);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragLeave = (_e: React.DragEvent, key: string) => {
    if (dragOverKey === key) {
      setDragOverKey(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    const sourceKey = draggedKeyRef.current;
    if (!sourceKey || sourceKey === targetKey) return;

    const currentKeys = [...allStatKeys];
    const dragIndex = currentKeys.indexOf(sourceKey);
    const targetIndex = currentKeys.indexOf(targetKey);

    if (dragIndex !== -1 && targetIndex !== -1) {
      currentKeys.splice(dragIndex, 1);
      currentKeys.splice(targetIndex, 0, sourceKey);

      setCustomOrder(currentKeys);
      localStorage.setItem('spacecraft_shipbuilder_specs_order', JSON.stringify(currentKeys));
    }

    draggedKeyRef.current = null;
    setDraggedKey(null);
    setDragOverKey(null);
  };

  const handleDragEnd = () => {
    draggedKeyRef.current = null;
    setDraggedKey(null);
    setDragOverKey(null);
  };

  const resetToDefaultOrder = () => {
    setCustomOrder([]);
    localStorage.removeItem('spacecraft_shipbuilder_specs_order');
  };

  const selectedBlockId = useShipStore(s => s.selectedBlockId);
  const setSelectedBlockId = useShipStore(s => s.setSelectedBlockId);
  const nudgeBlock = useShipStore(s => s.nudgeBlock);
  const rotateBlock = useShipStore(s => s.rotateBlock);
  const removeBlock = useShipStore(s => s.removeBlock);
  const startMoveBlock = useShipStore(s => s.startMoveBlock);
  const updateBlockColor = useShipStore(s => s.updateBlockColor);
  const updateBlockShape = useShipStore(s => s.updateBlockShape);
  const flipBlock = useShipStore(s => s.flipBlock);

  // Long term storage hooks
  const savedShips = useShipStore(s => s.savedShips);
  const saveCurrentShip = useShipStore(s => s.saveCurrentShip);
  const deleteSavedShip = useShipStore(s => s.deleteSavedShip);
  const renameSavedShip = useShipStore(s => s.renameSavedShip);

  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('');

  // UI states for saved ships
  const [shipNameInput, setShipNameInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingShipId, setEditingShipId] = useState<string | null>(null);
  const [editingShipName, setEditingShipName] = useState('');

  // Hover states for 3D previews
  const [hoveredShapeId, setHoveredShapeId] = useState<string | null>(null);
  const [hoveredModifyShapeId, setHoveredModifyShapeId] = useState<string | null>(null);
  const [cardMousePos, setCardMousePos] = useState({ x: 0, y: 0 });

  const handleCardMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setCardMousePos({ x, y });
  };

  // Toast state
  const toast = useShipStore(s => s.toast);
  const setToast = useShipStore(s => s.setToast);

  // Redesigned UI states
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [showHotkeys, setShowHotkeys] = useState(false);

  // Collapsible panels states
  const [isBomCollapsed, setIsBomCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('spacecraft_sidebar_bom_collapsed') === 'true';
  });
  const [isSpecsCollapsed, setIsSpecsCollapsed] = useState<boolean>(() => {
    // Specs starts collapsed by default to save space!
    return localStorage.getItem('spacecraft_sidebar_specs_collapsed') !== 'false';
  });
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('spacecraft_sidebar_inspector_collapsed') === 'true';
  });
  const [isStorageCollapsed, setIsStorageCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('spacecraft_sidebar_storage_collapsed') === 'true';
  });

  // Derived sections collapsible states
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('spacecraft_sidebar_sections_collapsed');
      return saved ? JSON.parse(saved) : {
        sp: false,
        power: false,
        heat: false,
        structure: false,
        propulsion: false,
        other: true,
      };
    } catch {
      return {
        sp: false,
        power: false,
        heat: false,
        structure: false,
        propulsion: false,
        other: true,
      };
    }
  });

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => {
      const next = { ...prev, [section]: !prev[section] };
      localStorage.setItem('spacecraft_sidebar_sections_collapsed', JSON.stringify(next));
      return next;
    });
  };

  const [isBoostActive, setIsBoostActive] = useState<boolean>(false);

  const toggleBom = () => {
    setIsBomCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('spacecraft_sidebar_bom_collapsed', String(next));
      return next;
    });
  };

  const toggleSpecs = () => {
    setIsSpecsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('spacecraft_sidebar_specs_collapsed', String(next));
      return next;
    });
  };

  const toggleInspector = () => {
    setIsInspectorCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('spacecraft_sidebar_inspector_collapsed', String(next));
      return next;
    });
  };

  const toggleStorage = () => {
    setIsStorageCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('spacecraft_sidebar_storage_collapsed', String(next));
      return next;
    });
  };

  const activeBomItemsCount = [smallSteelParts, smallTitaniumParts, titaniumParts, supportHardware].filter(v => v > 0).length;

  const getFlightStatus = () => {
    if (blocks.length === 0) {
      return {
        label: 'Empty',
        color: 'text-white/40',
        dotColor: 'bg-white/30',
        warnings: ['Your ship has no blocks. Start placing blocks from the palette.'],
      };
    }

    const warnings: string[] = [];

    // 1. Cockpit Check
    const hasCockpit = blocks.some(b => BLOCK_DEFINITIONS[b.type]?.group === 'Cockpits');
    if (!hasCockpit) {
      warnings.push('No cockpit/core installed. Your ship requires at least one cockpit block to fly.');
    }

    // 2. Connectivity Check
    if (derivedStats.disconnectedBlockIds.length > 0) {
      warnings.push(`${derivedStats.disconnectedBlockIds.length} block(s) are disconnected from the cockpit core. Floating blocks are not allowed.`);
    }

    // 3. Engines Check
    const hasEngines = blocks.some(b => BLOCK_DEFINITIONS[b.type]?.group === 'Thrusters');
    if (!hasEngines) {
      warnings.push('No engines installed. Add thrusters from the Thrusters palette to enable movement.');
    } else if (totalForce <= totalWeight) {
      warnings.push(`Insufficient force. Total force (${totalForce.toFixed(1)}t) must exceed total weight (${totalWeight.toFixed(1)}t). Add more thrusters or reduce weight.`);
    }

    // 4. Efficiency Check
    if (derivedStats.efficiency < 1.0) {
      warnings.push(`Reduced Efficiency. System Requirements exceed System Support (SP). Components are running at ${Math.round(derivedStats.efficiency * 100)}% efficiency.`);
    }

    // 5. Power Balance Check
    if (derivedStats.powerBalance < 0) {
      warnings.push(`Power Deficit. Power consumption (${derivedStats.powerConsumed}kW) exceeds generation (${derivedStats.powerGenerated}kW). Ship speed will be reduced to 15% and components will not be operable.`);
    }

    // 6. Heat Balance Check
    if (derivedStats.heatBalance < 0) {
      warnings.push(`Overheat Risk. Heat generation (${derivedStats.heatGenerated}kW) exceeds dissipation (${derivedStats.heatDissipated}kW). Systems are at risk of failing.`);
    }

    // Determine final status
    if (warnings.length === 0) {
      return {
        label: 'Flight Capable',
        color: 'text-emerald-400',
        dotColor: 'bg-emerald-400',
        warnings: [],
      };
    }

    // Determine primary warning level
    const isCritical = !hasCockpit || derivedStats.disconnectedBlockIds.length > 0 || (hasEngines && totalForce <= totalWeight);
    const isOrange = derivedStats.powerBalance < 0 || derivedStats.heatBalance < 0;

    let label = 'Warnings';
    let color = 'text-yellow-400';
    let dotColor = 'bg-yellow-400';

    if (isCritical) {
      if (!hasCockpit) {
        label = 'No Cockpit';
      } else if (derivedStats.disconnectedBlockIds.length > 0) {
        label = 'Disconnected';
      } else {
        label = 'Overloaded';
      }
      color = 'text-red-400';
      dotColor = 'bg-red-400 animate-pulse';
    } else if (isOrange) {
      if (derivedStats.powerBalance < 0 && derivedStats.heatBalance < 0) {
        label = 'Low Power & Heat';
      } else if (derivedStats.powerBalance < 0) {
        label = 'Low Power';
      } else {
        label = 'Overheat Risk';
      }
      color = 'text-orange-400';
      dotColor = 'bg-orange-400';
    } else if (derivedStats.efficiency < 1.0 || !hasEngines) {
      if (!hasEngines) {
        label = 'No Engines';
      } else {
        label = 'Low Efficiency';
      }
      color = 'text-yellow-400';
      dotColor = 'bg-yellow-400';
    }

    return { label, color, dotColor, warnings };
  };
  const flightStatus = getFlightStatus();

  const showToast = (message: string) => {
    setToast(message);
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast, setToast]);

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

  // Calculate spacecraftplanner.com export URL
  const partCounts: Record<string, number> = {};
  blocks.forEach(b => {
    const def = BLOCK_DEFINITIONS[b.type];
    if (def && def.plannerPartName && def.plannerPartName.trim() !== '') {
      const trimmedName = def.plannerPartName.trim();
      partCounts[trimmedName] = (partCounts[trimmedName] || 0) + 1;
    }
  });

  const partNames = Object.keys(partCounts);
  const quantities = partNames.map(name => partCounts[name]);

  const plannerUrl = partNames.length > 0
    ? `https://www.spacecraftplanner.com/#i=${partNames.join(',')}&q=${quantities.join(',')}`
    : '';

  const hasPlannerParts = partNames.length > 0;
  const selectedBlock = blocks.find(b => b.id === selectedBlockId);
  const selectedBlockDef = selectedBlock ? BLOCK_DEFINITIONS[selectedBlock.type] : null;
  const isSelectedHull = selectedBlockDef && (selectedBlockDef.group === 'Steel' || selectedBlockDef.group === 'Titanium');
  const selectedBlockColor = selectedBlock?.color || selectedBlockDef?.color || '#909090';

  const handleSaveCurrentShip = () => {
    if (shipNameInput.trim()) {
      saveCurrentShip(shipNameInput.trim());
      setShipNameInput('');
      setIsSaving(false);
      showToast("Ship blueprint saved!");
    }
  };

  const handleSaveRename = (id: string) => {
    if (editingShipName.trim()) {
      renameSavedShip(id, editingShipName.trim());
      setEditingShipId(null);
      showToast("Blueprint renamed.");
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none p-6">

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto bg-black/85 backdrop-blur-md px-5 py-3 rounded-full border border-blue-500/30 text-white font-medium text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {toast}
        </div>
      )}

      {/* Category Selector Bar */}
      <div
        className={`absolute top-6 bottom-24 w-20 bg-black/60 backdrop-blur-xl py-4 px-2 rounded-2xl border border-white/10 flex flex-col items-center gap-3 pointer-events-auto transition-all duration-300 ease-in-out select-none z-30 ${isPaletteOpen ? 'left-6 opacity-100' : '-left-24 opacity-0 pointer-events-none'
          }`}
      >
        <div className="flex flex-col gap-3 w-full items-center">
          {groupNames.map(group => {
            const isActive = currentCategory === group;
            return (
              <button
                key={group}
                onClick={() => {
                  if (isActive) {
                    setIsDetailPanelOpen(!isDetailPanelOpen);
                  } else {
                    setActiveCategory(group);
                    setIsDetailPanelOpen(true);
                  }
                }}
                className={`w-16 h-18 py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200 border cursor-pointer ${isActive
                  ? 'bg-blue-500/10 border-blue-500/40 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.1)]'
                  : 'bg-transparent border-transparent text-white/40 hover:text-white/80 hover:bg-white/5'
                  }`}
                title={group}
              >
                <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'hover:scale-105'}`}>
                  <CategoryIcon group={group} />
                </span>
                <span className="text-[8px] font-bold uppercase tracking-wider text-center truncate w-full">
                  {group}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail Panel */}
      <div
        className={`absolute top-6 bottom-24 w-72 bg-black/60 backdrop-blur-xl p-5 rounded-2xl border border-white/10 flex flex-col gap-4 pointer-events-auto transition-all duration-300 ease-in-out select-none z-20 ${isPaletteOpen && isDetailPanelOpen
          ? 'left-[112px] opacity-100 scale-100'
          : 'left-6 opacity-0 pointer-events-none scale-95'
          }`}
      >
        <div className="flex justify-between items-center border-b border-white/10 pb-2.5 flex-shrink-0">
          <h2 className="text-white font-bold uppercase tracking-widest text-xs">{currentCategory}</h2>
          <button
            onClick={() => setIsDetailPanelOpen(false)}
            className="p-1 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors cursor-pointer"
            title="Collapse Panel"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Shape Selector (Only for Steel/Titanium if multiple shapes exist) */}
        {(currentCategory === 'Steel' || currentCategory === 'Titanium') && HULL_SHAPES.length > 1 && (
          <div className="flex flex-col gap-2 border-b border-white/10 pb-3.5 flex-shrink-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-white/40">Select Hull Shape</span>
            <div className="grid grid-cols-5 gap-1.5">
              {HULL_SHAPES.map(shape => {
                const isActive = activeShape === shape.id;
                return (
                  <button
                    key={shape.id}
                    onClick={() => setActiveShape(shape.id)}
                    onMouseEnter={() => setHoveredShapeId(shape.id)}
                    onMouseMove={handleCardMouseMove}
                    onMouseLeave={() => {
                      setHoveredShapeId(null);
                      setCardMousePos({ x: 0, y: 0 });
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 border border-white/5 cursor-pointer ${isActive
                      ? 'bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.15)] scale-105'
                      : 'bg-white/2 text-white/60 hover:text-white hover:bg-white/5 hover:scale-102'
                      }`}
                    title={shape.name}
                  >
                    <Shape3DPreview
                      shapeId={shape.id}
                      color={activeColor}
                      isHovered={hoveredShapeId === shape.id}
                      anyHovered={hoveredShapeId !== null}
                      mouseX={hoveredShapeId === shape.id ? cardMousePos.x : 0}
                      mouseY={hoveredShapeId === shape.id ? cardMousePos.y : 0}
                      className="w-full h-8 mb-1 flex-shrink-0"
                    />
                    <span className="text-[8px] font-semibold truncate max-w-full leading-none pointer-events-none">
                      {shape.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {(groupedBlocks[currentCategory] || []).map(def => {
            const isActive = activeTool === def.type;
            const isCockpit = def.group === 'Cockpits';
            const hasCockpit = blocks.some(b => BLOCK_DEFINITIONS[b.type]?.group === 'Cockpits');
            const isPaletteDisabled = isCockpit && hasCockpit;
            return (
              <button
                key={def.type}
                disabled={isPaletteDisabled}
                onClick={() => {
                  setActiveTool(def.type);
                  setSelectedBlockId(null);
                }}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left border ${isActive
                  ? 'bg-blue-500/10 border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.15)] scale-[1.02]'
                  : isPaletteDisabled
                    ? 'bg-white/1 opacity-30 border-white/5 cursor-not-allowed'
                    : 'bg-white/2 hover:bg-white/6 border-white/5 hover:border-white/10 hover:scale-[1.01] cursor-pointer'
                  }`}
              >
                <div className="w-11 h-11 rounded-lg bg-black/40 border border-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  <Shape3DPreview
                    shapeId={def.group === 'Steel' || def.group === 'Titanium' ? activeShape : 'full'}
                    color={def.color}
                    disableRotation={true}
                    dimensions={def.dimensions}
                    className="w-full h-full"
                  />
                </div>
                <div className="flex flex-col items-start min-w-0 flex-1">
                  <div className="flex justify-between items-center w-full gap-1.5">
                    <span className="text-xs font-semibold text-white/90 truncate">{def.name}</span>
                    {isPaletteDisabled && (
                      <span className="text-[8px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold uppercase tracking-wider flex-shrink-0">
                        Max 1
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-white/40 mt-0.5">{def.dimensions.join(' × ')} Units</span>
                  {def.tags && def.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {def.tags.map(tag => (
                        <span
                          key={tag}
                          className={`text-[8px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wider flex-shrink-0 ${tag === 'Size Incorrect'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-white/5 text-white/60 border-white/10'
                            }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Panel: BOM, Selected Block & Settings */}
      <div className="absolute top-6 right-6 bottom-6 w-[350px] flex flex-col gap-4 pointer-events-auto overflow-y-auto pr-1 select-none custom-scrollbar z-30">

        {/* BOM Card */}
        <div className="bg-black/60 backdrop-blur-xl p-5 rounded-2xl border border-white/10">
          <button
            onClick={toggleBom}
            className="w-full flex justify-between items-center text-left cursor-pointer focus:outline-none group/header"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-white/60 font-bold uppercase tracking-widest text-[10px] group-hover/header:text-blue-400 transition-colors">
                BILL OF MATERIALS
              </span>
              {isBomCollapsed && blocks.length > 0 && (
                <span className="text-[9px] text-blue-400/80 font-bold font-mono bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  {blocks.length} {blocks.length === 1 ? 'BLOCK' : 'BLOCKS'} ({activeBomItemsCount} {activeBomItemsCount === 1 ? 'TYPE' : 'TYPES'})
                </span>
              )}
            </div>

            <svg
              className={`w-3.5 h-3.5 text-white/40 transition-transform duration-300 ${isBomCollapsed ? '-rotate-90' : 'rotate-0'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isBomCollapsed ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-[500px] opacity-100 mt-4'}`}>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'Small Steel Parts', value: smallSteelParts, color: 'text-blue-400' },
                { label: 'Small Titanium Parts', value: smallTitaniumParts, color: 'text-teal-400' },
                { label: 'Titanium Parts', value: titaniumParts, color: 'text-cyan-400' },
                { label: 'Support Hardware', value: supportHardware, color: 'text-orange-400' }
              ].map(item => {
                const isZero = item.value === 0;
                return (
                  <div
                    key={item.label}
                    className={`flex flex-col gap-1.5 p-3 rounded-xl transition-all duration-200 min-w-0 ${isZero
                      ? 'bg-white/[0.01] border border-white/5 opacity-40'
                      : 'bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                      }`}
                  >
                    <span className={`text-[10px] uppercase font-bold tracking-wider truncate w-full transition-colors ${isZero ? 'text-white/20' : 'text-white/40'}`}>
                      {item.label}
                    </span>
                    <span className={`text-lg font-extrabold transition-colors ${isZero ? 'text-white/20' : item.color}`}>
                      {item.value}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4">
              {hasPlannerParts ? (
                <a
                  href={plannerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 hover:scale-102 active:scale-98 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  Export to Planner
                </a>
              ) : (
                <button
                  disabled
                  className="w-full py-2.5 bg-white/5 text-white/30 border border-white/5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  Export to Planner
                </button>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 flex gap-2">
              <button
                onClick={() => {
                  const url = window.location.origin + window.location.pathname + '?ship=' + serializeBlocks(blocks);
                  navigator.clipboard.writeText(url);
                  window.history.replaceState(null, '', url);
                  showToast("Share link copied to clipboard!");
                }}
                disabled={blocks.length === 0}
                className="flex-1 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 disabled:opacity-40 disabled:hover:bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-xs font-bold transition-all disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
                title="Copy Share Link"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935-2.186 2.25 2.25 0 00-3.935 2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                </svg>
                Share Link
              </button>
              <button onClick={clearShip} className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-colors border border-red-500/20 cursor-pointer">
                Clear Ship
              </button>
            </div>
          </div>
        </div>

        {/* Spacecraft Stats Card */}
        <div className="bg-black/60 backdrop-blur-xl p-5 rounded-2xl border border-white/10 relative">
          <div
            onClick={toggleSpecs}
            className="w-full flex justify-between items-center text-left cursor-pointer select-none group/header"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
              <span className="text-white/60 font-bold uppercase tracking-widest text-[10px] group-hover/header:text-blue-400 transition-colors">
                SPECS
              </span>
              {blocks.length > 0 && (
                <div
                  className="group/status flex items-center gap-1.5 ml-1.5 cursor-help"
                  onClick={(e) => e.stopPropagation()} // prevent toggle when clicking status badge
                >
                  <span className={`w-2 h-2 rounded-full ${flightStatus.dotColor}`} />
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${flightStatus.color}`}>
                    {flightStatus.label}
                  </span>

                  {/* Tooltip Overlay */}
                  <div className="absolute top-[48px] left-5 right-5 bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl opacity-0 invisible group-hover/status:opacity-100 group-hover/status:visible transition-all duration-300 z-50 pointer-events-none flex flex-col gap-3">
                    {flightStatus.warnings.length === 0 ? (
                      <div className="flex gap-2.5 text-xs text-emerald-400 text-left">
                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-emerald-400">Flight Capable</span>
                          <span className="text-white/60 leading-normal">Your ship is fully flight capable and meets all construction specifications!</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2.5 text-left text-xs">
                        <span className="font-extrabold text-[10px] text-white/40 uppercase tracking-widest border-b border-white/10 pb-1.5">Active Warnings</span>
                        {flightStatus.warnings.map((warning, idx) => (
                          <div key={idx} className="flex gap-2 text-white/80 leading-normal">
                            <span className="text-orange-400 flex-shrink-0 font-bold">•</span>
                            <span>{warning}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {isSpecsCollapsed && (
                <span className="text-[9px] text-blue-400/80 font-bold font-mono bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 ml-1.5 whitespace-nowrap">
                  SP: {Math.round(derivedStats.efficiency * 100)}% Eff • F/W: {derivedStats.frameToWeightRatio.toFixed(1)}x • Power: {derivedStats.powerBalance >= 0 ? '+' : ''}{derivedStats.powerBalance}kW • Heat: {derivedStats.heatBalance >= 0 ? 'OK' : 'HOT'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isSpecsCollapsed && customOrder.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetToDefaultOrder();
                  }}
                  className="text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider cursor-pointer transition-colors"
                >
                  Reset Order
                </button>
              )}
              <svg
                className={`w-3.5 h-3.5 text-white/40 transition-transform duration-300 ${isSpecsCollapsed ? '-rotate-90' : 'rotate-0'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </div>

          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isSpecsCollapsed ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-[2000px] opacity-100 mt-4 flex flex-col gap-3'}`}>
            {/* Disconnected structures warning */}
            {derivedStats.disconnectedBlockIds.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-start gap-2.5 text-xs text-red-400 animate-pulse">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold">Disconnected Structure</span>
                  <span className="text-white/60 leading-normal">
                    {derivedStats.disconnectedBlockIds.length} block(s) are floating or disconnected from the cockpit/core. All blocks must form a contiguous structure connected via face-to-face contact.
                  </span>
                </div>
              </div>
            )}

            {/* 1. System Support & Efficiency */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5 flex flex-col gap-2.5 hover:bg-white/[0.03] transition-all duration-200">
              <button
                type="button"
                onClick={() => toggleSection('sp')}
                className="flex items-center justify-between w-full text-left font-bold text-[10px] tracking-wider text-white/50 uppercase hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  System Support & Efficiency
                </div>
                <div className="flex items-center gap-1.5">
                  {collapsedSections.sp && (
                    <span className="text-[9px] font-mono font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                      {derivedStats.spProvided}/{derivedStats.spConsumed} SP
                    </span>
                  )}
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${derivedStats.efficiency >= 1 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : derivedStats.efficiency >= 0.75 ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {Math.round(derivedStats.efficiency * 100)}% Eff
                  </span>
                  <span className="text-white/40 hover:text-white transition-colors cursor-pointer">
                    <svg className={`w-3 h-3 transition-transform duration-200 ${collapsedSections.sp ? '-rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </span>
                </div>
              </button>

              {!collapsedSections.sp && (
                <div className="flex flex-col gap-2 mt-1 animate-in fade-in duration-200">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-white/40 font-semibold">Provided Support</span>
                    <span className="font-bold text-white font-mono">{derivedStats.spProvided} <span className="text-[10px] text-white/40">SP</span></span>
                  </div>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-white/40 font-semibold">Required Support</span>
                    <span className="font-bold text-white font-mono">{derivedStats.spConsumed} <span className="text-[10px] text-white/40">SP</span></span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-1 relative">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${derivedStats.efficiency >= 1 ? 'bg-emerald-500' : derivedStats.efficiency >= 0.75 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.round(derivedStats.efficiency * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. Power System */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5 flex flex-col gap-2.5 hover:bg-white/[0.03] transition-all duration-200">
              <button
                type="button"
                onClick={() => toggleSection('power')}
                className="flex items-center justify-between w-full text-left font-bold text-[10px] tracking-wider text-white/50 uppercase hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                  Power System
                </div>
                <div className="flex items-center gap-1.5">
                  {collapsedSections.power && (
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${derivedStats.powerBalance >= 0 ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                      {derivedStats.powerBalance >= 0 ? '+' : ''}{derivedStats.powerBalance} kW
                    </span>
                  )}
                  {(!derivedStats.hasBattery && derivedStats.powerConsumed > 0) && (
                    <span className="text-[9px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded animate-pulse">
                      NO BATTERY
                    </span>
                  )}
                  <span className="text-white/40 hover:text-white transition-colors cursor-pointer">
                    <svg className={`w-3 h-3 transition-transform duration-200 ${collapsedSections.power ? '-rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </span>
                </div>
              </button>

              {!collapsedSections.power && (
                <div className="flex flex-col gap-2 mt-1 animate-in fade-in duration-200">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-white/40 font-semibold">Generation</span>
                    <span className="font-bold text-white font-mono">{derivedStats.powerGenerated} <span className="text-[10px] text-white/40">kW</span></span>
                  </div>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-white/40 font-semibold">Consumption</span>
                    <span className="font-bold text-white font-mono">{derivedStats.powerConsumed} <span className="text-[10px] text-white/40">kW</span></span>
                  </div>
                  <div className="flex justify-between items-baseline text-xs border-t border-white/5 pt-2">
                    <span className="text-white/40 font-semibold">Energy Balance</span>
                    <span className={`font-bold font-mono ${derivedStats.powerBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {derivedStats.powerBalance >= 0 ? '+' : ''}{derivedStats.powerBalance} <span className="text-[10px] opacity-80">kW</span>
                    </span>
                  </div>

                  {/* Battery metrics (rendered dynamically or future-proofed) */}
                  {derivedStats.hasBattery ? (
                    <div className="flex flex-col gap-1.5 mt-1 border-t border-white/5 pt-2 text-[11px] text-white/60">
                      <div className="flex justify-between">
                        <span>Storage Capacity</span>
                        <span className="font-semibold text-white font-mono">{derivedStats.powerStorage} kWh</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max Charge Speed</span>
                        <span className="font-semibold text-white font-mono">{derivedStats.maxChargeSpeed} kW</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Efficiency / Self Discharge</span>
                        <span className="font-semibold text-white font-mono">{Math.round(derivedStats.theoreticalEfficiency)}% / {derivedStats.selfDischarge} kW</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[9px] text-white/40 border border-white/5 bg-white/[0.01] px-2 py-1 rounded mt-1">
                      No power storage blocks (batteries) installed.
                    </div>
                  )}

                  {/* Alerts */}
                  {!derivedStats.hasBattery && derivedStats.powerConsumed > 0 && (
                    <div className="text-[10px] text-red-400 border border-red-500/20 bg-red-500/10 p-2 rounded-lg leading-normal mt-1">
                      <span className="font-bold uppercase tracking-wider block mb-0.5 text-[9px]">Requirement Warning</span>
                      Batteries are mandatory for active components to draw power. Install a battery block.
                    </div>
                  )}
                  {derivedStats.powerBalance < 0 && (
                    <div className="text-[10px] text-orange-400 border border-orange-500/20 bg-orange-500/10 p-2 rounded-lg leading-normal mt-1">
                      <span className="font-bold uppercase tracking-wider block mb-0.5 text-[9px]">Depletion Warning</span>
                      Power consumption exceeds generation. Once battery reserve depletes, ship speed is reduced to ~15%.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. Heat & Thermal */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5 flex flex-col gap-2.5 hover:bg-white/[0.03] transition-all duration-200">
              <button
                type="button"
                onClick={() => toggleSection('heat')}
                className="flex items-center justify-between w-full text-left font-bold text-[10px] tracking-wider text-white/50 uppercase hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  Heat & Thermal
                </div>
                <div className="flex items-center gap-1.5">
                  {collapsedSections.heat && (
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${derivedStats.heatBalance >= 0 ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                      {derivedStats.heatBalance >= 0 ? 'Safe' : 'HOT'}
                    </span>
                  )}
                  <span className="text-white/40 hover:text-white transition-colors cursor-pointer">
                    <svg className={`w-3 h-3 transition-transform duration-200 ${collapsedSections.heat ? '-rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </span>
                </div>
              </button>

              {!collapsedSections.heat && (
                <div className="flex flex-col gap-2 mt-1 animate-in fade-in duration-200">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-white/40 font-semibold">Dissipation</span>
                    <span className="font-bold text-white font-mono">{derivedStats.heatDissipated} <span className="text-[10px] text-white/40">kW</span></span>
                  </div>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-white/40 font-semibold">Generation</span>
                    <span className="font-bold text-white font-mono">{derivedStats.heatGenerated} <span className="text-[10px] text-white/40">kW</span></span>
                  </div>
                  <div className="flex justify-between items-baseline text-xs border-t border-white/5 pt-2">
                    <span className="text-white/40 font-semibold">Thermal Balance</span>
                    <span className={`font-bold font-mono ${derivedStats.heatBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {derivedStats.heatBalance >= 0 ? '+' : ''}{derivedStats.heatBalance} <span className="text-[10px] opacity-80">kW</span>
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-1 border-t border-white/5 pt-2 text-[11px] text-white/60">
                    <div className="flex justify-between">
                      <span>Heat Capacity</span>
                      <span className="font-semibold text-white font-mono">{derivedStats.heatCapacity} MJ/K</span>
                    </div>
                    {derivedStats.heatInterface > 0 && (
                      <div className="flex justify-between">
                        <span>Heat Interface</span>
                        <span className="font-semibold text-white font-mono">{derivedStats.heatInterface}</span>
                      </div>
                    )}
                  </div>

                  {/* Alert */}
                  {derivedStats.heatBalance < 0 && (
                    <div className="text-[10px] text-orange-400 border border-orange-500/20 bg-orange-500/10 p-2 rounded-lg leading-normal mt-1">
                      <span className="font-bold uppercase tracking-wider block mb-0.5 text-[9px]">Thermal Warning</span>
                      Heat generation exceeds dissipation. Ship will heat up globally and eventually overheat.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 4. Structure & Hull */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5 flex flex-col gap-2.5 hover:bg-white/[0.03] transition-all duration-200">
              <button
                type="button"
                onClick={() => toggleSection('structure')}
                className="flex items-center justify-between w-full text-left font-bold text-[10px] tracking-wider text-white/50 uppercase hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Structure & Hull
                </div>
                <div className="flex items-center gap-1.5">
                  {collapsedSections.structure && (
                    <span className="text-[9px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                      F/W: {derivedStats.frameToWeightRatio.toFixed(2)}x
                    </span>
                  )}
                  <span className="text-white/40 hover:text-white transition-colors cursor-pointer">
                    <svg className={`w-3 h-3 transition-transform duration-200 ${collapsedSections.structure ? '-rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </span>
                </div>
              </button>

              {!collapsedSections.structure && (
                <div className="flex flex-col gap-2 mt-1 animate-in fade-in duration-200">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-white/40 font-semibold">Total Frame Capacity</span>
                    <span className="font-bold text-white font-mono">{derivedStats.totalFrame}</span>
                  </div>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-white/40 font-semibold">Total Weight</span>
                    <span className="font-bold text-white font-mono">{derivedStats.totalWeight.toFixed(1)} <span className="text-[10px] text-white/40">t</span></span>
                  </div>
                  <div className="flex justify-between items-baseline text-xs border-t border-white/5 pt-2">
                    <span className="text-white/40 font-semibold">Frame / Weight Ratio</span>
                    <span className={`font-bold font-mono ${derivedStats.frameToWeightRatio >= 1.0 ? 'text-emerald-400' : 'text-orange-400'}`}>
                      {derivedStats.frameToWeightRatio.toFixed(2)}x
                    </span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-1 relative">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${derivedStats.frameToWeightRatio >= 1.0 ? 'bg-emerald-500' : derivedStats.frameToWeightRatio >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(100, Math.max(0, derivedStats.frameToWeightRatio * 100))}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-baseline text-xs border-t border-white/5 pt-2">
                    <span className="text-white/40 font-semibold">Total Hull Strength</span>
                    <span className="font-bold text-white font-mono">{derivedStats.totalHull} <span className="text-[10px] text-white/40">HP</span></span>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Propulsion & Boost */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5 flex flex-col gap-2.5 hover:bg-white/[0.03] transition-all duration-200">
              <button
                type="button"
                onClick={() => toggleSection('propulsion')}
                className="flex items-center justify-between w-full text-left font-bold text-[10px] tracking-wider text-white/50 uppercase hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  Propulsion & Boost
                </div>
                <div className="flex items-center gap-1.5">
                  {collapsedSections.propulsion && (
                    <span className="text-[9px] font-mono font-bold bg-purple-500/10 border border-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">
                      {isBoostActive ? derivedStats.boostTotalThrust : derivedStats.totalThrust} kN
                    </span>
                  )}
                  <span className="text-white/40 hover:text-white transition-colors cursor-pointer">
                    <svg className={`w-3 h-3 transition-transform duration-200 ${collapsedSections.propulsion ? '-rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </span>
                </div>
              </button>

              {!collapsedSections.propulsion && (
                <div className="flex flex-col gap-2 mt-1 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/5 mb-1">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-extrabold text-white uppercase tracking-wider">Boost Mode</span>
                      <span className="text-[9px] text-white/40">Toggle additive booster stats</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setIsBoostActive(!isBoostActive)}
                      className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${isBoostActive ? 'bg-pink-500' : 'bg-white/10'}`}
                    >
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 ${isBoostActive ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-white/40 font-semibold">Engine Load Capacity (Force)</span>
                    <span className="font-bold text-white font-mono">{derivedStats.totalForce.toFixed(1)} <span className="text-[10px] text-white/40">t</span></span>
                  </div>

                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-white/40 font-semibold">Thrust</span>
                    {isBoostActive ? (
                      <span className="font-bold text-pink-400 font-mono">
                        {derivedStats.boostTotalThrust} <span className="text-[10px] opacity-80">kN</span>
                        <span className="text-[10px] text-white/40 ml-1 font-normal font-sans">({derivedStats.totalThrust} kN base)</span>
                      </span>
                    ) : (
                      <span className="font-bold text-white font-mono">
                        {derivedStats.totalThrust} <span className="text-[10px] text-white/40">kN</span>
                        {derivedStats.boostTotalThrust > derivedStats.totalThrust && (
                          <span className="text-[10px] text-pink-500/80 ml-1 font-normal font-sans">({derivedStats.boostTotalThrust} kN boost)</span>
                        )}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-white/40 font-semibold">Steering Strength</span>
                    <span className="font-bold text-white font-mono">{derivedStats.steeringStrength} <span className="text-[10px] text-white/40">kN</span></span>
                  </div>

                  <div className="flex justify-between items-baseline text-xs border-t border-white/5 pt-2">
                    <span className="text-white/40 font-semibold">Propulsion Power Draw</span>
                    {isBoostActive ? (
                      <span className="font-bold text-pink-400 font-mono">
                        {derivedStats.boostTotalPower} <span className="text-[10px] opacity-80">kW</span>
                      </span>
                    ) : (
                      <span className="font-bold text-white font-mono">
                        {derivedStats.powerConsumed} <span className="text-[10px] text-white/40">kW</span>
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-white/40 font-semibold">Propulsion Heat Gen</span>
                    {isBoostActive ? (
                      <span className="font-bold text-pink-400 font-mono">
                        {derivedStats.boostTotalHeat} <span className="text-[10px] opacity-80">kW</span>
                      </span>
                    ) : (
                      <span className="font-bold text-white font-mono">
                        {derivedStats.heatGenerated} <span className="text-[10px] text-white/40">kW</span>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 6. Other / Raw Stats */}
            {otherStatKeys.length > 0 && (
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5 flex flex-col gap-2.5 hover:bg-white/[0.03] transition-all duration-200">
                <button
                  type="button"
                  onClick={() => toggleSection('other')}
                  className="flex items-center justify-between w-full text-left font-bold text-[10px] tracking-wider text-white/50 uppercase hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    Other / Raw Stats
                  </div>
                  <div className="flex items-center gap-1.5">
                    {collapsedSections.other && (
                      <span className="text-[9px] font-mono font-bold bg-gray-500/10 border border-gray-500/20 text-gray-400 px-1.5 py-0.5 rounded">
                        {otherStatKeys.length} stats
                      </span>
                    )}
                    <span className="text-white/40 hover:text-white transition-colors cursor-pointer">
                      <svg className={`w-3 h-3 transition-transform duration-200 ${collapsedSections.other ? '-rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </span>
                  </div>
                </button>

                {!collapsedSections.other && (
                  <div className="grid grid-cols-2 gap-2.5 mt-1 animate-in fade-in duration-200">
                    {otherStatKeys.map((key: string) => {
                      const value = shipStats[key] || 0;
                      const meta = STAT_METADATA[key];
                      const name = meta?.name || formatStatKey(key);
                      const unit = meta?.unit || '';
                      const colorClass = meta?.color || 'text-blue-400';
                      const icon = meta?.icon;

                      const isDragging = draggedKey === key;
                      const isDragOver = dragOverKey === key;

                      return (
                        <div
                          key={key}
                          draggable
                          onDragStart={(e) => handleDragStart(e, key)}
                          onDragEnter={(e) => handleDragEnter(e, key)}
                          onDragOver={handleDragOver}
                          onDragLeave={(e) => handleDragLeave(e, key)}
                          onDrop={(e) => handleDrop(e, key)}
                          onDragEnd={handleDragEnd}
                          className={`group flex flex-col gap-1 p-2 rounded-lg transition-all duration-200 min-w-0 cursor-grab active:cursor-grabbing select-none relative ${isDragging
                            ? 'opacity-30 border border-blue-500/30 bg-white/[0.01]'
                            : isDragOver
                              ? 'bg-blue-500/10 border border-blue-500 scale-[1.02] shadow-[0_0_15px_rgba(59,130,246,0.3)] z-10'
                              : 'bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10'
                            }`}
                        >
                          <div className="flex items-center justify-between gap-1 min-w-0 pointer-events-none">
                            <div className="flex items-center gap-1 text-white/40 text-[9px] uppercase font-bold tracking-wider min-w-0">
                              <span className={`${colorClass} flex-shrink-0 scale-90`}>
                                <StatIcon iconType={icon} />
                              </span>
                              <span className="truncate w-full">{name}</span>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
                              <GripIcon />
                            </div>
                          </div>
                          <div className="text-sm font-extrabold text-white flex items-baseline gap-0.5 pointer-events-none">
                            <span>{value}</span>
                            {unit && <span className={`text-[9px] font-semibold ${colorClass} ml-0.5`}>{unit}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Selected Block Card */}
        {selectedBlock && (
          <div className="bg-black/80 backdrop-blur-xl p-5 rounded-2xl border border-blue-500/30 flex flex-col gap-4 animate-in fade-in slide-in-from-right-5 duration-300">
            <div className="flex justify-between items-center border-b border-white/10 pb-2 flex-shrink-0">
              <div
                onClick={toggleInspector}
                className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer select-none group/header"
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400 group-hover/header:text-blue-300 transition-colors">
                    BLOCK INSPECTOR
                  </span>
                  {!isInspectorCollapsed && (
                    <span className="text-sm font-bold text-white truncate w-full">
                      {BLOCK_DEFINITIONS[selectedBlock.type]?.name || selectedBlock.type}
                    </span>
                  )}
                </div>
                {isInspectorCollapsed && (
                  <span className="text-[9px] text-blue-400/80 font-bold font-mono bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 truncate max-w-[150px]">
                    {BLOCK_DEFINITIONS[selectedBlock.type]?.name || selectedBlock.type} @ [{selectedBlock.position.join(',')}]
                  </span>
                )}
                <svg
                  className={`w-3.5 h-3.5 text-white/40 transition-transform duration-300 ${isInspectorCollapsed ? '-rotate-90' : 'rotate-0'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedBlockId(null);
                }}
                className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white cursor-pointer flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isInspectorCollapsed ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-[1000px] opacity-100 flex flex-col gap-4'}`}>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/5 p-2 rounded border border-white/5">
                  <span className="text-white/40 block text-[9px] uppercase font-semibold">Position</span>
                  <span className="text-white/90 font-mono font-medium">
                    {selectedBlock.position.join(', ')}
                  </span>
                </div>
                <div className="bg-white/5 p-2 rounded border border-white/5">
                  <span className="text-white/40 block text-[9px] uppercase font-semibold">Rotation</span>
                  <span className="text-white/90 font-mono font-medium">
                    {selectedBlock.rotation.map(r => Math.round(r * 180 / Math.PI)).join('°, ')}°
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => startMoveBlock(selectedBlock.id)}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 hover:scale-102 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  Move Block (M)
                </button>

                <div className="flex flex-col gap-1.5 mt-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-white/50">Nudge Block</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => nudgeBlock(selectedBlock.id, [-1, 0, 0])}
                      className="py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-xs font-semibold hover:scale-102 cursor-pointer"
                      title="Nudge X-"
                    >
                      X-
                    </button>
                    <button
                      onClick={() => nudgeBlock(selectedBlock.id, [1, 0, 0])}
                      className="py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-xs font-semibold hover:scale-102 cursor-pointer"
                      title="Nudge X+"
                    >
                      X+
                    </button>

                    <button
                      onClick={() => nudgeBlock(selectedBlock.id, [0, -1, 0])}
                      className="py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-xs font-semibold hover:scale-102 cursor-pointer"
                      title="Nudge Y- (Shift+Down)"
                    >
                      Y-
                    </button>
                    <button
                      onClick={() => nudgeBlock(selectedBlock.id, [0, 1, 0])}
                      className="py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-xs font-semibold hover:scale-102 cursor-pointer"
                      title="Nudge Y+"
                    >
                      Y+
                    </button>

                    <button
                      onClick={() => nudgeBlock(selectedBlock.id, [0, 0, -1])}
                      className="py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-xs font-semibold hover:scale-102 cursor-pointer"
                      title="Nudge Z- (Up Arrow)"
                    >
                      Z-
                    </button>
                    <button
                      onClick={() => nudgeBlock(selectedBlock.id, [0, 0, 1])}
                      className="py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-xs font-semibold hover:scale-102 cursor-pointer"
                      title="Nudge Z+"
                    >
                      Z+
                    </button>
                  </div>
                </div>

                {BLOCK_DEFINITIONS[selectedBlock.type]?.group === 'Thrusters' && (
                  <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-white/5">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-white/50">Orientation</span>
                    <div className="grid grid-cols-1 gap-1.5">
                      <button
                        onClick={() => rotateBlock(selectedBlock.id, 'x')}
                        className="py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-semibold hover:scale-102 cursor-pointer text-center"
                        title="Flip X (X Key)"
                      >
                        Flip X
                      </button>
                    </div>
                  </div>
                )}

                {/* Block Shape Selection (Only for Steel/Titanium if multiple shapes exist) */}
                {isSelectedHull && HULL_SHAPES.length > 1 && (
                  <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-white/5">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-white/50">Modify Shape</span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {HULL_SHAPES.map(shape => {
                        const isActive = (selectedBlock.shape || 'full') === shape.id;
                        return (
                          <button
                            key={shape.id}
                            onClick={() => updateBlockShape(selectedBlock.id, shape.id)}
                            onMouseEnter={() => setHoveredModifyShapeId(shape.id)}
                            onMouseMove={handleCardMouseMove}
                            onMouseLeave={() => {
                              setHoveredModifyShapeId(null);
                              setCardMousePos({ x: 0, y: 0 });
                            }}
                            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 border border-white/10 cursor-pointer ${isActive
                              ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.2)]'
                              : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 hover:scale-102'
                              }`}
                            title={shape.name}
                          >
                            <Shape3DPreview
                              shapeId={shape.id}
                              color={selectedBlockColor}
                              isHovered={hoveredModifyShapeId === shape.id}
                              anyHovered={hoveredModifyShapeId !== null}
                              mouseX={hoveredModifyShapeId === shape.id ? cardMousePos.x : 0}
                              mouseY={hoveredModifyShapeId === shape.id ? cardMousePos.y : 0}
                              className="w-full h-6 mb-1 flex-shrink-0"
                            />
                            <span className="text-[8px] font-semibold truncate max-w-full leading-none pointer-events-none">
                              {shape.name.split(' ')[0]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {isSelectedHull && (
                  <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-white/5">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-white/50">Flip Block</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => flipBlock(selectedBlock.id, 'x')}
                        className={`py-1.5 rounded-lg text-xs font-semibold hover:scale-102 cursor-pointer text-center border transition-all duration-205 ${
                          selectedBlock.flipX
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 hover:bg-blue-500/30'
                            : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                        title="Flip X (X Key)"
                      >
                        Flip X
                      </button>
                      <button
                        onClick={() => flipBlock(selectedBlock.id, 'y')}
                        className={`py-1.5 rounded-lg text-xs font-semibold hover:scale-102 cursor-pointer text-center border transition-all duration-205 ${
                          selectedBlock.flipY
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 hover:bg-blue-500/30'
                            : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                        title="Flip Y (Y Key)"
                      >
                        Flip Y
                      </button>
                      <button
                        onClick={() => flipBlock(selectedBlock.id, 'z')}
                        className={`py-1.5 rounded-lg text-xs font-semibold hover:scale-102 cursor-pointer text-center border transition-all duration-205 ${
                          selectedBlock.flipZ
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 hover:bg-blue-500/30'
                            : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                        title="Flip Z (Z Key)"
                      >
                        Flip Z
                      </button>
                    </div>
                  </div>
                )}


                <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-white/5">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-white/50">Block Color</span>
                  <div className="flex items-center gap-2">
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/10 hover:border-white/20 transition-all">
                      <input
                        type="color"
                        value={selectedBlock.color || BLOCK_DEFINITIONS[selectedBlock.type]?.color || '#ffffff'}
                        onChange={(e) => updateBlockColor(selectedBlock.id, e.target.value)}
                        className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                      />
                    </div>
                    <button
                      onClick={() => updateBlockColor(selectedBlock.id, undefined)}
                      disabled={!selectedBlock.color}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 text-[10px] text-white/80 hover:text-white border border-white/10 rounded-lg transition-all cursor-pointer font-semibold disabled:cursor-not-allowed"
                    >
                      Reset to Default
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 mt-2 border-t border-white/10 pt-3">
                  <button
                    onClick={() => removeBlock(selectedBlock.id)}
                    className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setSelectedBlockId(null)}
                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Deselect
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Blueprint Storage Card */}
        <div className="bg-black/60 backdrop-blur-xl p-5 rounded-2xl border border-white/10">
          <button
            onClick={toggleStorage}
            className="w-full flex justify-between items-center text-left cursor-pointer focus:outline-none group/header"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-white/60 font-bold uppercase tracking-widest text-[10px] group-hover/header:text-blue-400 transition-colors">
                SHIP STORAGE
              </span>
              {isStorageCollapsed && (
                <span className="text-[9px] text-blue-400/80 font-bold font-mono bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  {savedShips.length} {savedShips.length === 1 ? 'BLUEPRINT' : 'BLUEPRINTS'}
                </span>
              )}
            </div>

            <svg
              className={`w-3.5 h-3.5 text-white/40 transition-transform duration-300 ${isStorageCollapsed ? '-rotate-90' : 'rotate-0'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isStorageCollapsed ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-[500px] opacity-100 mt-4 flex flex-col gap-3'}`}>
            {/* Saved Ships List */}
            <div className="max-h-52 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {savedShips.length === 0 ? (
                <div className="text-center py-6 text-white/40 text-xs border border-dashed border-white/10 rounded-xl bg-white/2">
                  No saved blueprints.
                </div>
              ) : (
                savedShips.map(ship => (
                  <div key={ship.id} className="flex flex-col gap-2 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/8 transition-all duration-300">
                    <div className="flex justify-between items-center gap-2">
                      {editingShipId === ship.id ? (
                        <div className="flex items-center gap-1.5 w-full">
                          <input
                            type="text"
                            value={editingShipName}
                            onChange={(e) => setEditingShipName(e.target.value)}
                            className="flex-1 min-w-0 bg-black/40 border border-white/20 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-400"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(ship.id);
                              if (e.key === 'Escape') setEditingShipId(null);
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveRename(ship.id)}
                            className="p-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 rounded-md cursor-pointer"
                            title="Save"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setEditingShipId(null)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-md cursor-pointer"
                            title="Cancel"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="text-xs font-bold text-white truncate max-w-[150px]">{ship.name}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingShipId(ship.id);
                                setEditingShipName(ship.name);
                              }}
                              className="p-1 hover:bg-white/10 text-white/50 hover:text-white rounded transition-colors cursor-pointer"
                              title="Rename"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                deleteSavedShip(ship.id);
                                showToast(`Deleted blueprint "${ship.name}"`);
                              }}
                              className="p-1 hover:bg-red-500/20 text-red-400/50 hover:text-red-400 rounded transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Ship Details & Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-white/50 border-t border-white/5 pt-1.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-blue-400">
                          {ship.totalBlocks} {ship.totalBlocks === 1 ? 'block' : 'blocks'}
                        </span>
                        <span className="text-white/40">
                          SP: {ship.stats?.systemRequirements || 0} / {ship.stats?.systemSupport || 0} • F/W: {(ship.stats?.force || 0).toFixed(1)}t / {(ship.stats?.weight || 0).toFixed(1)}t
                        </span>
                      </div>

                      {!editingShipId && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              const url = window.location.origin + window.location.pathname + '?ship=' + serializeBlocks(ship.blocks);
                              navigator.clipboard.writeText(url);
                              window.history.replaceState(null, '', url);
                              showToast(`Share link for "${ship.name}" copied!`);
                            }}
                            className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white/80 hover:text-white transition-all font-semibold flex items-center gap-1 cursor-pointer"
                            title="Copy Share Link"
                          >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935-2.186 2.25 2.25 0 00-3.935 2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                            </svg>
                            Share
                          </button>
                          <button
                            onClick={() => {
                              setBlocks(ship.blocks);
                              showToast(`Loaded "${ship.name}" blueprint.`);
                            }}
                            className="px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/35 border border-blue-400/30 rounded text-blue-300 font-bold cursor-pointer"
                          >
                            Load
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Save Ship Form */}
            {isSaving ? (
              <div className="flex flex-col gap-2 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 animate-in slide-in-from-bottom-2 duration-300">
                <span className="text-[9px] uppercase font-bold tracking-widest text-blue-400">Save Design Blueprint</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Blueprint name..."
                    value={shipNameInput}
                    onChange={(e) => setShipNameInput(e.target.value)}
                    className="flex-1 bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveCurrentShip();
                      if (e.key === 'Escape') setIsSaving(false);
                    }}
                    autoFocus
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setIsSaving(false)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCurrentShip}
                    disabled={!shipNameInput.trim()}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsSaving(true)}
                disabled={blocks.length === 0}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white transition-all hover:scale-101 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Save Current Ship
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Panel: Floating Toolbar & Hotkeys Popover */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-auto flex flex-col items-center gap-3">

        {/* Potato Mode Suggestion Popover */}
        {suggestPotatoMode && !potatoMode && (
          <div className="bg-black/90 backdrop-blur-2xl border border-amber-500/40 p-4 rounded-2xl w-72 text-xs text-white flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-300 select-none">
            <div className="flex gap-2.5 items-start">
              <div className="text-xl flex-shrink-0">🥔</div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">Optimize Performance?</span>
                <span className="text-[10px] text-white/70 leading-relaxed">
                  We noticed frame rate drops or low-spec hardware. Enable Potato Mode to disable resource-heavy 3D menu previews and reflections for a smoother experience.
                </span>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-1">
              <button
                onClick={dismissPotatoSuggestion}
                className="px-2.5 py-1.5 hover:bg-white/10 rounded-lg text-[10px] text-white/50 hover:text-white cursor-pointer font-bold transition-all"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  setPotatoMode(true);
                  dismissPotatoSuggestion();
                }}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black rounded-lg text-[10px] font-bold cursor-pointer transition-all shadow-[0_0_8px_rgba(245,158,11,0.2)]"
              >
                Enable Potato Mode
              </button>
            </div>
          </div>
        )}

        {/* Hotkeys Popover */}
        {showHotkeys && (
          <div className="bg-black/90 backdrop-blur-2xl border border-white/10 p-5 rounded-2xl w-80 text-xs text-white flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 select-none">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className="font-bold text-blue-400 uppercase tracking-wider text-[10px]">Controls & Hotkeys</span>
              <button
                onClick={() => setShowHotkeys(false)}
                className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white cursor-pointer"
                title="Close"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              <div className="flex justify-between items-center">
                <span className="text-white/60">Place / Select Block</span>
                <kbd className="bg-white/10 px-2 py-0.5 rounded text-white font-mono text-[10px] border border-white/20 shadow-inner">LMB</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60">Delete Block</span>
                <kbd className="bg-white/10 px-2 py-0.5 rounded text-white font-mono text-[10px] border border-white/20 shadow-inner">RMB / Del</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60">Flip Engine</span>
                <kbd className="bg-white/10 px-2 py-0.5 rounded text-white font-mono text-[10px] border border-white/20 shadow-inner">X</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60">Select Mode</span>
                <kbd className="bg-white/10 px-2 py-0.5 rounded text-white font-mono text-[10px] border border-white/20 shadow-inner">S</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60">Move Block</span>
                <kbd className="bg-white/10 px-2 py-0.5 rounded text-white font-mono text-[10px] border border-white/20 shadow-inner">M</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60">Nudge Block (X / Z)</span>
                <kbd className="bg-white/10 px-2 py-0.5 rounded text-white font-mono text-[10px] border border-white/20 shadow-inner">Arrows</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60">Nudge Block (Y)</span>
                <kbd className="bg-white/10 px-2 py-0.5 rounded text-white font-mono text-[10px] border border-white/20 shadow-inner">Shift + Arrows</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60">Camera Orbit</span>
                <kbd className="bg-white/10 px-2 py-0.5 rounded text-white font-mono text-[10px] border border-white/20 shadow-inner">Drag</kbd>
              </div>
            </div>
          </div>
        )}

        {/* Floating Dock */}
        <div className="bg-black/75 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full flex items-center gap-2.5 h-12">

          {/* Toggle Block Palette */}
          <button
            onClick={() => setIsPaletteOpen(!isPaletteOpen)}
            className={`p-2 rounded-full transition-all duration-300 cursor-pointer border ${isPaletteOpen
              ? 'bg-blue-500/20 text-blue-400 border-blue-400/30'
              : 'hover:bg-white/5 text-white/60 hover:text-white border-transparent'
              }`}
            title="Toggle Block Palette"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>

          {/* Select Mode */}
          <button
            onClick={() => {
              setActiveTool('select');
              setSelectedBlockId(null);
            }}
            className={`p-2 rounded-full transition-all duration-300 cursor-pointer border ${activeTool === 'select'
              ? 'bg-blue-500/20 text-blue-400 border-blue-400/30'
              : 'hover:bg-white/5 text-white/60 hover:text-white border-transparent'
              }`}
            title="Select & Move Mode (S)"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 2l12 11.2-5.8.8 3.8 6.6-2.6 1.5-3.8-6.6-3.6 3.5z" />
            </svg>
          </button>

          {/* Active Tool Indicator */}
          {activeTool !== 'select' && (
            <>
              <div className="h-5 w-[1px] bg-white/10" />
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/35 text-blue-300 text-xs font-semibold animate-in zoom-in-95 duration-200 max-w-[160px]">
                <div
                  className="w-2.5 h-2.5 rounded-full border border-white/20 shadow-inner flex-shrink-0"
                  style={{ backgroundColor: BLOCK_DEFINITIONS[activeTool]?.color }}
                />
                <span className="truncate">{BLOCK_DEFINITIONS[activeTool]?.name}</span>
                <button
                  onClick={() => {
                    setActiveTool('select');
                    setSelectedBlockId(null);
                  }}
                  className="ml-1 p-0.5 hover:bg-white/15 rounded-full text-blue-300 hover:text-white transition-colors cursor-pointer"
                  title="Switch to Select Mode"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </>
          )}

          <div className="h-5 w-[1px] bg-white/10" />

          {/* Help / Hotkeys Toggle */}
          <button
            onClick={() => setShowHotkeys(!showHotkeys)}
            className={`p-2 rounded-full transition-all duration-300 cursor-pointer border ${showHotkeys
              ? 'bg-blue-500/20 text-blue-400 border-blue-400/30'
              : 'hover:bg-white/5 text-white/60 hover:text-white border-transparent'
              }`}
            title="Toggle Controls Help"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
          </button>

          {/* Potato Mode Toggle */}
          <button
            onClick={() => setPotatoMode(!potatoMode)}
            className={`p-2 rounded-full transition-all duration-300 cursor-pointer border ${potatoMode
              ? 'bg-amber-500/20 text-amber-400 border-amber-400/30'
              : 'hover:bg-white/5 text-white/60 hover:text-white border-transparent'
              }`}
            title={potatoMode ? "Disable Potato Mode (High Quality)" : "Enable Potato Mode (Low Spec)"}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M 6 12 C 4 7, 10 3, 16 4 C 20 5, 21 9, 20 13 C 19 17, 16 20, 11 20 C 6 20, 8 16, 6 12 Z" />
              <circle cx="9" cy="9" r="0.8" fill="black" opacity="0.35" />
              <circle cx="14" cy="8" r="0.6" fill="black" opacity="0.35" />
              <circle cx="11" cy="14" r="0.7" fill="black" opacity="0.35" />
              <circle cx="16" cy="13" r="0.5" fill="black" opacity="0.35" />
            </svg>
          </button>

        </div>
      </div>

    </div>
  );
}
