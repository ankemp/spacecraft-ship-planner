import type { RequireExactlyOne } from 'type-fest';

type BlockMaterialCosts = {
  smallSteelParts?: number;
  smallTitaniumParts?: number;
  titaniumParts?: number;
};

type BlockCosts = {
  supportHardware: number;
} & RequireExactlyOne<BlockMaterialCosts>;

export interface BlockDefinition {
  type: string;
  name: string;
  dimensions: [number, number, number]; // x, y, z grid size
  costs?: BlockCosts;
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
    name: 'Material Heat Conductivity',
    unit: 'W/aK',
    color: 'text-orange-400',
    icon: 'interface',
  },
  systemRequirements: {
    name: 'System Requirements',
    unit: 'SP',
    color: 'text-purple-400',
    icon: 'circuit-board',
  },
  force: {
    name: 'Force',
    unit: 't',
    color: 'text-indigo-400',
    icon: 'force',
  },
  thrust: {
    name: 'Thrust',
    unit: 'kN',
    color: 'text-red-400',
    icon: 'thrust',
  },
  powerConsumption: {
    name: 'Power Consumption',
    unit: 'kW',
    color: 'text-yellow-400',
    icon: 'power',
  },
  steeringStrength: {
    name: 'Steering Strength',
    unit: 'kN',
    color: 'text-cyan-400',
    icon: 'steering',
  },
  boostThrust: {
    name: 'Boost Thrust',
    unit: 'kN',
    color: 'text-pink-400',
    icon: 'boost-thrust',
  },
  boostPowerConsumption: {
    name: 'Boost Power Consumption',
    unit: 'kW',
    color: 'text-yellow-300',
    icon: 'boost-power',
  },
  boostHeatGeneration: {
    name: 'Boost Heat Generation',
    unit: 'kW',
    color: 'text-orange-500',
    icon: 'boost-heat',
  },
};

export const BLOCK_GROUP_ORDER: string[] = [
  'Steel',
  'Titanium',
  'Cockpits',
  'Thrusters'
];

