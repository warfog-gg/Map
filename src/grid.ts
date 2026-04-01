import type { Cell, GridState } from './types';

const CELL_SIZE = 1.2;
const HEX_HEIGHT = CELL_SIZE * Math.sqrt(3);

/** Seeded random for deterministic jitter */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Generate a hex grid with organic jitter (Townscaper-style) */
export function generateGrid(radius: number): GridState {
  const grid: GridState = new Map();
  const rng = seededRandom(42);
  const jitter = CELL_SIZE * 0.18;

  for (let row = -radius; row <= radius; row++) {
    for (let col = -radius; col <= radius; col++) {
      // Hex distance filter for circular shape
      const hexDist = hexDistance(col, row);
      if (hexDist > radius) continue;

      // Hex to world position (offset coordinates)
      const xBase = col * CELL_SIZE * 1.5;
      const zBase = row * HEX_HEIGHT + (col % 2 !== 0 ? HEX_HEIGHT / 2 : 0);

      // Add organic jitter (less at edges)
      const edgeFactor = 1 - hexDist / (radius + 1);
      const jx = (rng() - 0.5) * jitter * 2 * edgeFactor;
      const jz = (rng() - 0.5) * jitter * 2 * edgeFactor;

      const id = `${col},${row}`;
      grid.set(id, {
        id,
        col,
        row,
        x: xBase + jx,
        z: zBase + jz,
        height: 0,
      });
    }
  }

  return grid;
}

function hexDistance(col: number, row: number): number {
  // Convert offset to cube coordinates
  const x = col;
  const z = row - (col - (col & 1)) / 2;
  const y = -x - z;
  return Math.max(Math.abs(x), Math.abs(y), Math.abs(z));
}

/** Get neighbor cell IDs for a given cell */
export function getNeighborIds(col: number, row: number): string[] {
  const isOdd = col & 1;
  const dirs = isOdd
    ? [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, 1], [1, 1]]
    : [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1]];
  return dirs.map(([dc, dr]) => `${col + dc},${row + dr}`);
}

/** Get the hex corners for rendering a cell */
export function getHexCorners(cx: number, cz: number, size = CELL_SIZE * 0.52): [number, number][] {
  const corners: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    corners.push([
      cx + size * Math.cos(angle),
      cz + size * Math.sin(angle),
    ]);
  }
  return corners;
}

export { CELL_SIZE, HEX_HEIGHT };
