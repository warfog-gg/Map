import { useCallback, useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import type { GridState } from '../types';
import { PALETTE } from '../types';
import { cellCorners } from '../grid';

interface GridCellsProps {
  grid: GridState;
  onCellTap: (id: string) => void;
}

export function GridCells({ grid, onCellTap }: GridCellsProps) {
  const cells = useMemo(() => Array.from(grid.cells.values()), [grid]);

  return (
    <group>
      {cells.map((cell) => (
        <QuadCell
          key={cell.id}
          id={cell.id}
          corners={cellCorners(cell, grid.vertices)}
          height={cell.height}
          onCellTap={onCellTap}
        />
      ))}
    </group>
  );
}

interface QuadCellProps {
  id: string;
  corners: [number, number][];
  height: number;
  onCellTap: (id: string) => void;
}

function QuadCell({ id, corners, height, onCellTap }: QuadCellProps) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array([
      corners[0][0], 0, corners[0][1],
      corners[1][0], 0, corners[1][1],
      corners[2][0], 0, corners[2][1],
      corners[0][0], 0, corners[0][1],
      corners[2][0], 0, corners[2][1],
      corners[3][0], 0, corners[3][1],
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.computeVertexNormals();
    return geo;
  }, [corners]);

  const handleClick = useCallback(
    (e: THREE.Event & { stopPropagation: () => void }) => {
      e.stopPropagation();
      onCellTap(id);
    },
    [id, onCellTap],
  );

  const color = height === 0 ? PALETTE.grassLight : PALETTE.dirt;
  const y = height > 0 ? height * 0.8 : 0;

  return (
    <group position={[0, y, 0]}>
      <mesh
        geometry={geometry}
        position={[0, 0.01, 0]}
        onClick={handleClick}
        receiveShadow
      >
        <meshLambertMaterial color={color} />
      </mesh>

      <QuadBorder corners={corners} />
    </group>
  );
}

/** Use a LineLoop via primitive to avoid JSX <line> / SVG conflict */
function QuadBorder({ corners }: { corners: [number, number][] }) {
  const ref = useRef<THREE.LineLoop>(null);

  const lineObj = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pts = new Float32Array(corners.flatMap(([x, z]) => [x, 0.03, z]));
    geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    const mat = new THREE.LineBasicMaterial({ color: '#2A5A1A', transparent: true, opacity: 0.25 });
    return new THREE.LineLoop(geo, mat);
  }, [corners]);

  return <primitive ref={ref} object={lineObj} />;
}
