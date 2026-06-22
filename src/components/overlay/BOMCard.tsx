import { useState, useMemo } from 'react';
import { useShipStore, selectBOM } from '../../store/shipStore';
import { BLOCK_DEFINITIONS } from '../../config/blocks';
import { serializeBlocks } from '../../utils/serialization';
import { ChevronIcon, ExternalLinkIcon, ShareIcon } from '../Icon';

export function BOMCard() {
  const blocks = useShipStore(s => s.blocks);
  const clearShip = useShipStore(s => s.clearShip);
  const setToast = useShipStore(s => s.setToast);

  const [isBomCollapsed, setIsBomCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('spacecraft_sidebar_bom_collapsed') === 'true';
  });

  const bom = useMemo(() => selectBOM({ blocks }), [blocks]);
  const { smallSteelParts, smallTitaniumParts, titaniumParts, supportHardware } = bom;

  const toggleBom = () => {
    setIsBomCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('spacecraft_sidebar_bom_collapsed', String(next));
      return next;
    });
  };

  const showToast = (message: string) => {
    setToast(message);
  };

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
  const activeBomItemsCount = [smallSteelParts, smallTitaniumParts, titaniumParts, supportHardware].filter(v => v > 0).length;

  return (
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

        <ChevronIcon isOpen={!isBomCollapsed} className="w-3.5 h-3.5 text-white/40" />
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
              <ExternalLinkIcon className="w-4 h-4" />
              Export to Planner
            </a>
          ) : (
            <button
              disabled
              className="w-full py-2.5 bg-white/5 text-white/30 border border-white/5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <ExternalLinkIcon className="w-4 h-4 text-white/30" />
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
            <ShareIcon className="w-3.5 h-3.5" />
            Share Link
          </button>
          <button onClick={clearShip} className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-colors border border-red-500/20 cursor-pointer">
            Clear Ship
          </button>
        </div>
      </div>
    </div>
  );
}
