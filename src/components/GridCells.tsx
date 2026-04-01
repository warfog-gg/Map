import { useCallback, useMemo } from 'react';
import * as THREE from 'three';
import type { GridState } from '../types';
import { PALETTE } from '../types';
import { getHexCorners, CELL_SIZE } from '../grid';

interface GridCellsProps {
  grid: GridState;
  onCellTap: (id: string) => void;
}

export function GridCells({ grid, onCellTap }: GridCellsProps) {
  const cells = useMemo(() => Array.from(grid.values()), [grid]);

  return (
    <group>
      {cells.map((cell) => (
        <HexCell
          key={cell.id}
          id={cell.id}
          x={cell.x}
          z={cell.z}
          height={cell.height}
          onCellTap={onCellTap}
        />
      ))}
    </group>
  );
}

interface HexCellProps {
  id: string;
  x: number;
  z: number;
  height: number;
  onCellTap: (id: string) => void;
}

function HexCell({ id, x, z, height, onCellTap }: HexCellProps) {
  const geometry = useMemo(() => {
    const corners = getHexCorners(0, 0, CELL_SIZE * 0.5);
    const shape = new THREE.Shape();
    shape.moveTo(corners[0][0], corners[0][1]);
    for (let i = 1; i < corners.length; i++) {
      shape.lineTo(corners[i][0], corners[i][1]);
    }
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, []);

  const handleClick = useCallback(
    (e: THREE.Event & { stopPropagation: () => void }) => {
      e.stopPropagation();
      onCellTap(id);
    },
    [id, onCellTap],
  );

  // Cell color varies with height
  const color = height === 0
    ? PALETTE.grassLight
    : PALETTE.dirt;

  const y = height > 0 ? height * 0.8 : 0;

  return (
    <group position={[x, y, z]}>
      {/* Clickable hex surface */}
      <mesh
        geometry={geometry}
        rotation-x={-Math.PI / 2}
        position={[0, 0.01, 0]}
        onClick={handleClick}
        receiveShadow
      >
        <meshLambertMaterial color={color} />
      </mesh>

      {/* Subtle hex border */}
      <lineLoop rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array(
                getHexCorners(0, 0, CELL_SIZE * 0.5)
                  .flatMap(([cx, cz]) => [cx, cz, 0])
              ),
              3,
            ]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#2A5A1A" transparent opacity={0.3} />
      </lineLoop>
    </group>
  );
}
