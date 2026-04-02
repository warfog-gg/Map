/** Shared vertex in the quad mesh */
export interface Vertex {
  id: number;
  x: number;
  z: number;
}

/** Quad cell on the grid */
export interface Cell {
  id: string;
  col: number;
  row: number;
  /** 4 vertex indices (corners) in winding order */
  corners: [number, number, number, number];
  /** Number of stacked blocks (0 = empty) */
  height: number;
}

/** Full grid state */
export interface GridState {
  cells: Map<string, Cell>;
  vertices: Vertex[];
}

/** Warcraft Human color palette */
export const PALETTE = {
  // Buildings
  stone:       '#8B8378',
  stoneDark:   '#6B6358',
  timber:      '#8B7355',
  timberDark:  '#6B5335',
  roofBlue:    '#2E4A7A',
  roofBlueLt:  '#3A5A8A',
  gold:        '#DAA520',
  goldBright:  '#FFD700',

  // Environment
  grass:       '#4A7A2E',
  grassDark:   '#3A6A1E',
  grassLight:  '#5A8A3E',
  dirt:        '#8B7355',
  water:       '#2E5A8A',
  waterDeep:   '#1E3A6A',
  waterShallow:'#4A8AB0',

  // Trees
  treeTrunk:   '#5C4033',
  treeLeaf:    '#2E5A1E',
  treeLeafLt:  '#3E7A2E',
  treePine:    '#1E4A2E',

  // Sky
  skyTop:      '#87CEEB',
  skyBottom:   '#B0E0FF',
  fog:         '#C8DFF0',
} as const;
