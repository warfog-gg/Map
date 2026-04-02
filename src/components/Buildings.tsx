import { useMemo } from 'react';
import * as THREE from 'three';
import type { GridState } from '../types';
import { PALETTE } from '../types';
import { cellCorners, cellCenter, getNeighbors } from '../grid';

interface BuildingsProps {
  grid: GridState;
}

const BLOCK_H = 0.8;
const INSET = 0.92; // slight inset from cell edge for gap between buildings

export function Buildings({ grid }: BuildingsProps) {
  const blocks = useMemo(() => {
    const result: {
      corners: [number, number][];
      center: { x: number; z: number };
      y: number;
      isTop: boolean;
      isBottom: boolean;
      level: number;
      height: number;
      neighborCount: number;
    }[] = [];

    grid.cells.forEach((cell) => {
      if (cell.height <= 0) return;

      const corners = cellCorners(cell, grid.vertices);
      const center = cellCenter(cell, grid.vertices);
      const neighbors = getNeighbors(cell, grid.cells);

      for (let level = 0; level < cell.height; level++) {
        // Count neighbors that also have a block at this level
        const nCount = neighbors.filter((n) => n.height > level).length;

        result.push({
          corners,
          center,
          y: level * BLOCK_H,
          isTop: level === cell.height - 1,
          isBottom: level === 0,
          level,
          height: cell.height,
          neighborCount: nCount,
        });
      }
    });

    return result;
  }, [grid]);

  return (
    <group>
      {blocks.map((b, i) => (
        <QuadBlock key={i} {...b} />
      ))}
    </group>
  );
}

interface QuadBlockProps {
  corners: [number, number][];
  center: { x: number; z: number };
  y: number;
  isTop: boolean;
  isBottom: boolean;
  level: number;
  height: number;
  neighborCount: number;
}

/** Extrude a quad cell shape into a building block */
function QuadBlock({ corners, center, y, isTop, isBottom, level, height, neighborCount }: QuadBlockProps) {
  const isTower = height >= 4 && neighborCount <= 1;

  // Inset corners slightly toward center for gaps between buildings
  const insetCorners = useMemo(() => {
    return corners.map(([cx, cz]) => {
      const dx = cx - center.x;
      const dz = cz - center.z;
      return [center.x + dx * INSET, center.z + dz * INSET] as [number, number];
    });
  }, [corners, center]);

  // Wall geometry: extruded quad prism
  const wallGeo = useMemo(() => {
    return buildExtrudedQuad(insetCorners, BLOCK_H);
  }, [insetCorners]);

  // Top face geometry
  const topGeo = useMemo(() => {
    return buildQuadFace(insetCorners, BLOCK_H);
  }, [insetCorners]);

  // Bottom face geometry
  const bottomGeo = useMemo(() => {
    return buildQuadFace(insetCorners, 0);
  }, [insetCorners]);

  // Wall color by level
  const wallColor = isBottom ? PALETTE.stone
    : level <= 1 ? PALETTE.stoneDark
    : level % 2 === 0 ? PALETTE.timber : PALETTE.timberDark;

  const topColor = isTop ? PALETTE.roofBlue : wallColor;

  return (
    <group position={[0, y, 0]}>
      {/* Walls (sides) */}
      <mesh geometry={wallGeo} castShadow receiveShadow>
        <meshLambertMaterial color={wallColor} side={THREE.DoubleSide} />
      </mesh>

      {/* Top face */}
      <mesh geometry={topGeo} castShadow receiveShadow>
        <meshLambertMaterial color={topColor} side={THREE.DoubleSide} />
      </mesh>

      {/* Bottom face */}
      <mesh geometry={bottomGeo} receiveShadow>
        <meshLambertMaterial color={wallColor} side={THREE.DoubleSide} />
      </mesh>

      {/* Trim at base of block */}
      <TrimRing corners={insetCorners} y={0} color={PALETTE.stoneDark} />

      {/* Gold trim on second floor */}
      {level === 1 && (
        <TrimRing corners={insetCorners} y={BLOCK_H} color={PALETTE.gold} />
      )}

      {/* Windows on upper non-top floors */}
      {level > 0 && !isTop && (
        <Windows corners={insetCorners} center={center} />
      )}

      {/* Roof on top */}
      {isTop && isTower && (
        <TowerRoof corners={insetCorners} center={center} y={BLOCK_H} />
      )}
      {isTop && !isTower && (
        <PeakedRoof corners={insetCorners} center={center} y={BLOCK_H} flat={neighborCount >= 3} />
      )}

      {/* Door on ground floor */}
      {isBottom && (
        <Door corners={insetCorners} center={center} />
      )}
    </group>
  );
}

