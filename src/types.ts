/** Hex cell on the grid */
export interface Cell {
  id: string;
  /** Grid coordinates */
  col: number;
  row: number;
  /** World position (with jitter for organic feel) */
  x: number;
  z: number;
  /** Number of stacked blocks (0 = empty) */
  height: number;
}

/** Grid state: map of cell id -> cell */
export type GridState = Map<string, Cell>;

/** Building block types auto-assigned by constraint system */
export type BlockPart =
  | 'foundation'   // ground level stone base
  | 'wall'         // middle floors timber frame
  | 'roof'         // blue slate peaked roof
  | 'tower_top'    // pointed tower cap
  | 'arch'         // archway between buildings
  | 'window';      // window detail

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
