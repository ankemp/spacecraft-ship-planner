import { useState } from 'react';
import { useShipStore } from '../../store/shipStore';
import { BLOCK_DEFINITIONS, HULL_SHAPES } from '../../config/blocks';
import { Shape3DPreview } from '../Shape3DPreview';
import { RotateIcon, FlipIcon, CloseIcon, MoveIcon } from '../Icon';

const enabledShapesCount = HULL_SHAPES.filter(shape => !('disabled' in shape && shape.disabled)).length;

export function BlockInspector() {
  const blocks = useShipStore(s => s.blocks);
  const selectedBlockId = useShipStore(s => s.selectedBlockId);
  const setSelectedBlockId = useShipStore(s => s.setSelectedBlockId);
  const nudgeBlock = useShipStore(s => s.nudgeBlock);
  const rotateBlock = useShipStore(s => s.rotateBlock);
  const removeBlock = useShipStore(s => s.removeBlock);
  const startMoveBlock = useShipStore(s => s.startMoveBlock);
  const updateBlockColor = useShipStore(s => s.updateBlockColor);
  const updateBlockShape = useShipStore(s => s.updateBlockShape);
  const flipBlock = useShipStore(s => s.flipBlock);

  // Hover states for 3D previews
  const [hoveredModifyShapeId, setHoveredModifyShapeId] = useState<string | null>(null);
  const [cardMousePos, setCardMousePos] = useState({ x: 0, y: 0 });

  const handleCardMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setCardMousePos({ x, y });
  };

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);
  if (!selectedBlock) return null;

  const selectedBlockDef = BLOCK_DEFINITIONS[selectedBlock.type];
  const isSelectedHull = selectedBlockDef && (selectedBlockDef.group === 'Steel' || selectedBlockDef.group === 'Titanium');
  const selectedBlockColor = selectedBlock?.color || selectedBlockDef?.color || '#909090';
  const allowedRotations = selectedBlockDef?.allowedRotations || [];
  const allowedFlips = selectedBlockDef?.allowedFlips || [];

  return (
    <div className="bg-black/80 backdrop-blur-xl p-5 rounded-2xl border border-blue-500/30 flex flex-col gap-4 animate-in fade-in slide-in-from-right-5 duration-300">
      <div className="flex justify-between items-center border-b border-white/10 pb-2 flex-shrink-0">
        <div className="flex flex-col min-w-0 flex-1 select-none">
          <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400">
            BLOCK INSPECTOR
          </span>
          <span className="text-sm font-bold text-white truncate w-full">
            {selectedBlockDef?.name || selectedBlock.type}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedBlockId(null);
          }}
          className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white cursor-pointer flex-shrink-0"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col gap-4">
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
              {selectedBlock.rotation.map(r => Math.round((r * 180) / Math.PI)).join('°, ')}°
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => startMoveBlock(selectedBlock.id)}
            className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 hover:scale-102 cursor-pointer"
          >
            <MoveIcon className="w-3.5 h-3.5" />
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

          {allowedRotations.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-white/5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/50">Orientation</span>
              <div className="grid grid-cols-1 gap-1.5">
                {allowedRotations.includes('x') && (
                  <button
                    onClick={() => rotateBlock(selectedBlock.id, 'x')}
                    className="py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-semibold hover:scale-102 cursor-pointer flex items-center justify-center gap-1.5"
                    title="Rotate X (X Key)"
                  >
                    <RotateIcon className="w-3.5 h-3.5" />
                    <span className="font-mono font-bold text-[10px]">X</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Block Shape Selection (Only for Steel/Titanium if multiple shapes exist) */}
          {isSelectedHull && enabledShapesCount > 1 && (
            <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-white/5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/50">Modify Shape</span>
              <div className="grid grid-cols-5 gap-1.5">
                {HULL_SHAPES.map(shape => {
                  if ('disabled' in shape && shape.disabled) return null;
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
                      className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 border border-white/10 cursor-pointer ${
                        isActive
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

          {allowedFlips.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-white/5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/50">Flip Block</span>
              <div className="grid grid-cols-3 gap-1.5">
                {allowedFlips.includes('x') && (
                  <button
                    onClick={() => flipBlock(selectedBlock.id, 'x')}
                    className={`py-1.5 rounded-lg text-xs font-semibold hover:scale-102 cursor-pointer border transition-all duration-205 flex items-center justify-center gap-1.5 ${
                      selectedBlock.flipX
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 hover:bg-blue-500/30'
                        : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                    title="Flip X (X Key)"
                  >
                    <FlipIcon className="w-3.5 h-3.5" />
                    <span className="font-mono font-bold text-[10px]">X</span>
                  </button>
                )}
                {allowedFlips.includes('y') && (
                  <button
                    onClick={() => flipBlock(selectedBlock.id, 'y')}
                    className={`py-1.5 rounded-lg text-xs font-semibold hover:scale-102 cursor-pointer border transition-all duration-205 flex items-center justify-center gap-1.5 ${
                      selectedBlock.flipY
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 hover:bg-blue-500/30'
                        : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                    title="Flip Y (Y Key)"
                  >
                    <FlipIcon className="w-3.5 h-3.5 rotate-90" />
                    <span className="font-mono font-bold text-[10px]">Y</span>
                  </button>
                )}
                {allowedFlips.includes('z') && (
                  <button
                    onClick={() => flipBlock(selectedBlock.id, 'z')}
                    className={`py-1.5 rounded-lg text-xs font-semibold hover:scale-102 cursor-pointer border transition-all duration-205 flex items-center justify-center gap-1.5 ${
                      selectedBlock.flipZ
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 hover:bg-blue-500/30'
                        : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                    title="Flip Z (Z Key)"
                  >
                    <FlipIcon className="w-3.5 h-3.5 rotate-45" />
                    <span className="font-mono font-bold text-[10px]">Z</span>
                  </button>
                )}
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
  );
}
