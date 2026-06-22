import { useShipStore } from '../../store/shipStore';
import { CheckIcon } from '../Icon';

export function Toast() {
  const toast = useShipStore(s => s.toast);

  if (!toast) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto bg-black/85 backdrop-blur-md px-5 py-3 rounded-full border border-blue-500/30 text-white font-medium text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
      <CheckIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
      {toast}
    </div>
  );
}