/** Build side walls of an extruded quad */
function buildExtrudedQuad(corners: [number, number][], h: number): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const verts: number[] = [];
  const normals: number[] = [];

  for (let i = 0; i < corners.length; i++) {
    const [x1, z1] = corners[i];
    const [x2, z2] = corners[(i + 1) % corners.length];

    // Normal for this face (pointing outward)
    const dx = x2 - x1;
    const dz = z2 - z1;
    const nx = dz, nz = -dx;
    const len = Math.sqrt(nx * nx + nz * nz) || 1;

    // Two triangles per face
    verts.push(
      x1, 0, z1,  x2, 0, z2,  x2, h, z2,
      x1, 0, z1,  x2, h, z2,  x1, h, z1,
    );
    for (let t = 0; t < 6; t++) {
      normals.push(nx / len, 0, nz / len);
    }
  }

  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
  return geo;
}

/** Build a flat quad face at height y */
function buildQuadFace(corners: [number, number][], y: number): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const [c0, c1, c2, c3] = corners;
  const verts = new Float32Array([
    c0[0], y, c0[1],  c1[0], y, c1[1],  c2[0], y, c2[1],
    c0[0], y, c0[1],  c2[0], y, c2[1],  c3[0], y, c3[1],
  ]);
  const normals = new Float32Array([
    0, 1, 0,  0, 1, 0,  0, 1, 0,
    0, 1, 0,  0, 1, 0,  0, 1, 0,
  ]);
  geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  return geo;
}

