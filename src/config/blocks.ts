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
}

export const BLOCK_DEFINITIONS: Record<string, BlockDefinition> = {
  steel_4x3x2: {
    type: 'steel_4x3x2',
    name: 'Steel (4x3x2)',
    dimensions: [4, 3, 2],
    costs: { smallSteelParts: 2, supportHardware: 4 },
    color: '#888888',
    group: 'Steel',
    plannerPartName: 'hull_mk_1_001'
  },
  steel_4x3x1: {
    type: 'steel_4x3x1',
    name: 'Steel (4x3x1)',
    dimensions: [4, 3, 1],
    costs: { smallSteelParts: 2, supportHardware: 2 },
    color: '#a0a0a0',
    group: 'Steel',
    plannerPartName: 'hull_mk_1_004'
  },
  steel_6x3x2: {
    type: 'steel_6x3x2',
    name: 'Steel (6x3x2)',
    dimensions: [6, 3, 2],
    costs: { smallSteelParts: 3, supportHardware: 6 },
    color: '#777777',
    group: 'Steel',
    plannerPartName: 'hull_mk_1_002'
  },
  steel_6x3x1: {
    type: 'steel_6x3x1',
    name: 'Steel (6x3x1)',
    dimensions: [6, 3, 1],
    costs: { smallSteelParts: 3, supportHardware: 3 },
    color: '#909090',
    group: 'Steel',
    plannerPartName: 'hull_mk_1_005'
  },
  steel_8x3x2: {
    type: 'steel_8x3x2',
    name: 'Steel (8x3x2)',
    dimensions: [8, 3, 2],
    costs: { smallSteelParts: 4, supportHardware: 8 },
    color: '#666666',
    group: 'Steel',
    plannerPartName: 'hull_mk_1_003'
  },
  steel_8x3x1: {
    type: 'steel_8x3x1',
    name: 'Steel (8x3x1)',
    dimensions: [8, 3, 1],
    costs: { smallSteelParts: 4, supportHardware: 4 },
    color: '#808080',
    group: 'Steel',
    plannerPartName: 'hull_mk_1_006'
  },
  /*
  thruster_1x1x1: {
    type: 'thruster_1x1x1',
    name: 'Small Thruster',
    dimensions: [1, 1, 1],
    costs: { smallSteelParts: 2, supportHardware: 5 },
    color: '#ff5522',
    group: 'Systems',
    plannerPartName: 'thruster_mk_1'
  },
  */
  cockpit_2x2x2: {
    type: 'cockpit_2x2x2',
    name: 'Cockpit Module',
    dimensions: [2, 2, 2],
    costs: undefined,
    color: '#2288ff',
    group: 'Command',
    plannerPartName: ''
  }
};
