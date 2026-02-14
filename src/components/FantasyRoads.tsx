import { useMemo } from 'react';
import * as THREE from 'three';
import type { Road, FantasyRoadType } from '../types';

interface FantasyRoadsProps {
  roads: Road[];
}

const ROAD_COLORS: Record<FantasyRoadType, string> = {
  stone_road: '#8B8682',
  dirt_path: '#A0896B',
  bridge: '#6B5B4F',
};

export function FantasyRoads({ roads }: FantasyRoadsProps) {
  const meshes = useMemo(() => {
    return roads.map((road) => {
      const geometry = createRoadGeometry(road.points, road.width);
      return { geometry, color: ROAD_COLORS[road.type], type: road.type };
    });
  }, [roads]);

  return (
    <group>
      {meshes.map((m, i) => (
        <group key={i}>
          <mesh geometry={m.geometry} position={[0, 0.3, 0]} receiveShadow>
            <meshStandardMaterial
              color={m.color}
              side={THREE.DoubleSide}
              flatShading
            />
          </mesh>
          {/* Bridge railings */}
          {m.type === 'bridge' && (
            <mesh geometry={m.geometry} position={[0, 1.5, 0]}>
              <meshStandardMaterial color="#4a3728" wireframe />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

/** Create a ribbon mesh along road points with a given width */
function createRoadGeometry(points: [number, number][], width: number): THREE.BufferGeometry {
  if (points.length < 2) return new THREE.BufferGeometry();

  const vertices: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < points.length; i++) {
    const curr = points[i];
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];

    // Direction tangent
    const dx = next[0] - prev[0];
    const dz = next[1] - prev[1];
    const len = Math.sqrt(dx * dx + dz * dz) || 1;

    // Normal (perpendicular)
    const nx = -dz / len;
    const nz = dx / len;

    const hw = width / 2;
    // Left vertex
    vertices.push(curr[0] + nx * hw, 0, curr[1] + nz * hw);
    // Right vertex
    vertices.push(curr[0] - nx * hw, 0, curr[1] - nz * hw);

    if (i < points.length - 1) {
      const vi = i * 2;
      indices.push(vi, vi + 1, vi + 2);
      indices.push(vi + 1, vi + 3, vi + 2);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}
