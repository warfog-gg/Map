import type { Cell, GridState, Vertex } from './types';

/**
 * Relaxed quad grid (Townscaper-style):
 * 1. Start with a regular grid of quads sharing vertices
 * 2. Apply Lloyd-like relaxation so quads become organic/irregular
 * 3. Each cell stores its 4 corner vertex indices
 */

const CELL_SPACING = 1.3;
const RELAX_ITERATIONS = 12;

/** Generate a relaxed quad grid */
export function generateGrid(radius: number): GridState {
  const vertices: Vertex[] = [];
  const cells: Cell[] = [];
  const vertexMap = new Map<string, number>(); // "col,row" -> vertex index

  // 1. Create vertex grid (one more than cells in each dimension)
  const size = radius * 2 + 1;
  for (let vy = 0; vy <= size; vy++) {
    for (let vx = 0; vx <= size; vx++) {
      const id = `v${vx},${vy}`;
      const idx = vertices.length;
      vertexMap.set(`${vx},${vy}`, idx);
      vertices.push({
        id: idx,
        x: (vx - radius) * CELL_SPACING - CELL_SPACING / 2,
        z: (vy - radius) * CELL_SPACING - CELL_SPACING / 2,
      });
    }
  }

  // 2. Create quad cells referencing 4 corner vertices
  for (let cy = 0; cy < size; cy++) {
    for (let cx = 0; cx < size; cx++) {
      // Distance from center (circular clip)
      const dx = cx - radius;
      const dy = cy - radius;
      if (Math.sqrt(dx * dx + dy * dy) > radius + 0.3) continue;

      const v0 = vertexMap.get(`${cx},${cy}`)!;
      const v1 = vertexMap.get(`${cx + 1},${cy}`)!;
      const v2 = vertexMap.get(`${cx + 1},${cy + 1}`)!;
      const v3 = vertexMap.get(`${cx},${cy + 1}`)!;

      cells.push({
        id: `${cx},${cy}`,
        col: cx,
        row: cy,
        corners: [v0, v1, v2, v3],
        height: 0,
      });
    }
  }

  // 3. Relax vertices (Lloyd-style: move each interior vertex toward
  //    the average of its neighboring cell centers)
  const vertexCells = buildVertexCellMap(vertices.length, cells);

  // Determine which vertices are on the outer boundary (skip relaxing those)
  const boundary = new Set<number>();
  for (let vy = 0; vy <= size; vy++) {
    boundary.add(vertexMap.get(`${0},${vy}`)!);
    boundary.add(vertexMap.get(`${size},${vy}`)!);
  }
  for (let vx = 0; vx <= size; vx++) {
    boundary.add(vertexMap.get(`${vx},${0}`)!);
    boundary.add(vertexMap.get(`${vx},${size}`)!);
  }

  // Seeded jitter before relaxation for organic initial state
  const rng = seededRandom(42);
  for (let i = 0; i < vertices.length; i++) {
    if (boundary.has(i)) continue;
    vertices[i].x += (rng() - 0.5) * CELL_SPACING * 0.45;
    vertices[i].z += (rng() - 0.5) * CELL_SPACING * 0.45;
  }

  // Iterative relaxation
  for (let iter = 0; iter < RELAX_ITERATIONS; iter++) {
    const newPos: { x: number; z: number }[] = vertices.map((v) => ({ x: v.x, z: v.z }));

    for (let vi = 0; vi < vertices.length; vi++) {
      if (boundary.has(vi)) continue;

      const adjCells = vertexCells[vi];
      if (adjCells.length === 0) continue;

      // Compute average of adjacent cell centers
      let ax = 0, az = 0;
      for (const ci of adjCells) {
        const c = cells[ci];
        const center = cellCenter(c, vertices);
        ax += center.x;
        az += center.z;
      }
      ax /= adjCells.length;
      az /= adjCells.length;

      // Move toward average (damped)
      const damping = 0.5;
      newPos[vi].x = vertices[vi].x + (ax - vertices[vi].x) * damping;
      newPos[vi].z = vertices[vi].z + (az - vertices[vi].z) * damping;
    }

    for (let vi = 0; vi < vertices.length; vi++) {
      vertices[vi].x = newPos[vi].x;
      vertices[vi].z = newPos[vi].z;
    }
  }

  const cellMap: GridState = {
    cells: new Map(cells.map((c) => [c.id, c])),
    vertices,
  };

  return cellMap;
}

/** Build map: vertex index -> list of cell indices that use it */
function buildVertexCellMap(vertexCount: number, cells: Cell[]): number[][] {
  const map: number[][] = Array.from({ length: vertexCount }, () => []);
  cells.forEach((cell, ci) => {
    for (const vi of cell.corners) {
      map[vi].push(ci);
    }
  });
  return map;
}

/** Compute center of a cell from its corner vertices */
export function cellCenter(cell: Cell, vertices: Vertex[]): { x: number; z: number } {
  let x = 0, z = 0;
  for (const vi of cell.corners) {
    x += vertices[vi].x;
    z += vertices[vi].z;
  }
  return { x: x / cell.corners.length, z: z / cell.corners.length };
}

/** Get world-space corners of a cell */
export function cellCorners(cell: Cell, vertices: Vertex[]): [number, number][] {
  return cell.corners.map((vi) => [vertices[vi].x, vertices[vi].z]);
}

/** Get neighbor cells (share an edge = share 2 vertices) */
export function getNeighbors(cell: Cell, allCells: Map<string, Cell>): Cell[] {
  const neighbors: Cell[] = [];
  const cornerSet = new Set(cell.corners);

  allCells.forEach((other) => {
    if (other.id === cell.id) return;
    let shared = 0;
    for (const vi of other.corners) {
      if (cornerSet.has(vi)) shared++;
    }
    if (shared >= 2) neighbors.push(other);
  });

  return neighbors;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export { CELL_SPACING };
