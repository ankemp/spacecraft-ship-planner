import { useState, useRef, useMemo } from 'react';
import { useShipStore, selectDerivedStats } from '../../store/shipStore';
import { BLOCK_DEFINITIONS, STAT_METADATA } from '../../config/blocks';
import { StatIcon, GripIcon } from '../Icon';

const formatStatKey = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
};

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

export function SpecsCard() {
  const blocks = useShipStore(s => s.blocks);
  const potatoMode = useShipStore(s => s.potatoMode);

  const [isSpecsCollapsed, setIsSpecsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('spacecraft_sidebar_specs_collapsed') !== 'false';
  });

  const [customOrder, setCustomOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('spacecraft_shipbuilder_specs_order');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse custom specs order', e);
      return [];
    }
  });

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

  const [isBoostActive, setIsBoostActive] = useState<boolean>(false);

  // Derived computations
  const derivedStats = useMemo(
    () => selectDerivedStats({ blocks }, potatoMode),
    [blocks, potatoMode]
  );
  const shipStats = derivedStats.raw;
  const totalWeight = derivedStats.totalWeight;
  const totalForce = derivedStats.totalForce;

  const baseStatKeys = useMemo(() => {
    return Array.from(new Set([
      ...DISPLAY_STAT_KEYS,
      ...Object.keys(STAT_METADATA),
      ...Object.keys(shipStats)
    ]));
  }, [shipStats]);

  const allStatKeys = useMemo(() => {
    const keys = [...baseStatKeys];
    if (customOrder.length > 0) {
      keys.sort((a, b) => {
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
    return keys;
  }, [baseStatKeys, customOrder]);

  const otherStatKeys = useMemo(() => {
    return allStatKeys.filter(key => !EXPLICIT_KEYS.has(key));
  }, [allStatKeys]);

  // Drag and drop states & handlers
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

  const toggleSpecs = () => {
    setIsSpecsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('spacecraft_sidebar_specs_collapsed', String(next));
      return next;
    });
  };

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => {
      const next = { ...prev, [section]: !prev[section] };
      localStorage.setItem('spacecraft_sidebar_sections_collapsed', JSON.stringify(next));
      return next;
    });
  };

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

  return (
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
                      className={`group flex flex-col gap-1 p-2 rounded-lg transition-all duration-200 min-w-0 cursor-grab active:cursor-grabbing select-none relative ${
                        isDragging
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
  );
}
