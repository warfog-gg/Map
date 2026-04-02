import { useCallback, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import type { GridState } from '../types';
import { PALETTE } from '../types';
import { cellCorners, cellCenter } from '../grid';

interface GridCellsProps {
  grid: GridState;
  onCellTap: (id: string) => void;
}

export function GridCells({ grid, onCellTap }: GridCellsProps) {
  const cells = useMemo(() => Array.from(grid.cells.values()), [grid]);

  // Precompute cell centers for hit detection
  const cellCenters = useMemo(() => {
    const centers: { id: string; x: number; z: number; y: number }[] = [];
    grid.cells.forEach((cell) => {
      const c = cellCenter(cell, grid.vertices);
      centers.push({ id: cell.id, x: c.x, z: c.z, y: cell.height * 0.8 });
    });
    return centers;
  }, [grid]);

  return (
    <group>
      {/* Invisible click plane covering the entire grid area */}
      <ClickPlane cellCenters={cellCenters} onCellTap={onCellTap} />

      {/* Visual quad cells */}
      {cells.map((cell) => (
        <QuadCellVisual
          key={cell.id}
          corners={cellCorners(cell, grid.vertices)}
          height={cell.height}
        />
      ))}
    </group>
  );
}

/** Large invisible plane that catches all taps and finds nearest cell */
function ClickPlane({
  cellCenters,
  onCellTap,
}: {
  cellCenters: { id: string; x: number; z: number; y: number }[];
  onCellTap: (id: string) => void;
}) {
  const pointerDown = useRef<{ x: number; y: number; time: number } | null>(null);

  const handlePointerDown = useCallback((e: THREE.Event & { stopPropagation: () => void; clientX?: number; clientY?: number; nativeEvent?: PointerEvent }) => {
    const ne = (e as any).nativeEvent as PointerEvent | undefined;
    pointerDown.current = {
      x: ne?.clientX ?? 0,
      y: ne?.clientY ?? 0,
      time: Date.now(),
    };
  }, []);

  const handlePointerUp = useCallback((e: THREE.Event & { stopPropagation: () => void; point?: THREE.Vector3; nativeEvent?: PointerEvent }) => {
    const ne = (e as any).nativeEvent as PointerEvent | undefined;
    const down = pointerDown.current;
    pointerDown.current = null;

    if (!down) return;

    // Only count as tap if pointer didn't move much and was quick
    const dx = (ne?.clientX ?? 0) - down.x;
    const dy = (ne?.clientY ?? 0) - down.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const elapsed = Date.now() - down.time;

    if (dist > 15 || elapsed > 400) return; // was a drag, not a tap

    const pt = (e as any).point as THREE.Vector3 | undefined;
    if (!pt) return;

    e.stopPropagation();

    // Find nearest cell center to click point (in XZ plane)
    let bestId = '';
    let bestDist = Infinity;
    for (const c of cellCenters) {
      const d = (pt.x - c.x) ** 2 + (pt.z - c.z) ** 2;
      if (d < bestDist) {
        bestDist = d;
        bestId = c.id;
      }
    }

    if (bestId && bestDist < 2) {
      onCellTap(bestId);
    }
  }, [cellCenters, onCellTap]);

  return (
    <mesh
      position={[0, 0, 0]}
      rotation-x={-Math.PI / 2}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <planeGeometry args={[30, 30]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

/** Pure visual quad cell (no click handling) */
function QuadCellVisual({ corners, height }: { corners: [number, number][]; height: number }) {
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
    geo.computeBoundingSphere();
    return geo;
  }, [corners]);

  const color = height === 0 ? PALETTE.grassLight : PALETTE.dirt;
  const y = height > 0 ? height * 0.8 : 0;

  return (
    <group position={[0, y, 0]}>
      <mesh geometry={geometry} position={[0, 0.01, 0]} receiveShadow>
        <meshLambertMaterial color={color} />
      </mesh>
      <QuadBorder corners={corners} />
    </group>
  );
}

function QuadBorder({ corners }: { corners: [number, number][] }) {
  const lineObj = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pts = new Float32Array(corners.flatMap(([x, z]) => [x, 0.03, z]));
    geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    const mat = new THREE.LineBasicMaterial({ color: '#2A5A1A', transparent: true, opacity: 0.25 });
    return new THREE.LineLoop(geo, mat);
  }, [corners]);

  return <primitive object={lineObj} />;
}
