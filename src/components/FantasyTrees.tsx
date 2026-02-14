import { useMemo } from 'react';
import type { Polygon } from '../types';

interface FantasyTreesProps {
  greenAreas: Polygon[];
}

/** Scatter procedural low-poly trees inside green/forest areas */
export function FantasyTrees({ greenAreas }: FantasyTreesProps) {
  const trees = useMemo(() => {
    const result: { x: number; z: number; scale: number; variant: number }[] = [];

    for (const area of greenAreas) {
      const pts = area.points;
      if (pts.length < 3) continue;

      // Bounding box
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      for (const p of pts) {
        if (p[0] < minX) minX = p[0];
        if (p[0] > maxX) maxX = p[0];
        if (p[1] < minZ) minZ = p[1];
        if (p[1] > maxZ) maxZ = p[1];
      }

      // Scatter trees with spacing
      const spacing = 8;
      const areaWidth = maxX - minX;
      const areaHeight = maxZ - minZ;

      // Limit tree density for performance
      const maxTreesPerArea = 50;
      const effectiveSpacing = Math.max(spacing, Math.sqrt((areaWidth * areaHeight) / maxTreesPerArea));

      for (let x = minX; x <= maxX; x += effectiveSpacing) {
        for (let z = minZ; z <= maxZ; z += effectiveSpacing) {
          // Pseudo-random offset
          const ox = (seededRandom(x * 1000 + z) - 0.5) * effectiveSpacing * 0.6;
          const oz = (seededRandom(z * 1000 + x + 7) - 0.5) * effectiveSpacing * 0.6;
          const px = x + ox;
          const pz = z + oz;

          if (pointInPolygon(px, pz, pts)) {
            result.push({
              x: px,
              z: pz,
              scale: 0.6 + seededRandom(px * 100 + pz * 200) * 0.8,
              variant: Math.floor(seededRandom(px * 300 + pz) * 3),
            });
          }
        }
      }
    }

    return result;
  }, [greenAreas]);

  return (
    <group>
      {trees.map((t, i) => (
        <Tree key={i} x={t.x} z={t.z} scale={t.scale} variant={t.variant} />
      ))}
    </group>
  );
}

function Tree({ x, z, scale, variant }: { x: number; z: number; scale: number; variant: number }) {
  const colors = ['#1a5c1a', '#2d7a2d', '#145214'];
  const trunkColor = '#5c3a1e';
  const foliageColor = colors[variant % colors.length];

  return (
    <group position={[x, 0, z]} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.3, 4, 5]} />
        <meshStandardMaterial color={trunkColor} flatShading />
      </mesh>
      {/* Foliage layers */}
      <mesh position={[0, 5, 0]} castShadow>
        <coneGeometry args={[2, 3, 6]} />
        <meshStandardMaterial color={foliageColor} flatShading />
      </mesh>
      <mesh position={[0, 6.5, 0]} castShadow>
        <coneGeometry args={[1.5, 2.5, 6]} />
        <meshStandardMaterial color={foliageColor} flatShading />
      </mesh>
      {variant === 0 && (
        <mesh position={[0, 7.8, 0]} castShadow>
          <coneGeometry args={[1, 2, 6]} />
          <meshStandardMaterial color={foliageColor} flatShading />
        </mesh>
      )}
    </group>
  );
}

/** Simple seeded pseudo-random (0..1) */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Point-in-polygon ray casting test */
function pointInPolygon(px: number, pz: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], zi = polygon[i][1];
    const xj = polygon[j][0], zj = polygon[j][1];
    if ((zi > pz) !== (zj > pz) && px < ((xj - xi) * (pz - zi)) / (zj - zi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}
