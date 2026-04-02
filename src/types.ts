/** Shared vertex in the quad mesh */
export interface Vertex {
  id: number;
  x: number;
  z: number;
}

/** Quad cell on the 2D grid */
export interface Cell {
  id: string;
  col: number;
  row: number;
  /** 4 vertex indices (corners) in CCW winding order when viewed from +Y */
  corners: [number, number, number, number];
}

/** Full grid state */
export interface GridState {
  cells: Map<string, Cell>;
  vertices: Vertex[];
  /** Number of vertical layers */
  layers: number;
  /**
   * Vertex solidity per layer.
   * voxelState[layer][vertexId] = true if solid.
   * layer 0 = ground level, layer N = topmost.
   */
  voxelState: boolean[][];
}

/**
 * A 3D voxel cell: one quad cell at one vertical layer.
 * Has 8 corners: 4 from the layer below, 4 from the layer above.
 * Each corner is solid or empty → 8-bit config (0-255).
 */
export interface VoxelCell {
  cellId: string;
  layer: number;
  /** 8-bit configuration: bits 0-3 = bottom corners, bits 4-7 = top corners (same winding) */
  config: number;
}

/**
 * A canonical module (atom) defined in unit cube space [0,1]^3.
 * Vertices use (u, v, w) where:
 *   u = along edge 0→1 (and 3→2)
 *   v = along edge 0→3 (and 1→2)
 *   w = vertical (0=bottom, 1=top of layer)
 */
export interface Module {
  name: string;
  /** Triangles: flat array of vertex indices into `vertices` */
  indices: number[];
  /** Vertices in canonical (u, v, w) space */
  vertices: [number, number, number][];
  /** Per-vertex colors (index into palette) */
  vertexColors?: string[];
  /** Uniform color for the whole module */
  color: string;
}

/** Warcraft Human color palette */
export const PALETTE = {
  // Buildings
  stone:       '#8B8378',
  stoneDark:   '#6B6358',
  stoneLight:  '#9B9388',
  timber:      '#8B7355',
  timberDark:  '#6B5335',
  roofBlue:    '#2E4A7A',
  roofBlueLt:  '#3A5A8A',
  roofBlueDk:  '#1E3A6A',
  gold:        '#DAA520',
  goldBright:  '#FFD700',
  plaster:     '#C8B898',
  plasterDark: '#A89878',

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
