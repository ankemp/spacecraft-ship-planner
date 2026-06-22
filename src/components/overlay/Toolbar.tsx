import { useState, useEffect } from 'react';
import { useShipStore } from '../../store/shipStore';
import { BLOCK_DEFINITIONS } from '../../config/blocks';
import { PotatoIcon } from '../Icon';

interface ToolbarProps {
  isPaletteOpen: boolean;
  setIsPaletteOpen: (open: boolean) => void;
}

export function Toolbar({ isPaletteOpen, setIsPaletteOpen }: ToolbarProps) {
  const activeTool = useShipStore(s => s.activeTool);
  const setActiveTool = useShipStore(s => s.setActiveTool);
  const setSelectedBlockId = useShipStore(s => s.setSelectedBlockId);
  const background = useShipStore(s => s.background);
  const setBackground = useShipStore(s => s.setBackground);
  const potatoMode = useShipStore(s => s.potatoMode);
  const setPotatoMode = useShipStore(s => s.setPotatoMode);
  const showDebugXYZ = useShipStore(s => s.showDebugXYZ);
  const setShowDebugXYZ = useShipStore(s => s.setShowDebugXYZ);
  const suggestPotatoMode = useShipStore(s => s.suggestPotatoMode);
  const dismissPotatoSuggestion = useShipStore(s => s.dismissPotatoSuggestion);

  const [showHotkeys, setShowHotkeys] = useState<boolean>(() => {
    const saved = localStorage.getItem('spacecraft_show_hotkeys');
    return saved === null ? true : saved === 'true';
  });

  const [showBackgroundMenu, setShowBackgroundMenu] = useState(false);

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

      {/* Background Selection Popover */}
      {showBackgroundMenu && (
        <div className="bg-black/90 backdrop-blur-2xl border border-white/10 p-4 rounded-2xl w-80 text-xs text-white flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300 select-none">
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <span className="font-bold text-blue-400 uppercase tracking-wider text-[10px]">Select Space Background</span>
            <button
              onClick={() => setShowBackgroundMenu(false)}
              className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white cursor-pointer"
              title="Close"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {potatoMode && (
            <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] leading-relaxed">
              <span>🥔 <strong>Potato Mode Active:</strong> Background details are simplified to flat colors to conserve GPU resources.</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-2">
            {[
              {
                id: 'nebula',
                name: 'Deep Space Nebula',
                desc: 'Starry purple-cyan cosmic cloud shader',
                color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
                dot: '#c084fc',
              },
              {
                id: 'orbit',
                name: 'Earth Orbit',
                desc: 'Orbital view of Earth with atmosphere & city lights',
                color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                dot: '#60a5fa',
              },
              {
                id: 'hangar',
                name: 'Sci-Fi Hangar',
                desc: 'Industrial construction bay with neon strip lighting',
                color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                dot: '#fbbf24',
              },
              {
                id: 'atmosphere',
                name: 'Sky Atmosphere',
                desc: 'Classic bright daytime sky',
                color: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
                dot: '#38bdf8',
              },
            ].map((bgItem) => {
              const isSelected = background === bgItem.id;
              return (
                <button
                  key={bgItem.id}
                  onClick={() => {
                    setBackground(bgItem.id as 'atmosphere' | 'nebula' | 'orbit' | 'hangar');
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? `${bgItem.color} ring-1 ring-white/10`
                      : 'bg-white/5 border-transparent hover:bg-white/10 text-white/80 hover:text-white'
                  }`}
                >
                  <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                    <span className="font-semibold text-xs flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: bgItem.dot }} />
                      {bgItem.name}
                    </span>
                    <span className="text-[10px] text-white/50 truncate">{bgItem.desc}</span>
                  </div>
                  {isSelected && (
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              );
            })}
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
          onClick={() => {
            setShowHotkeys(!showHotkeys);
            setShowBackgroundMenu(false);
          }}
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

        {/* Background Scene Selector */}
        <button
          onClick={() => {
            setShowBackgroundMenu(!showBackgroundMenu);
            setShowHotkeys(false);
          }}
          className={`p-2 rounded-full transition-all duration-300 cursor-pointer border ${
            showBackgroundMenu
              ? 'bg-purple-500/20 text-purple-400 border-purple-400/30'
              : 'hover:bg-white/5 text-white/60 hover:text-white border-transparent'
          }`}
          title="Choose Environment Background"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </button>

        {/* Potato Mode Toggle */}
        <button
          onClick={() => {
            setPotatoMode(!potatoMode);
          }}
          className={`p-2 rounded-full transition-all duration-300 cursor-pointer border ${
            potatoMode
              ? 'bg-amber-500/20 text-amber-400 border-amber-400/30'
              : 'hover:bg-white/5 text-white/60 hover:text-white border-transparent'
          }`}
          title={potatoMode ? "Disable Potato Mode (High Quality)" : "Enable Potato Mode (Low Spec)"}
        >
          <PotatoIcon />
        </button>

        {/* Debug w,h,d Toggle */}
        <button
          onClick={() => {
            setShowDebugXYZ(!showDebugXYZ);
          }}
          className={`p-2 rounded-full transition-all duration-300 cursor-pointer border ${
            showDebugXYZ
              ? 'bg-rose-500/20 text-rose-400 border-rose-400/30'
              : 'hover:bg-white/5 text-white/60 hover:text-white border-transparent'
          }`}
          title={showDebugXYZ ? "Hide w,h,d Debug Labels" : "Show w,h,d Debug Labels"}
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Y Axis (h) (Up - Green) */}
            <path d="M12 12V4.5m0 0L9.5 7M12 4.5L14.5 7" stroke={showDebugXYZ ? "#22c55e" : "currentColor"} />
            {/* X Axis (w) (Down-Right - Red) */}
            <path d="M12 12l6.5 4m0 0l-3.5.5m3.5-.5l-.5-3.5" stroke={showDebugXYZ ? "#ef4444" : "currentColor"} />
            {/* Z Axis (d) (Down-Left - Blue) */}
            <path d="M12 12l-6.5 4m0 0l.5-3.5m-.5 3.5l3.5-.5" stroke={showDebugXYZ ? "#3b82f6" : "currentColor"} />
          </svg>
        </button>
      </div>
    </div>
  );
}
