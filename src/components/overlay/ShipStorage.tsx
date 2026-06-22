import { useState } from 'react';
import { useShipStore } from '../../store/shipStore';
import { serializeBlocks } from '../../utils/serialization';
import { ChevronIcon, CheckIcon, CloseIcon, EditIcon, TrashIcon, ShareIcon, PlusIcon } from '../Icon';

export function ShipStorage() {
  const blocks = useShipStore(s => s.blocks);
  const savedShips = useShipStore(s => s.savedShips);
  const saveCurrentShip = useShipStore(s => s.saveCurrentShip);
  const deleteSavedShip = useShipStore(s => s.deleteSavedShip);
  const renameSavedShip = useShipStore(s => s.renameSavedShip);
  const setBlocks = useShipStore(s => s.setBlocks);
  const setToast = useShipStore(s => s.setToast);

  const [isStorageCollapsed, setIsStorageCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('spacecraft_sidebar_storage_collapsed') === 'true';
  });

  const [shipNameInput, setShipNameInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingShipId, setEditingShipId] = useState<string | null>(null);
  const [editingShipName, setEditingShipName] = useState('');

  const toggleStorage = () => {
    setIsStorageCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('spacecraft_sidebar_storage_collapsed', String(next));
      return next;
    });
  };

  const showToast = (message: string) => {
    setToast(message);
  };

  const handleSaveCurrentShip = () => {
    if (shipNameInput.trim()) {
      saveCurrentShip(shipNameInput.trim());
      setShipNameInput('');
      setIsSaving(false);
      showToast('Ship blueprint saved!');
    }
  };

  const handleSaveRename = (id: string) => {
    if (editingShipName.trim()) {
      renameSavedShip(id, editingShipName.trim());
      setEditingShipId(null);
      showToast('Blueprint renamed.');
    }
  };

  return (
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

        <ChevronIcon isOpen={!isStorageCollapsed} className="w-3.5 h-3.5 text-white/40" />
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
                        <CheckIcon className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setEditingShipId(null)}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-md cursor-pointer"
                        title="Cancel"
                      >
                        <CloseIcon className="w-3 h-3" />
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
                          <EditIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            deleteSavedShip(ship.id);
                            showToast(`Deleted blueprint "${ship.name}"`);
                          }}
                          className="p-1 hover:bg-red-500/20 text-red-400/50 hover:text-red-400 rounded transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
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
                        <ShareIcon className="w-2.5 h-2.5" />
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
            <PlusIcon className="w-3.5 h-3.5 text-blue-400" />
            Save Current Ship
          </button>
        )}
      </div>
    </div>
  );
}
