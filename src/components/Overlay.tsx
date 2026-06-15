import { useState, useEffect } from 'react';
import { useShipStore, selectBOM } from '../store/shipStore';
import { BLOCK_DEFINITIONS } from '../config/blocks';
import { serializeBlocks } from '../utils/serialization';

const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`w-4 h-4 text-white/60 transition-transform duration-300 ${
      isOpen ? 'rotate-0' : '-rotate-90'
    }`}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export function Overlay() {
  const activeTool = useShipStore(s => s.activeTool);
  const setActiveTool = useShipStore(s => s.setActiveTool);
  const clearShip = useShipStore(s => s.clearShip);
  const setBlocks = useShipStore(s => s.setBlocks);
  const smallSteelParts = useShipStore(s => selectBOM(s).smallSteelParts);
  const supportHardware = useShipStore(s => selectBOM(s).supportHardware);
  const blocks = useShipStore(s => s.blocks);

  const selectedBlockId = useShipStore(s => s.selectedBlockId);
  const setSelectedBlockId = useShipStore(s => s.setSelectedBlockId);
  const nudgeBlock = useShipStore(s => s.nudgeBlock);
  const rotateBlock = useShipStore(s => s.rotateBlock);
  const removeBlock = useShipStore(s => s.removeBlock);
  const startMoveBlock = useShipStore(s => s.startMoveBlock);

  // Long term storage hooks
  const savedShips = useShipStore(s => s.savedShips);
  const saveCurrentShip = useShipStore(s => s.saveCurrentShip);
  const deleteSavedShip = useShipStore(s => s.deleteSavedShip);
  const renameSavedShip = useShipStore(s => s.renameSavedShip);

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  
  // UI states for saved ships
  const [shipNameInput, setShipNameInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingShipId, setEditingShipId] = useState<string | null>(null);
  const [editingShipName, setEditingShipName] = useState('');
  
  // Toast state
  const [toast, setToast] = useState<string | null>(null);

  // Redesigned UI states
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [showHotkeys, setShowHotkeys] = useState(false);

  const showToast = (message: string) => {
    setToast(message);
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  // Group blocks by group property
  const groupedBlocks: Record<string, typeof BLOCK_DEFINITIONS[string][]> = {};
  Object.values(BLOCK_DEFINITIONS).forEach(def => {
    const group = def.group || 'Other';
    if (!groupedBlocks[group]) {
      groupedBlocks[group] = [];
    }
    groupedBlocks[group].push(def);
  });

  // Sort groups: Steel first, then alphabetical
  const groupNames = Object.keys(groupedBlocks).sort((a, b) => {
    if (a === 'Steel') return -1;
    if (b === 'Steel') return 1;
    return a.localeCompare(b);
  });

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

      {/* Left Panel: Palette */}
      <div 
        className={`absolute top-6 bottom-24 w-72 bg-black/60 backdrop-blur-xl p-5 rounded-2xl border border-white/10 flex flex-col gap-4 pointer-events-auto transition-all duration-300 ease-in-out select-none z-30 ${
          isPaletteOpen ? 'left-6 opacity-100' : '-left-80 opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex justify-between items-center border-b border-white/10 pb-2 flex-shrink-0">
          <h2 className="text-white/60 font-bold uppercase tracking-widest text-[10px]">Block Palette</h2>
          <button 
            onClick={() => setIsPaletteOpen(false)}
            className="p-1 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors cursor-pointer"
            title="Hide Palette"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
          {groupNames.map(group => {
            const blocks = groupedBlocks[group];
            const isCollapsed = collapsedGroups[group];
            const isOpen = !isCollapsed;

            return (
              <div key={group} className="flex flex-col gap-2 border-b border-white/5 last:border-0 pb-3 last:pb-0">
                <button
                  onClick={() => toggleGroup(group)}
                  className="flex items-center justify-between w-full py-1.5 hover:opacity-80 transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-white/80">{group}</span>
                    <span className="text-[10px] font-semibold bg-white/10 text-white/50 px-1.5 py-0.5 rounded-full">
                      {blocks.length}
                    </span>
                  </div>
                  <ChevronIcon isOpen={isOpen} />
                </button>

                <div
                  className={`flex flex-col gap-2 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0 pointer-events-none'
                    }`}
                >
                  {blocks.map(def => (
                    <button
                      key={def.type}
                      onClick={() => {
                        setActiveTool(def.type);
                        setSelectedBlockId(null);
                      }}
                      className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer ${activeTool === def.type
                          ? 'bg-blue-500/20 border-blue-400/50 scale-102'
                          : 'bg-white/5 hover:bg-white/10 border-transparent hover:scale-101'
                        } border text-left`}
                    >
                      <div className="w-8 h-8 rounded-md shadow-inner border border-white/20 flex-shrink-0" style={{ backgroundColor: def.color }} />
                      <div className="flex flex-col items-start min-w-0">
                        <span className="text-xs font-semibold text-white/90 truncate w-full">{def.name}</span>
                        <span className="text-[10px] text-white/50">{def.dimensions.join(' × ')} Units</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Panel: BOM, Selected Block & Settings */}
      <div className="absolute top-6 right-6 bottom-6 w-72 flex flex-col gap-4 pointer-events-auto overflow-y-auto pr-1 select-none custom-scrollbar z-30">
        
        {/* BOM Card */}
        <div className="bg-black/60 backdrop-blur-xl p-5 rounded-2xl border border-white/10">
          <h2 className="text-white/60 font-bold uppercase tracking-widest text-[10px] mb-4">Bill of Materials</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5">
              <span className="text-sm text-white/80 font-medium">Small Steel Parts</span>
              <span className="text-lg font-bold text-blue-400">{smallSteelParts}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5">
              <span className="text-sm text-white/80 font-medium">Support Hardware</span>
              <span className="text-lg font-bold text-orange-400">{supportHardware}</span>
            </div>
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

          <div className="mt-6 pt-4 border-t border-white/10 flex gap-2">
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

        {/* Selected Block Card */}
        {selectedBlock && (
          <div className="bg-black/80 backdrop-blur-xl p-5 rounded-2xl border border-blue-500/30 flex flex-col gap-4 animate-in fade-in slide-in-from-right-5 duration-300">
            <div className="flex justify-between items-center border-b border-white/10 pb-2 flex-shrink-0">
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400">Selected Block</span>
                <span className="text-sm font-bold text-white truncate w-full">
                  {BLOCK_DEFINITIONS[selectedBlock.type]?.name || selectedBlock.type}
                </span>
              </div>
              <button
                onClick={() => setSelectedBlockId(null)}
                className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white cursor-pointer flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

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
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/50">Nudge / Rotate Block</span>
                <div className="grid grid-cols-3 gap-1.5">
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
                    onClick={() => rotateBlock(selectedBlock.id, 'x')}
                    className="py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-semibold hover:scale-102 cursor-pointer"
                    title="Rotate X (X Key)"
                  >
                    Rot X
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
                    title="Nudge Y+ (Shift+Up)"
                  >
                    Y+
                  </button>
                  <button
                    onClick={() => rotateBlock(selectedBlock.id, 'y')}
                    className="py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-semibold hover:scale-102 cursor-pointer"
                    title="Rotate Y (R Key)"
                  >
                    Rot Y
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
                  <button
                    onClick={() => rotateBlock(selectedBlock.id, 'z')}
                    className="py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-semibold hover:scale-102 cursor-pointer"
                    title="Rotate Z (Z Key)"
                  >
                    Rot Z
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
        )}

        {/* Blueprint Storage Card */}
        <div className="bg-black/60 backdrop-blur-xl p-5 rounded-2xl border border-white/10 flex flex-col gap-3">
          <h2 className="text-white/60 font-bold uppercase tracking-widest text-[10px]">Ship Storage</h2>
          
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
                        SSP: {ship.bom.smallSteelParts || 0} • SH: {ship.bom.supportHardware || 0}
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

      {/* Bottom Panel: Floating Toolbar & Hotkeys Popover */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-auto flex flex-col items-center gap-3">
        
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
                <span className="text-white/60">Rotate (Y / X / Z)</span>
                <kbd className="bg-white/10 px-2 py-0.5 rounded text-white font-mono text-[10px] border border-white/20 shadow-inner">R / X / Z</kbd>
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
            className={`p-2 rounded-full transition-all duration-300 cursor-pointer border ${
              isPaletteOpen 
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
            className={`p-2 rounded-full transition-all duration-300 cursor-pointer border ${
              activeTool === 'select'
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
            className={`p-2 rounded-full transition-all duration-300 cursor-pointer border ${
              showHotkeys
                ? 'bg-blue-500/20 text-blue-400 border-blue-400/30'
                : 'hover:bg-white/5 text-white/60 hover:text-white border-transparent'
            }`}
            title="Toggle Controls Help"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
          </button>

        </div>
      </div>

    </div>
  );
}
