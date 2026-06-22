import { useState } from 'react';
import { useShipStore } from '../../store/shipStore';
import { BLOCK_DEFINITIONS, HULL_SHAPES } from '../../config/blocks';
import { Shape3DPreview } from '../Shape3DPreview';
import type { ActiveShapeId } from '../../utils/geometry';

interface BlockPaletteProps {
  isPaletteOpen: boolean;
  isDetailPanelOpen: boolean;
  setIsDetailPanelOpen: (open: boolean) => void;
  currentCategory: string;
  groupedBlocks: Record<string, typeof BLOCK_DEFINITIONS[string][]>;
}

const enabledShapesCount = HULL_SHAPES.filter(shape => !('disabled' in shape && shape.disabled)).length;

export function BlockPalette({
  isPaletteOpen,
  isDetailPanelOpen,
  setIsDetailPanelOpen,
  currentCategory,
  groupedBlocks,
}: BlockPaletteProps) {
  const activeTool = useShipStore(s => s.activeTool);
  const activeDef = BLOCK_DEFINITIONS[activeTool];
  const activeColor = activeDef?.color || '#909090';
  const setActiveTool = useShipStore(s => s.setActiveTool);
  const activeShape = useShipStore(s => s.activeShape);
  const setActiveShape = useShipStore(s => s.setActiveShape);
  const blocks = useShipStore(s => s.blocks);
  const setSelectedBlockId = useShipStore(s => s.setSelectedBlockId);

  // Hover states for 3D previews
  const [hoveredShapeId, setHoveredShapeId] = useState<string | null>(null);
  const [cardMousePos, setCardMousePos] = useState({ x: 0, y: 0 });

  const handleCardMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setCardMousePos({ x, y });
  };

  return (
    <div
      className={`absolute top-6 bottom-24 w-72 bg-black/60 backdrop-blur-xl p-5 rounded-2xl border border-white/10 flex flex-col gap-4 pointer-events-auto transition-all duration-300 ease-in-out select-none z-20 ${
        isPaletteOpen && isDetailPanelOpen
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
      {(currentCategory === 'Steel' || currentCategory === 'Titanium') && enabledShapesCount > 1 && (
        <div className="flex flex-col gap-2 border-b border-white/10 pb-3.5 flex-shrink-0">
          <span className="text-[10px] uppercase font-bold tracking-wider text-white/40">Select Hull Shape</span>
          <div className="grid grid-cols-5 gap-1.5">
            {HULL_SHAPES.map(shape => {
              if ('disabled' in shape && shape.disabled) return null;
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
                  className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 border border-white/5 cursor-pointer ${
                    isActive
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
                    isActive={isActive}
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
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left border ${
                isActive
                  ? 'bg-blue-500/10 border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.15)] scale-[1.02]'
                  : isPaletteDisabled
                  ? 'bg-white/1 opacity-30 border-white/5 cursor-not-allowed'
                  : 'bg-white/2 hover:bg-white/6 border-white/5 hover:border-white/10 hover:scale-[1.01] cursor-pointer'
              }`}
            >
              <div className="w-11 h-11 rounded-lg bg-black/40 border border-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                <Shape3DPreview
                  shapeId={(def.group === 'Steel' || def.group === 'Titanium' ? activeShape : 'full') as ActiveShapeId}
                  color={def.color}
                  disableRotation={true}
                  disableLive3D={true}
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
                <span className="text-[10px] text-white/40 mt-0.5">
                  {def.dimensions[0]} × {def.dimensions[2]} × {def.dimensions[1]} Units
                </span>
                {def.tags && def.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {def.tags.map(tag => (
                      <span
                        key={tag}
                        className={`text-[8px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wider flex-shrink-0 ${
                          tag === 'Size Incorrect'
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
  );
}
