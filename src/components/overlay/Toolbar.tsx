import { useState, useEffect } from 'react';
import { useShipStore } from '../../store/shipStore';
import { BLOCK_DEFINITIONS } from '../../config/blocks';
import { CloseIcon, GridIcon, CursorIcon, HelpIcon, SettingsIcon } from '../Icon';

interface ToolbarProps {
  isPaletteOpen: boolean;
  setIsPaletteOpen: (open: boolean) => void;
}

export function Toolbar({
  isPaletteOpen,
  setIsPaletteOpen,
}: ToolbarProps) {
  const activeTool = useShipStore(s => s.activeTool);
  const setActiveTool = useShipStore(s => s.setActiveTool);
  const setSelectedBlockId = useShipStore(s => s.setSelectedBlockId);
  
  // Settings & Background State
  const background = useShipStore(s => s.background);
  const setBackground = useShipStore(s => s.setBackground);
  const showDebugXYZ = useShipStore(s => s.showDebugXYZ);
  const setShowDebugXYZ = useShipStore(s => s.setShowDebugXYZ);
  
  // Performance State
  const potatoMode = useShipStore(s => s.potatoMode);
  const setPotatoMode = useShipStore(s => s.setPotatoMode);
  const suggestPotatoMode = useShipStore(s => s.suggestPotatoMode);
  const dismissPotatoSuggestion = useShipStore(s => s.dismissPotatoSuggestion);

  // Local popover states
  const [showHotkeys, setShowHotkeys] = useState<boolean>(() => {
    const saved = localStorage.getItem('spacecraft_show_hotkeys');
    return saved === null ? true : saved === 'true';
  });
  
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  useEffect(() => {
    localStorage.setItem('spacecraft_show_hotkeys', String(showHotkeys));
  }, [showHotkeys]);

  return (
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

      {/* Settings Popover */}
      {showSettingsMenu && (
        <div className="bg-black/90 backdrop-blur-2xl border border-white/10 p-5 rounded-2xl w-80 text-xs text-white flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-3 duration-300 select-none">
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <span className="font-bold text-blue-400 uppercase tracking-wider text-[10px]">Settings & Controls</span>
            <button
              onClick={() => setShowSettingsMenu(false)}
              className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white cursor-pointer"
              title="Close"
            >
              <CloseIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Background Scene Selector */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/50">Space Background</span>
            {potatoMode && (
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] leading-relaxed">
                <span>🥔 <strong>Potato Mode:</strong> Background is simplified.</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'nebula' as const, name: 'Nebula', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', dot: '#c084fc' },
                { id: 'orbit' as const, name: 'Earth Orbit', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', dot: '#60a5fa' },
                { id: 'hangar' as const, name: 'Sci-Fi Hangar', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', dot: '#fbbf24' },
                { id: 'atmosphere' as const, name: 'Sky Atmosphere', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30', dot: '#38bdf8' }
              ].map(bgItem => {
                const isSelected = background === bgItem.id;
                return (
                  <button
                    key={bgItem.id}
                    onClick={() => setBackground(bgItem.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-left cursor-pointer transition-all duration-200 text-[10px] ${
                      isSelected
                        ? `${bgItem.color} ring-1 ring-white/10 font-bold`
                        : 'bg-white/5 border-transparent hover:bg-white/10 text-white/80 hover:text-white'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: bgItem.dot }} />
                    <span className="truncate">{bgItem.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-white/10 pt-3 flex flex-col gap-2.5">
            {/* Potato Mode Toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-white/90">Potato Mode</span>
                <span className="text-[8px] text-white/40">Disable 3D previews & environments</span>
              </div>
              <button
                onClick={() => setPotatoMode(!potatoMode)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                  potatoMode
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-white/10 text-white/60 border-transparent hover:bg-white/15'
                }`}
              >
                {potatoMode ? 'Active' : 'Off'}
              </button>
            </div>

            {/* Debug XYZ Labels Toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-white/90">Coordinate Axis Labels</span>
                <span className="text-[8px] text-white/40">Show face XYZ axes</span>
              </div>
              <button
                onClick={() => setShowDebugXYZ(!showDebugXYZ)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                  showDebugXYZ
                    ? 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                    : 'bg-white/10 text-white/60 border-transparent hover:bg-white/15'
                }`}
              >
                {showDebugXYZ ? 'Visible' : 'Hidden'}
              </button>
            </div>
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
              <CloseIcon className="w-3.5 h-3.5" />
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
          className={`p-2 rounded-full transition-all duration-300 cursor-pointer border ${
            isPaletteOpen
              ? 'bg-blue-500/20 text-blue-400 border-blue-400/30'
              : 'hover:bg-white/5 text-white/60 hover:text-white border-transparent'
          }`}
          title="Toggle Block Palette"
        >
          <GridIcon className="w-4 h-4" />
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
          <CursorIcon className="w-4 h-4" />
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
                <CloseIcon className="w-3 h-3" />
              </button>
            </div>
          </>
        )}

        <div className="h-5 w-[1px] bg-white/10" />

        {/* Help / Hotkeys Toggle */}
        <button
          onClick={() => {
            setShowHotkeys(!showHotkeys);
            setShowSettingsMenu(false);
          }}
          className={`p-2 rounded-full transition-all duration-300 cursor-pointer border ${
            showHotkeys
              ? 'bg-blue-500/20 text-blue-400 border-blue-400/30'
              : 'hover:bg-white/5 text-white/60 hover:text-white border-transparent'
          }`}
          title="Toggle Controls Help"
        >
          <HelpIcon className="w-4 h-4" />
        </button>

        {/* Settings Toggle */}
        <button
          onClick={() => {
            setShowSettingsMenu(!showSettingsMenu);
            setShowHotkeys(false);
          }}
          className={`group p-2 rounded-full transition-all duration-300 cursor-pointer border ${
            showSettingsMenu
              ? 'bg-blue-500/20 text-blue-400 border-blue-400/30'
              : 'hover:bg-white/5 text-white/60 hover:text-white border-transparent'
          }`}
          title="Settings & Controls"
        >
          <SettingsIcon className="w-4.5 h-4.5 animate-[spin_10s_linear_infinite] group-hover:animate-[spin_2s_linear_infinite]" />
        </button>
      </div>
    </div>
  );
}
