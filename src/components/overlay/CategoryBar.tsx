import { CategoryIcon } from '../Icon';

interface CategoryBarProps {
  isPaletteOpen: boolean;
  groupNames: string[];
  currentCategory: string;
  setActiveCategory: (category: string) => void;
  isDetailPanelOpen: boolean;
  setIsDetailPanelOpen: (open: boolean) => void;
}

export function CategoryBar({
  isPaletteOpen,
  groupNames,
  currentCategory,
  setActiveCategory,
  isDetailPanelOpen,
  setIsDetailPanelOpen,
}: CategoryBarProps) {
  return (
    <div
      className={`absolute top-6 bottom-24 w-20 bg-black/60 backdrop-blur-xl py-4 px-2 rounded-2xl border border-white/10 flex flex-col items-center gap-3 pointer-events-auto transition-all duration-300 ease-in-out select-none z-30 ${
        isPaletteOpen ? 'left-6 opacity-100' : '-left-24 opacity-0 pointer-events-none'
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
              className={`w-16 h-18 py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200 border cursor-pointer ${
                isActive
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
  );
}