export const BLOCK_DEFINITIONS: Record<string, BlockDefinition> = {
  steel_4x3x2: {
    type: 'steel_4x3x2',
    name: 'Steel (4x3x2)',
    dimensions: [4, 2, 3],
    costs: { smallSteelParts: 2, supportHardware: 4 },
    color: '#909090',
    group: 'Steel',
    plannerPartName: 'hull_mk_1_001',
    stats: { systemSupport: 240, frame: 36, weight: 30.0, hull: 15, heatCapacity: 30, materialHeatConductivity: 60 }
  },
  steel_4x3x1: {
    type: 'steel_4x3x1',
    name: 'Steel (4x3x1)',
    dimensions: [4, 1, 3],
    costs: { smallSteelParts: 2, supportHardware: 2 },
    color: '#909090',
    group: 'Steel',
    plannerPartName: 'hull_mk_1_004',
    stats: { systemSupport: 96, frame: 40, weight: 20.0, hull: 10, heatCapacity: 20, materialHeatConductivity: 60 }
  },
  steel_6x3x2: {
    type: 'steel_6x3x2',
    name: 'Steel (6x3x2)',
    dimensions: [6, 2, 3],
    costs: { smallSteelParts: 3, supportHardware: 6 },
    color: '#909090',
    group: 'Steel',
    plannerPartName: 'hull_mk_1_002',
    stats: { systemSupport: 360, frame: 0, weight: 0, hull: 0, heatCapacity: 45, materialHeatConductivity: 60 }
  },
  steel_6x3x1: {
    type: 'steel_6x3x1',
    name: 'Steel (6x3x1)',
    dimensions: [6, 1, 3],
    costs: { smallSteelParts: 3, supportHardware: 3 },
    color: '#909090',
    group: 'Steel',
    plannerPartName: 'hull_mk_1_005',
    stats: { systemSupport: 144, frame: 0, weight: 0, hull: 0, heatCapacity: 30, materialHeatConductivity: 60 }
  },
  steel_8x3x2: {
    type: 'steel_8x3x2',
    name: 'Steel (8x3x2)',
    dimensions: [8, 2, 3],
    costs: { smallSteelParts: 4, supportHardware: 8 },
    color: '#909090',
    group: 'Steel',
    plannerPartName: 'hull_mk_1_003',
    stats: { systemSupport: 480, frame: 0, weight: 0, hull: 0, heatCapacity: 60, materialHeatConductivity: 60 }
  },
  steel_8x3x1: {
    type: 'steel_8x3x1',
    name: 'Steel (8x3x1)',
    dimensions: [8, 1, 3],
    costs: { smallSteelParts: 4, supportHardware: 4 },
    color: '#909090',
    group: 'Steel',
    plannerPartName: 'hull_mk_1_006',
    stats: { systemSupport: 192, frame: 0, weight: 0, hull: 0, heatCapacity: 40, materialHeatConductivity: 60 }
  },
  titanium_4x3x1: {
    type: 'titanium_4x3x1',
    name: 'Titanium (4x3x1)',
    dimensions: [4, 1, 3],
    costs: { smallTitaniumParts: 2, supportHardware: 2 },
    color: '#7a919e',
    group: 'Titanium',
    plannerPartName: 'hull_mk_1_004_tit',
    stats: { systemSupport: 96, frame: 40, weight: 16, hull: 10, heatCapacity: 22, materialHeatConductivity: 60 }
  },
  titanium_4x3x2: {
    type: 'titanium_4x3x2',
    name: 'Titanium (4x3x2)',
    dimensions: [4, 2, 3],
    costs: { smallTitaniumParts: 2, supportHardware: 4 },
    color: '#7a919e',
    group: 'Titanium',
    plannerPartName: 'hull_mk_1_001_tit',
    stats: { systemSupport: 240, frame: 36, weight: 24, hull: 15, heatCapacity: 33, materialHeatConductivity: 60 }
  },
  titanium_6x3x1: {
    type: 'titanium_6x3x1',
    name: 'Titanium (6x3x1)',
    dimensions: [6, 1, 3],
    costs: { smallTitaniumParts: 3, supportHardware: 3 },
    color: '#7a919e',
    group: 'Titanium',
    plannerPartName: 'hull_mk_1_005_tit',
    stats: { systemSupport: 144, frame: 60, weight: 24, hull: 15, heatCapacity: 33, materialHeatConductivity: 60 }
  },
  titanium_6x3x2: {
    type: 'titanium_6x3x2',
    name: 'Titanium (6x3x2)',
    dimensions: [6, 2, 3],
    costs: { smallTitaniumParts: 3, supportHardware: 6 },
    color: '#7a919e',
    group: 'Titanium',
    plannerPartName: 'hull_mk_1_002_tit',
    stats: { systemSupport: 360, frame: 54, weight: 36, hull: 22.5, heatCapacity: 49.5, materialHeatConductivity: 60 }
  },
  titanium_8x3x1: {
    type: 'titanium_8x3x1',
    name: 'Titanium (8x3x1)',
    dimensions: [8, 1, 3],
    costs: { smallTitaniumParts: 4, supportHardware: 4 },
    color: '#7a919e',
    group: 'Titanium',
    plannerPartName: 'hull_mk_1_006_tit',
    stats: { systemSupport: 192, frame: 80, weight: 32, hull: 20, heatCapacity: 44, materialHeatConductivity: 60 }
  },
  titanium_8x3x2: {
    type: 'titanium_8x3x2',
    name: 'Titanium (8x3x2)',
    dimensions: [8, 2, 3],
    costs: { smallTitaniumParts: 4, supportHardware: 8 },
    color: '#7a919e',
    group: 'Titanium',
    plannerPartName: 'hull_mk_1_003_tit',
    stats: { systemSupport: 480, frame: 72, weight: 48, hull: 30, heatCapacity: 66, materialHeatConductivity: 60 }
  },
  titanium_8x6x2: {
    type: 'titanium_8x6x2',
    name: 'Titanium (8x6x2)',
    dimensions: [8, 2, 6],
    costs: { titaniumParts: 4, supportHardware: 8 },
    color: '#7a919e',
    group: 'Titanium',
    plannerPartName: 'hull_mk_2_004_tit',
    stats: { systemSupport: 480, frame: 256, weight: 64, hull: 20, heatCapacity: 88, materialHeatConductivity: 60 }
  },
  titanium_12x6x2: {
    type: 'titanium_12x6x2',
    name: 'Titanium (12x6x2)',
    dimensions: [12, 2, 6],
    costs: { titaniumParts: 3, supportHardware: 12 },
    color: '#7a919e',
    group: 'Titanium',
    plannerPartName: 'hull_mk_2_005_tit',
    stats: { systemSupport: 720, frame: 384, weight: 96, hull: 30, heatCapacity: 132, materialHeatConductivity: 60 }
  },
  titanium_16x6x2: {
    type: 'titanium_16x6x2',
    name: 'Titanium (16x6x2)',
    dimensions: [16, 2, 6],
    costs: { titaniumParts: 4, supportHardware: 16 },
    color: '#7a919e',
    group: 'Titanium',
    plannerPartName: 'hull_mk_2_006_tit',
    stats: { systemSupport: 960, frame: 512, weight: 128, hull: 40, heatCapacity: 176, materialHeatConductivity: 60 }
  },
  thruster_cart_pusher: {
    type: 'thruster_cart_pusher',
    name: 'Cart Pusher',
    dimensions: [4, 3, 1],
    color: '#d35400',
    group: 'Thrusters',
    stats: {
      weight: 20,
      systemRequirements: 300,
      materialHeatConductivity: 60,
      force: 300,
      thrust: 50,
      powerConsumption: 35,
      steeringStrength: 8,
      boostThrust: 100,
      boostPowerConsumption: 100,
      boostHeatGeneration: 1000
    }
  },
  // thruster_quiet_breeze: {
  //   type: 'thruster_quiet_breeze',
  //   name: 'Quiet Breeze',
  //   dimensions: [1, 1, 1],
  //   color: '#d35400',
  //   group: 'Thrusters',
  //   stats: {
  //     weight: 20,
  //     systemRequirements: 1000,
  //     heatInterface: 0, // TODO
  //     materialHeatConductivity: 60,
  //     force: 700,
  //     thrust: 60,
  //     powerConsumption: 15,
  //     steeringStrength: 15,
  //   }
  // },
  // thruster_voidseeker: {
  //   type: 'thruster_voidseeker',
  //   name: 'Voidseeker',
  //   dimensions: [1, 1, 1],
  //   color: '#d35400',
  //   group: 'Thrusters',
  //   stats: {
  //     weight: 20,
  //     systemRequirements: 450,
  //     materialHeatConductivity: 40,
  //     force: 600,
  //     thrust: 50,
  //     powerConsumption: 70,
  //     steeringStrength: 20,
  //     boostThrust: 80,
  //     boostPowerConsumption: 80,
  //     boostHeatGeneration: 800
  //   }
  // },
  // thruster_grasshopper: {
  //   type: 'thruster_grasshopper',
  //   name: 'Grasshopper',
  //   dimensions: [1, 1, 1],
  //   color: '#d35400',
  //   group: 'Thrusters',
  //   stats: {
  //     weight: 20,
  //     systemRequirements: 600,
  //     materialHeatConductivity: 120,
  //     force: 600,
  //     thrust: 100,
  //     powerConsumption: 80,
  //     steeringStrength: 15,
  //     boostThrust: 150,
  //     boostPowerConsumption: 150,
  //     heatDissipation: 50
  //   }
  // },
  // thruster_silent: {
  //   type: 'thruster_silent',
  //   name: 'Silent Thruster',
  //   dimensions: [1, 1, 1],
  //   color: '#d35400',
  //   group: 'Thrusters',
  //   stats: {
  //     weight: 20,
  //     systemRequirements: 1100,
  //     materialHeatConductivity: 0, // TODO
  //     force: 1250,
  //     thrust: 150,
  //     powerConsumption: 80,
  //     steeringStrength: 30,
  //     boostThrust: 200,
  //     boostPowerConsumption: 150,
  //     boostHeatGeneration: 500
  //   }
  // },
  cockpit_pathfinder: {
    type: 'cockpit_pathfinder',
    name: 'Pathfinder Cockpit',
    dimensions: [3, 2, 3],
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
