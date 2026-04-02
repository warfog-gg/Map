import type { Module } from './types';
import { PALETTE } from './types';

/**
 * Canonical modules (atoms) defined in unit cube space.
 *
 * Cube corners layout:
 *   Bottom (w=0):  0=(0,0,0) 1=(1,0,0) 2=(1,1,0) 3=(0,1,0)
 *   Top    (w=1):  4=(0,0,1) 5=(1,0,1) 6=(1,1,1) 7=(0,1,1)
 *
 * Config bits: bit i = corner i is solid.
 *   bits 0-3 = bottom corners, bits 4-7 = top corners.
 *
 * Modules are authored so normals face outward (CCW winding from outside).
 */

// ── Helper: build a quad face from 4 vertices (CCW order for outward normal) ──
function quad(a: number, b: number, c: number, d: number): number[] {
  return [a, b, c, a, c, d];
}

// ── Module: Solid full block (all 8 corners filled) ──
// Config: 0xFF (255). Floor/ceiling slab. Used between stacked blocks.
const fullBlock: Module = {
  name: 'full_block',
  color: PALETTE.stone,
  vertices: [
    // Bottom face (w=0)
    [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
    // Top face (w=1)
    [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1],
  ],
  indices: [
    // Top face (outward = +w): CCW from above
    ...quad(4, 5, 6, 7),
    // Bottom face (outward = -w): CCW from below
    ...quad(3, 2, 1, 0),
    // Front face (v=0, outward = -v)
    ...quad(0, 1, 5, 4),
    // Back face (v=1, outward = +v)
    ...quad(2, 3, 7, 6),
    // Left face (u=0, outward = -u)
    ...quad(3, 0, 4, 7),
    // Right face (u=1, outward = +u)
    ...quad(1, 2, 6, 5),
  ],
};

// ── Module: Wall (bottom full, top empty) ──
// Config: 0x0F (15). All bottom corners solid, all top empty → roof/cap.
const M = 0.04; // small margin so walls don't z-fight
const WALL_H = 0.95; // wall height (slightly less than full block)
const wallCap: Module = {
  name: 'wall_cap',
  color: PALETTE.stone,
  vertices: [
    // Bottom (w=0)
    [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
    // Top (at WALL_H)
    [M, M, WALL_H], [1 - M, M, WALL_H], [1 - M, 1 - M, WALL_H], [M, 1 - M, WALL_H],
  ],
  indices: [
    ...quad(4, 5, 6, 7),  // Top
    ...quad(3, 2, 1, 0),  // Bottom
    ...quad(0, 1, 5, 4),  // Front
    ...quad(2, 3, 7, 6),  // Back
    ...quad(3, 0, 4, 7),  // Left
    ...quad(1, 2, 6, 5),  // Right
  ],
};

// ── Module: Wall segment (2 bottom corners filled on one edge) ──
// For edge along u-axis (corners 0,1 filled): half-wall
function makeWall(h: number, color: string): Module {
  const d = 0.35; // wall depth (in v direction)
  return {
    name: 'wall_segment',
    color,
    vertices: [
      // Bottom
      [0, 0, 0], [1, 0, 0], [1, d, 0], [0, d, 0],
      // Top
      [0, 0, h], [1, 0, h], [1, d, h], [0, d, h],
    ],
    indices: [
      ...quad(4, 5, 6, 7),  // Top
      ...quad(3, 2, 1, 0),  // Bottom
      ...quad(0, 1, 5, 4),  // Front (outer face)
      ...quad(2, 3, 7, 6),  // Back (inner face)
      ...quad(3, 0, 4, 7),  // Left
      ...quad(1, 2, 6, 5),  // Right
    ],
  };
}

// ── Module: Corner pillar (1 bottom corner filled) ──
function makePillar(h: number, color: string): Module {
  const s = 0.3;
  return {
    name: 'pillar',
    color,
    vertices: [
      [0, 0, 0], [s, 0, 0], [s, s, 0], [0, s, 0],
      [0, 0, h], [s, 0, h], [s, s, h], [0, s, h],
    ],
    indices: [
      ...quad(4, 5, 6, 7),
      ...quad(3, 2, 1, 0),
      ...quad(0, 1, 5, 4),
      ...quad(2, 3, 7, 6),
      ...quad(3, 0, 4, 7),
      ...quad(1, 2, 6, 5),
    ],
  };
}

// ── Module: Roof (peaked) ──
// Full bottom, empty top → pyramid roof
const roofPeaked: Module = {
  name: 'roof_peaked',
  color: PALETTE.roofBlue,
  vertices: [
    // Bottom (w=0) — roof base
    [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
    // Peak (center top)
    [0.5, 0.5, 0.6],
  ],
  indices: [
    // Bottom face
    ...quad(3, 2, 1, 0),
    // 4 triangular roof faces (CCW from outside)
    0, 1, 4,  // front
    1, 2, 4,  // right
    2, 3, 4,  // back
    3, 0, 4,  // left
  ],
};

// ── Module: Half-roof (2 bottom + 2 top on one side) ──
// Ridge along one edge
const roofHalf: Module = {
  name: 'roof_half',
  color: PALETTE.roofBlue,
  vertices: [
    // Bottom
    [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
    // Top edge (v=0 side raised)
    [0, 0, 0.5], [1, 0, 0.5],
  ],
  indices: [
    // Bottom
    ...quad(3, 2, 1, 0),
    // Front slope (v=0 side)
    // — this is the raised edge, it's a flat quad
    // Back slope (triangles from ridge to back edge)
    0, 1, 5,
    0, 5, 4,
    // Slope face
    4, 5, 2, 4, 2, 3,
    // Left triangle
    3, 0, 4,
    // Right triangle
    1, 2, 5,
  ],
};

// ── Module: Floor slab (thin platform) ──
const floorSlab: Module = {
  name: 'floor_slab',
  color: PALETTE.stoneDark,
  vertices: [
    [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
    [0, 0, 0.1], [1, 0, 0.1], [1, 1, 0.1], [0, 1, 0.1],
  ],
  indices: [
    ...quad(4, 5, 6, 7),
    ...quad(3, 2, 1, 0),
    ...quad(0, 1, 5, 4),
    ...quad(2, 3, 7, 6),
    ...quad(3, 0, 4, 7),
    ...quad(1, 2, 6, 5),
  ],
};

// ── Module: Empty (nothing to render) ──
const empty: Module = {
  name: 'empty',
  color: '#000000',
  vertices: [],
  indices: [],
};

// ══════════════════════════════════════════════════════════════
// LOOKUP TABLE: 8-bit config → Module + rotation
// ══════════════════════════════════════════════════════════════

export interface ModuleEntry {
  module: Module;
  /** Number of 90° CCW rotations to apply in the UV plane */
  rotation: number;
}

/**
 * Count set bits in an 8-bit number.
 */
function popcount(n: number): number {
  let c = 0;
  while (n) { c += n & 1; n >>= 1; }
  return c;
}

/**
 * Rotate a config's bits by r*90° CCW in the UV plane.
 * Bottom corners 0→1→2→3 rotate, top corners 4→5→6→7 rotate the same way.
 */
function rotateConfig(config: number, r: number): number {
  let c = config;
  for (let i = 0; i < r; i++) {
    const b0 = c & 1, b1 = (c >> 1) & 1, b2 = (c >> 2) & 1, b3 = (c >> 3) & 1;
    const t0 = (c >> 4) & 1, t1 = (c >> 5) & 1, t2 = (c >> 6) & 1, t3 = (c >> 7) & 1;
    // CCW rotation: 0←1, 1←2, 2←3, 3←0
    c = (b1 | (b2 << 1) | (b3 << 2) | (b0 << 3))
      | ((t1 << 4) | (t2 << 5) | (t3 << 6) | (t0 << 7));
  }
  return c;
}

/**
 * Build the full 256-entry lookup table.
 * We define base cases and fill rotations automatically.
 */
export function buildLookupTable(): ModuleEntry[] {
  const table: (ModuleEntry | null)[] = new Array(256).fill(null);

  // Helper: register a module for a config and all its rotations
  function register(config: number, mod: Module) {
    for (let r = 0; r < 4; r++) {
      const rc = rotateConfig(config, r);
      if (!table[rc]) {
        table[rc] = { module: mod, rotation: r };
      }
    }
  }

  // ── Config 0b00000000 (0): all empty → nothing ──
  table[0] = { module: empty, rotation: 0 };

  // ── Config 0b11111111 (255): all solid → full block ──
  table[255] = { module: fullBlock, rotation: 0 };

  // ── All bottom solid, all top empty (0x0F = 15): roof ──
  table[0x0F] = { module: roofPeaked, rotation: 0 };

  // ── All bottom solid, all top solid = 255 already covered ──

  // ── Bottom full + some top corners ──
  // 4 bottom + 2 adjacent top (e.g. 0,1 bottom all + top 0,1): wall+roof slope
  register(0b00110000 | 0x0F, roofHalf); // top corners 4,5 filled → slope from front

  // 4 bottom + 1 top corner: mostly roof with one raised corner
  register(0b00010000 | 0x0F, roofPeaked); // close enough: peaked roof

  // 4 bottom + 3 top: almost full block, one corner missing → use full block (visual simplification)
  register(0b01110000 | 0x0F, fullBlock);

  // ── 2 adjacent bottom corners (wall base) ──
  register(0b00000011, makeWall(0.9, PALETTE.stone));      // corners 0,1
  register(0b00110011, makeWall(1.0, PALETTE.stone));       // corners 0,1 bottom + 0,1 top (wall going up)

  // ── 1 bottom corner (pillar) ──
  register(0b00000001, makePillar(0.9, PALETTE.stoneDark)); // corner 0 only
  register(0b00010001, makePillar(1.0, PALETTE.stoneDark)); // corner 0 bottom + top

  // ── 3 bottom corners (L-shape wall) ──
  register(0b00000111, makeWall(0.9, PALETTE.timber));      // corners 0,1,2
  register(0b01110111, fullBlock);                           // 3 bottom + 3 top → near-full

  // ── Opposite corners (diagonal) ──
  register(0b00000101, makePillar(0.9, PALETTE.stone));     // corners 0,2 (opposite) → two pillars approx
  register(0b00001010, makePillar(0.9, PALETTE.stone));     // corners 1,3

  // ── Top-only configs (floating — show thin floor slab) ──
  register(0b11110000, floorSlab); // all 4 top, no bottom

  // ── Fill remaining with heuristic based on popcount ──
  for (let cfg = 0; cfg < 256; cfg++) {
    if (table[cfg]) continue;
    const pop = popcount(cfg);
    const bottomPop = popcount(cfg & 0x0F);
    const topPop = popcount(cfg & 0xF0);

    if (pop === 0) {
      table[cfg] = { module: empty, rotation: 0 };
    } else if (pop >= 6) {
      table[cfg] = { module: fullBlock, rotation: 0 };
    } else if (bottomPop >= 3 && topPop === 0) {
      table[cfg] = { module: roofPeaked, rotation: 0 };
    } else if (bottomPop >= 2) {
      table[cfg] = { module: wallCap, rotation: 0 };
    } else {
      table[cfg] = { module: makePillar(0.9, PALETTE.stoneDark), rotation: 0 };
    }
  }

  return table as ModuleEntry[];
}
