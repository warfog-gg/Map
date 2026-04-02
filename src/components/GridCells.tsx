import { useCallback, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { GridState } from '../types';
import { PALETTE } from '../types';

interface GridCellsProps {
  grid: GridState;
  onTap: (worldX: number, worldZ: number) => void;
}

export function GridCells({ grid, onTap }: GridCellsProps) {
  // Visual ground cells
  const groundGeo = useMemo(() => {
    const positions: number[] = [];
    const normals: number[] = [];

    grid.cells.forEach((cell) => {
      const [c0, c1, c2, c3] = cell.corners.map((vi) => grid.vertices[vi]);
      // Two triangles per cell (CCW from +Y)
      positions.push(
        c0.x, 0, c0.z, c1.x, 0, c1.z, c2.x, 0, c2.z,
        c0.x, 0, c0.z, c2.x, 0, c2.z, c3.x, 0, c3.z,
      );
      for (let i = 0; i < 6; i++) normals.push(0, 1, 0);
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
    geo.computeBoundingSphere();
    return geo;
  }, [grid]);

  // Grid lines
  const linesGeo = useMemo(() => {
    const positions: number[] = [];
    grid.cells.forEach((cell) => {
      const corners = cell.corners.map((vi) => grid.vertices[vi]);
      for (let i = 0; i < 4; i++) {
        const a = corners[i], b = corners[(i + 1) % 4];
        positions.push(a.x, 0.02, a.z, b.x, 0.02, b.z);
      }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    return geo;
  }, [grid]);

  return (
    <group>
      {/* Visual ground */}
      <mesh geometry={groundGeo} receiveShadow>
        <meshLambertMaterial color={PALETTE.grassLight} />
      </mesh>

      {/* Grid lines */}
      <lineSegments geometry={linesGeo}>
        <lineBasicMaterial color="#2A5A1A" transparent opacity={0.2} />
      </lineSegments>

      {/* Invisible tap plane */}
      <TapPlane onTap={onTap} />
    </group>
  );
}

/** Invisible plane that catches taps and reports world XZ coordinates */
function TapPlane({ onTap }: { onTap: (x: number, z: number) => void }) {
  const pointerDown = useRef<{ x: number; y: number; time: number } | null>(null);

  const handlePointerDown = useCallback((e: any) => {
    const ne = e.nativeEvent as PointerEvent | undefined;
    pointerDown.current = {
      x: ne?.clientX ?? 0,
      y: ne?.clientY ?? 0,
      time: Date.now(),
    };
  }, []);

  const handlePointerUp = useCallback((e: any) => {
    const ne = e.nativeEvent as PointerEvent | undefined;
    const down = pointerDown.current;
    pointerDown.current = null;
    if (!down) return;

    const dx = (ne?.clientX ?? 0) - down.x;
    const dy = (ne?.clientY ?? 0) - down.y;
    if (Math.sqrt(dx * dx + dy * dy) > 15 || Date.now() - down.time > 400) return;

    const pt = e.point as THREE.Vector3 | undefined;
    if (!pt) return;
    e.stopPropagation();
    onTap(pt.x, pt.z);
  }, [onTap]);

  return (
    <mesh
      rotation-x={-Math.PI / 2}
      position={[0, 0, 0]}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <planeGeometry args={[30, 30]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}
