import { useState, useCallback, useMemo } from 'react';
import { Scene } from './components/Scene';
import { UI } from './components/UI';
import { generateGrid } from './grid';
import type { GridState } from './types';

const GRID_RADIUS = 7;
const MAX_HEIGHT = 6;

export type Mode = 'build' | 'remove';

export function App() {
  const initialGrid = useMemo(() => generateGrid(GRID_RADIUS), []);
  const [grid, setGrid] = useState<GridState>(initialGrid);
  const [mode, setMode] = useState<Mode>('build');

  const handleCellTap = useCallback((id: string) => {
    setGrid((prev) => {
      const cell = prev.get(id);
      if (!cell) return prev;

      if (mode === 'build') {
        if (cell.height >= MAX_HEIGHT) return prev;
        const next = new Map(prev);
        next.set(id, { ...cell, height: cell.height + 1 });
        return next;
      } else {
        if (cell.height <= 0) return prev;
        const next = new Map(prev);
        next.set(id, { ...cell, height: cell.height - 1 });
        return next;
      }
    });
  }, [mode]);

  const handleClear = useCallback(() => {
    setGrid((prev) => {
      const next = new Map(prev);
      next.forEach((cell, id) => {
        next.set(id, { ...cell, height: 0 });
      });
      return next;
    });
  }, []);

  // Count total blocks
  let blockCount = 0;
  grid.forEach((cell) => { blockCount += cell.height; });

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Scene
        grid={grid}
        onCellTap={handleCellTap}
      />
      <UI
        blockCount={blockCount}
        mode={mode}
        onModeChange={setMode}
        onClear={handleClear}
      />
    </div>
  );
}
