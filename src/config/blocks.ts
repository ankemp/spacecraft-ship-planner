export interface BlockDefinition {
  type: string;
  name: string;
  dimensions: [number, number, number]; // x, y, z grid size
  costs?: {
    smallSteelParts?: number;
    supportHardware?: number;
  };
  color: string;
  group: string;
  plannerPartName?: string;
  stats?: Record<string, number>;
}

export interface StatMetadata {
  name: string;
  unit?: string;
  color?: string;
  icon?: string;
}

export const STAT_METADATA: Record<string, StatMetadata> = {
  systemSupport: {
    name: 'System Support',
    unit: 'SP',
    color: 'text-blue-400',
    icon: 'circuit-board',
  },
  hull: {
    name: 'Hull Strength',
    unit: 'HP',
    color: 'text-gray-400',
    icon: 'shield',
  },
  weight: {
    name: 'Weight',
    unit: 't',
    color: 'text-green-400',
    icon: 'weight-hanging',
  },
  heatCapacity: {
    name: 'Heat Capacity',
    unit: 'MJ/K',
    color: 'text-red-400',
    icon: 'fire',
  },
  materialHeatConductivity: {
    name: 'Heat Interface',
    unit: 'W/aK',
    color: 'text-orange-400',
    icon: 'interface',
  },
};

export const BLOCK_DEFINITIONS: Record<string, BlockDefinition> = {
  steel_4x3x2: {
    type: 'steel_4x3x2',
    name: 'Steel (4x3x2)',
    dimensions: [4, 3, 2],
    costs: { smallSteelParts: 2, supportHardware: 4 },
    color: '#909090',
    group: 'Steel',
    plannerPartName: 'hull_mk_1_001',
    stats: { systemSupport: 240, frame: 36, weight: 30.0, hull: 15, heatCapacity: 30, materialHeatConductivity: 60 }
  },
  steel_4x3x1: {
    type: 'steel_4x3x1',
    name: 'Steel (4x3x1)',
    dimensions: [4, 3, 1],
    costs: { smallSteelParts: 2, supportHardware: 2 },
    color: '#909090',
    group: 'Steel',
    plannerPartName: 'hull_mk_1_004',
    stats: { systemSupport: 96, frame: 40, weight: 20.0, hull: 10, heatCapacity: 20, materialHeatConductivity: 60 }
  },
  steel_6x3x2: {
    type: 'steel_6x3x2',
    name: 'Steel (6x3x2)',
    dimensions: [6, 3, 2],
    costs: { smallSteelParts: 3, supportHardware: 6 },
    color: '#909090',
    group: 'Steel',
    plannerPartName: 'hull_mk_1_002',
    stats: { systemSupport: 360, frame: 0, weight: 0, hull: 0, heatCapacity: 45, materialHeatConductivity: 60 }
  },
  steel_6x3x1: {
    type: 'steel_6x3x1',
    name: 'Steel (6x3x1)',
    dimensions: [6, 3, 1],
    costs: { smallSteelParts: 3, supportHardware: 3 },
    color: '#909090',
    group: 'Steel',
    plannerPartName: 'hull_mk_1_005',
    stats: { systemSupport: 144, frame: 0, weight: 0, hull: 0, heatCapacity: 30, materialHeatConductivity: 60 }
  },
  steel_8x3x2: {
    type: 'steel_8x3x2',
    name: 'Steel (8x3x2)',
    dimensions: [8, 3, 2],
    costs: { smallSteelParts: 4, supportHardware: 8 },
    color: '#909090',
    group: 'Steel',
    plannerPartName: 'hull_mk_1_003',
    stats: { systemSupport: 480, frame: 0, weight: 0, hull: 0, heatCapacity: 60, materialHeatConductivity: 60 }
  },
  steel_8x3x1: {
    type: 'steel_8x3x1',
    name: 'Steel (8x3x1)',
    dimensions: [8, 3, 1],
    costs: { smallSteelParts: 4, supportHardware: 4 },
    color: '#909090',
    group: 'Steel',
    plannerPartName: 'hull_mk_1_006',
    stats: { systemSupport: 192, frame: 0, weight: 0, hull: 0, heatCapacity: 40, materialHeatConductivity: 60 }
  },
  /*
  thruster_1x1x1: {
    type: 'thruster_1x1x1',
    name: 'Small Thruster',
    dimensions: [1, 1, 1],
    costs: { smallSteelParts: 2, supportHardware: 5 },
    color: '#ff5522',
    group: 'Systems',
    plannerPartName: 'thruster_mk_1',
    stats: { heatCapacity: 0, materialHeatConductivity: 0 }
  },
  */
  cockpit_pathfinder: {
    type: 'cockpit_pathfinder',
    name: 'Pathfinder Cockpit',
    dimensions: [2, 2, 2],
    costs: undefined,
    color: '#2288ff',
    group: 'Cockpits',
    plannerPartName: 'cockpit_ae_1',
    stats: { systemSupport: 200, frame: 48, weight: 40, heatCapacity: 40, heatInterface: 60 }
  },
  cockpit_brick: {
    type: 'cockpit_brick',
    name: 'Brick Cockpit',
    dimensions: [2, 2, 2],
    costs: undefined,
    color: '#2288ff',
    group: 'Cockpits',
    plannerPartName: 'cockpit_tc_1',
    stats: { systemSupport: 200, frame: 20, weight: 40, heatInterface: 60 }
  },
  cockpit_beaver: {
    type: 'cockpit_beaver',
    name: 'Beaver Cockpit',
    dimensions: [2, 2, 2],
    costs: undefined,
    color: '#2288ff',
    group: 'Cockpits',
    plannerPartName: 'cockpit_mk_1',
    stats: { systemSupport: 100, frame: 48, weight: 40, heatCapacity: 40, heatInterface: 60, hullImpactDamage: -40 }
  },
  cockpit_cocoon: {
    type: 'cockpit_cocoon',
    name: 'Cocoon Cockpit',
    dimensions: [2, 2, 2],
    costs: undefined,
    color: '#2288ff',
    group: 'Cockpits',
    plannerPartName: 'cockpit_da_1',
    stats: { systemSupport: 100, frame: 48, weight: 40, heatCapacity: 40, heatInterface: 40, hullImpactDamage: -40, heatDissipation: 300, heatGeneration: 4000 }
  }
};
