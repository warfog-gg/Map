import type { Cell, Vertex, GridState } from './types';

const CELL_SPACING = 1.3;
const RELAX_ITERATIONS = 12;
const MAX_LAYERS = 6;

/** Generate a relaxed quad grid with vertex-based voxel state */
export function generateGrid(radius: number): GridState {
  const vertices: Vertex[] = [];
  const cells: Cell[] = [];
  const vertexMap = new Map<string, number>();

  const size = radius * 2 + 1;

  // 1. Create vertex grid
  for (let vy = 0; vy <= size; vy++) {
    for (let vx = 0; vx <= size; vx++) {
      const idx = vertices.length;
      vertexMap.set(`${vx},${vy}`, idx);
      vertices.push({
        id: idx,
        x: (vx - radius) * CELL_SPACING - CELL_SPACING / 2,
        z: (vy - radius) * CELL_SPACING - CELL_SPACING / 2,
      });
    }
  }

  // 2. Create quad cells
  for (let cy = 0; cy < size; cy++) {
    for (let cx = 0; cx < size; cx++) {
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
      });
    }
  }

  // 3. Jitter + relaxation
  const boundary = new Set<number>();
  for (let vy = 0; vy <= size; vy++) {
    boundary.add(vertexMap.get(`${0},${vy}`)!);
    boundary.add(vertexMap.get(`${size},${vy}`)!);
  }
  for (let vx = 0; vx <= size; vx++) {
    boundary.add(vertexMap.get(`${vx},${0}`)!);
    boundary.add(vertexMap.get(`${vx},${size}`)!);
  }

  const rng = seededRandom(42);
  for (let i = 0; i < vertices.length; i++) {
    if (boundary.has(i)) continue;
    vertices[i].x += (rng() - 0.5) * CELL_SPACING * 0.45;
    vertices[i].z += (rng() - 0.5) * CELL_SPACING * 0.45;
  }

  const vertexCells = buildVertexCellMap(vertices.length, cells);

  for (let iter = 0; iter < RELAX_ITERATIONS; iter++) {
    const newPos = vertices.map((v) => ({ x: v.x, z: v.z }));
    for (let vi = 0; vi < vertices.length; vi++) {
      if (boundary.has(vi)) continue;
      const adjCells = vertexCells[vi];
      if (adjCells.length === 0) continue;
      let ax = 0, az = 0;
      for (const ci of adjCells) {
        const c = cells[ci];
        const ctr = cellCenterFromVerts(c, vertices);
        ax += ctr.x; az += ctr.z;
      }
      ax /= adjCells.length; az /= adjCells.length;
      newPos[vi].x = vertices[vi].x + (ax - vertices[vi].x) * 0.5;
      newPos[vi].z = vertices[vi].z + (az - vertices[vi].z) * 0.5;
    }
    for (let vi = 0; vi < vertices.length; vi++) {
      vertices[vi].x = newPos[vi].x;
      vertices[vi].z = newPos[vi].z;
    }
  }

  // 4. Ensure CCW winding for all cells
  for (const cell of cells) {
    const c = cell.corners;
    const v0 = vertices[c[0]], v1 = vertices[c[1]], v3 = vertices[c[3]];
    const cross = (v1.x - v0.x) * (v3.z - v0.z) - (v1.z - v0.z) * (v3.x - v0.x);
    if (cross < 0) {
      // Reverse winding: swap 1 and 3
      const tmp = c[1]; c[1] = c[3]; c[3] = tmp;
    }
  }

  // 5. Initialize empty voxel state (MAX_LAYERS+1 boundary layers × vertex count)
  const layers = MAX_LAYERS;
  const voxelState: boolean[][] = [];
  for (let l = 0; l <= layers; l++) {
    voxelState.push(new Array(vertices.length).fill(false));
  }

  return {
    cells: new Map(cells.map((c) => [c.id, c])),
    vertices,
    layers,
    voxelState,
  };
}

function buildVertexCellMap(vertexCount: number, cells: Cell[]): number[][] {
  const map: number[][] = Array.from({ length: vertexCount }, () => []);
  cells.forEach((cell, ci) => {
    for (const vi of cell.corners) map[vi].push(ci);
  });
  return map;
}

function cellCenterFromVerts(cell: Cell, vertices: Vertex[]): { x: number; z: number } {
  let x = 0, z = 0;
  for (const vi of cell.corners) { x += vertices[vi].x; z += vertices[vi].z; }
  return { x: x / 4, z: z / 4 };
}

/** Get world-space center of a cell */
export function cellCenter(cell: Cell, vertices: Vertex[]): { x: number; z: number } {
  return cellCenterFromVerts(cell, vertices);
}

/** Find the nearest vertex to a world XZ point */
export function findNearestVertex(vertices: Vertex[], wx: number, wz: number): number {
  let best = 0, bestDist = Infinity;
  for (let i = 0; i < vertices.length; i++) {
    const d = (vertices[i].x - wx) ** 2 + (vertices[i].z - wz) ** 2;
    if (d < bestDist) { bestDist = d; best = i; }
  }
  return best;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

export { CELL_SPACING, MAX_LAYERS };
