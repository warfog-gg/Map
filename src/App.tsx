import { useState, useCallback, useMemo } from 'react';
import { Scene } from './components/Scene';
import { UI } from './components/UI';
import { generateGrid, findNearestVertex } from './grid';
import type { GridState } from './types';

const GRID_RADIUS = 7;

export type Mode = 'build' | 'remove';

export function App() {
  const initialGrid = useMemo(() => generateGrid(GRID_RADIUS), []);
  const [grid, setGrid] = useState<GridState>(initialGrid);
  const [mode, setMode] = useState<Mode>('build');

  /**
   * Handle tap on the ground plane.
   * Find nearest vertex, then toggle its solidity column:
   * - Build mode: fill the lowest empty layer at this vertex
   * - Remove mode: clear the highest filled layer at this vertex
   */
  const handleTap = useCallback((worldX: number, worldZ: number) => {
    setGrid((prev) => {
      const vi = findNearestVertex(prev.vertices, worldX, worldZ);
      const newState = prev.voxelState.map((layer) => [...layer]);

      if (mode === 'build') {
        // Find lowest empty layer and fill it
        for (let l = 0; l <= prev.layers; l++) {
          if (!newState[l][vi]) {
            newState[l][vi] = true;
            break;
          }
        }
      } else {
        // Find highest filled layer and clear it
        for (let l = prev.layers; l >= 0; l--) {
          if (newState[l][vi]) {
            newState[l][vi] = false;
            break;
          }
        }
      }

      return { ...prev, voxelState: newState };
    });
  }, [mode]);

  const handleClear = useCallback(() => {
    setGrid((prev) => ({
      ...prev,
      voxelState: prev.voxelState.map((layer) => layer.map(() => false)),
    }));
  }, []);

  // Count total solid vertices
  let solidCount = 0;
  grid.voxelState.forEach((layer) => {
    layer.forEach((v) => { if (v) solidCount++; });
  });

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Scene grid={grid} onTap={handleTap} />
      <UI blockCount={solidCount} mode={mode} onModeChange={setMode} onClear={handleClear} />
    </div>
  );
}
