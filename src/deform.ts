import type { Vertex, Cell, GridState, Module, VoxelCell } from './types';
import type { ModuleEntry } from './modules';

const LAYER_HEIGHT = 1.0;

/**
 * Deform a canonical module (in unit cube space) to fit an irregular grid cell
 * at a given vertical layer, using bilinear interpolation for XZ and linear for Y.
 *
 * Canonical cube corners:
 *   Bottom: 0=(0,0,0) 1=(1,0,0) 2=(1,1,0) 3=(0,1,0)
 *   Top:    4=(0,0,1) 5=(1,0,1) 6=(1,1,1) 7=(0,1,1)
 *
 * Maps to world corners:
 *   Bottom: C0, C1, C2, C3 at y = layer * LAYER_HEIGHT
 *   Top:    C0, C1, C2, C3 at y = (layer+1) * LAYER_HEIGHT
 *
 * For each module vertex (u, v, w):
 *   XZ = bilinear interpolation of the 4 cell corners using (u, v)
 *   Y  = lerp(bottomY, topY, w)
 */
export function deformModule(
  module: Module,
  entry: ModuleEntry,
  cell: Cell,
  layer: number,
  vertices: Vertex[],
): { positions: Float32Array; normals: Float32Array } {
  const corners = cell.corners.map((vi) => vertices[vi]);
  // C0, C1, C2, C3 in cell winding order
  const c0 = corners[0], c1 = corners[1], c2 = corners[2], c3 = corners[3];

  const bottomY = layer * LAYER_HEIGHT;
  const topY = (layer + 1) * LAYER_HEIGHT;

  const rotation = entry.rotation;

  // Transform canonical vertices to world space
  const worldVerts: [number, number, number][] = module.vertices.map(([u, v, w]) => {
    // Apply rotation in UV plane (CCW 90° steps)
    let ru = u, rv = v;
    for (let r = 0; r < rotation; r++) {
      const tmp = ru;
      ru = rv;
      rv = 1 - tmp;
    }

    // Bilinear interpolation for XZ
    const x = (1 - ru) * (1 - rv) * c0.x + ru * (1 - rv) * c1.x + ru * rv * c2.x + (1 - ru) * rv * c3.x;
    const z = (1 - ru) * (1 - rv) * c0.z + ru * (1 - rv) * c1.z + ru * rv * c2.z + (1 - ru) * rv * c3.z;
    const y = bottomY + w * (topY - bottomY);

    return [x, y, z] as [number, number, number];
  });

  // Build position and normal arrays from index buffer
  const triCount = module.indices.length / 3;
  const positions = new Float32Array(module.indices.length * 3);
  const normals = new Float32Array(module.indices.length * 3);

  for (let t = 0; t < triCount; t++) {
    const i0 = module.indices[t * 3];
    const i1 = module.indices[t * 3 + 1];
    const i2 = module.indices[t * 3 + 2];

    const v0 = worldVerts[i0];
    const v1 = worldVerts[i1];
    const v2 = worldVerts[i2];

    // Compute face normal via cross product
    const ax = v1[0] - v0[0], ay = v1[1] - v0[1], az = v1[2] - v0[2];
    const bx = v2[0] - v0[0], by = v2[1] - v0[1], bz = v2[2] - v0[2];
    let nx = ay * bz - az * by;
    let ny = az * bx - ax * bz;
    let nz = ax * by - ay * bx;
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
    nx /= len; ny /= len; nz /= len;

    const base = t * 9;
    positions[base]     = v0[0]; positions[base + 1] = v0[1]; positions[base + 2] = v0[2];
    positions[base + 3] = v1[0]; positions[base + 4] = v1[1]; positions[base + 5] = v1[2];
    positions[base + 6] = v2[0]; positions[base + 7] = v2[1]; positions[base + 8] = v2[2];

    normals[base]     = nx; normals[base + 1] = ny; normals[base + 2] = nz;
    normals[base + 3] = nx; normals[base + 4] = ny; normals[base + 5] = nz;
    normals[base + 6] = nx; normals[base + 7] = ny; normals[base + 8] = nz;
  }

  return { positions, normals };
}

/**
 * Compute the 8-bit voxel configuration for a cell at a given layer.
 * Bits 0-3: bottom corners (layer), bits 4-7: top corners (layer+1).
 */
export function computeVoxelConfig(
  cell: Cell,
  layer: number,
  grid: GridState,
): number {
  let config = 0;
  const bottomLayer = grid.voxelState[layer];
  const topLayer = grid.voxelState[layer + 1];

  if (!bottomLayer || !topLayer) return 0;

  for (let i = 0; i < 4; i++) {
    const vi = cell.corners[i];
    if (bottomLayer[vi]) config |= (1 << i);
    if (topLayer[vi]) config |= (1 << (i + 4));
  }

  return config;
}

export { LAYER_HEIGHT };