/** Decorative trim ring at a specific height */
function TrimRing({ corners, y, color }: { corners: [number, number][]; y: number; color: string }) {
  const geo = useMemo(() => {
    // Slightly larger outline
    const trimH = 0.04;
    return buildExtrudedQuad(
      corners.map(([x, z]) => [x, z] as [number, number]),
      trimH,
    );
  }, [corners]);

  return (
    <mesh geometry={geo} position={[0, y, 0]}>
      <meshLambertMaterial color={color} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** Compute outward normal for a wall edge, given cell center */
function wallNormal(
  c1: [number, number], c2: [number, number], center: { x: number; z: number }
): { nx: number; nz: number; angle: number } {
  const dx = c2[0] - c1[0];
  const dz = c2[1] - c1[1];
  // Two perpendicular candidates
  let nx = dz, nz = -dx;
  // Pick the one pointing away from center
  const mx = (c1[0] + c2[0]) / 2;
  const mz = (c1[1] + c2[1]) / 2;
  const dot = nx * (mx - center.x) + nz * (mz - center.z);
  if (dot < 0) { nx = -nx; nz = -nz; }
  const len = Math.sqrt(nx * nx + nz * nz) || 1;
  nx /= len; nz /= len;
  // rotation-y so local +Z aligns with outward normal
  const angle = Math.atan2(nx, nz);
  return { nx, nz, angle };
}

/** Window details on walls */
function Windows({ corners, center }: { corners: [number, number][]; center: { x: number; z: number } }) {
  return (
    <group>
      {corners.map((c, i) => {
        const c2 = corners[(i + 1) % corners.length];
        const mx = (c[0] + c2[0]) / 2;
        const mz = (c[1] + c2[1]) / 2;
        const { nx, nz, angle } = wallNormal(c, c2, center);
        // Push out to wall surface (half the box depth)
        const offset = 0.015;
        return (
          <mesh
            key={i}
            position={[mx + nx * offset, BLOCK_H * 0.5, mz + nz * offset]}
            rotation-y={angle}
          >
            <boxGeometry args={[0.14, 0.18, 0.03]} />
            <meshLambertMaterial color={PALETTE.goldBright} emissive="#FFD700" emissiveIntensity={0.15} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Peaked roof: pyramid from quad corners to center peak */
function PeakedRoof({ corners, center, y, flat }: {
  corners: [number, number][]; center: { x: number; z: number }; y: number; flat: boolean;
}) {
  const geo = useMemo(() => {
    const peakH = flat ? 0.15 : 0.4;
    const g = new THREE.BufferGeometry();
    const verts: number[] = [];
    const normals: number[] = [];

    // 4 triangular faces from each edge to center peak
    for (let i = 0; i < corners.length; i++) {
      const [x1, z1] = corners[i];
      const [x2, z2] = corners[(i + 1) % corners.length];

      verts.push(
        x1, y, z1,
        x2, y, z2,
        center.x, y + peakH, center.z,
      );

      // Compute face normal
      const ax = x2 - x1, az = z2 - z1;
      const bx = center.x - x1, by = peakH, bz = center.z - z1;
      let nx = az * by - 0 * bz;
      let ny = 0 * bx - ax * by;
      let nz = ax * bz - az * bx;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      nx /= len; ny /= len; nz /= len;
      normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
    }

    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
    return g;
  }, [corners, center, y, flat]);

  return (
    <mesh geometry={geo} castShadow>
      <meshLambertMaterial color={PALETTE.roofBlue} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** Tower roof: taller pointed pyramid with flag */
function TowerRoof({ corners, center, y }: {
  corners: [number, number][]; center: { x: number; z: number }; y: number;
}) {
  const geo = useMemo(() => {
    const peakH = 0.8;
    const g = new THREE.BufferGeometry();
    const verts: number[] = [];
    const normals: number[] = [];

    for (let i = 0; i < corners.length; i++) {
      const [x1, z1] = corners[i];
      const [x2, z2] = corners[(i + 1) % corners.length];

      verts.push(x1, y, z1, x2, y, z2, center.x, y + peakH, center.z);

      const ax = x2 - x1, az = z2 - z1;
      const bx = center.x - x1, by = peakH, bz = center.z - z1;
      let nx = az * by;
      let ny = -ax * by;
      let nz = ax * bz - az * bx;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      nx /= len; ny /= len; nz /= len;
      normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
    }

    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
    return g;
  }, [corners, center, y]);

  return (
    <group>
      <mesh geometry={geo} castShadow>
        <meshLambertMaterial color={PALETTE.roofBlueLt} side={THREE.DoubleSide} />
      </mesh>
      {/* Gold tip */}
      <mesh position={[center.x, y + 0.85, center.z]}>
        <sphereGeometry args={[0.05, 6, 4]} />
        <meshLambertMaterial color={PALETTE.goldBright} emissive={PALETTE.gold} emissiveIntensity={0.3} />
      </mesh>
      {/* Flag */}
      <mesh position={[center.x + 0.07, y + 0.95, center.z]} rotation-z={0.1}>
        <planeGeometry args={[0.18, 0.1]} />
        <meshLambertMaterial color="#1E3A8A" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** Door on ground floor */
function Door({ corners, center }: { corners: [number, number][]; center: { x: number; z: number } }) {
  const mx = (corners[0][0] + corners[1][0]) / 2;
  const mz = (corners[0][1] + corners[1][1]) / 2;
  const { nx, nz, angle } = wallNormal(corners[0], corners[1], center);
  const offset = 0.025;

  return (
    <group position={[mx + nx * offset, 0.25, mz + nz * offset]} rotation-y={angle}>
      <mesh>
        <boxGeometry args={[0.2, 0.4, 0.05]} />
        <meshLambertMaterial color={PALETTE.timberDark} />
      </mesh>
    </group>
  );
}
