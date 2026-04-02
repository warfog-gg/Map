import { useMemo } from 'react';
import * as THREE from 'three';
import type { GridState } from '../types';
import { buildLookupTable } from '../modules';
import { deformModule, computeVoxelConfig } from '../deform';

interface BuildingsProps {
  grid: GridState;
}

/**
 * Renders all building modules by:
 * 1. Computing 8-bit voxel config for each cell at each layer
 * 2. Looking up the canonical module from the lookup table
 * 3. Deforming it via bilinear interpolation to fit the irregular cell
 * 4. Batching all geometry by color for efficient rendering
 */
export function Buildings({ grid }: BuildingsProps) {
  const lookup = useMemo(() => buildLookupTable(), []);

  // Batch all module geometry by color
  const batches = useMemo(() => {
    const colorBatches = new Map<string, { positions: number[]; normals: number[] }>();

    grid.cells.forEach((cell) => {
      for (let layer = 0; layer < grid.layers; layer++) {
        const config = computeVoxelConfig(cell, layer, grid);
        if (config === 0) continue; // all empty

        const entry = lookup[config];
        if (!entry || entry.module.vertices.length === 0) continue;

        const { positions, normals } = deformModule(
          entry.module,
          entry,
          cell,
          layer,
          grid.vertices,
        );

        const color = entry.module.color;
        if (!colorBatches.has(color)) {
          colorBatches.set(color, { positions: [], normals: [] });
        }
        const batch = colorBatches.get(color)!;
        for (let i = 0; i < positions.length; i++) {
          batch.positions.push(positions[i]);
          batch.normals.push(normals[i]);
        }
      }
    });

    return colorBatches;
  }, [grid, lookup]);

  // Render each color batch as a single mesh
  const meshes = useMemo(() => {
    const result: { color: string; geometry: THREE.BufferGeometry }[] = [];

    batches.forEach((batch, color) => {
      if (batch.positions.length === 0) return;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(batch.positions), 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(batch.normals), 3));
      geo.computeBoundingSphere();
      result.push({ color, geometry: geo });
    });

    return result;
  }, [batches]);

  return (
    <group>
      {meshes.map((m, i) => (
        <mesh key={`${m.color}-${i}`} geometry={m.geometry} castShadow receiveShadow>
          <meshLambertMaterial color={m.color} />
        </mesh>
      ))}
    </group>
  );
}
