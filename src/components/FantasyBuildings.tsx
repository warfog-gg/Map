import { useMemo } from 'react';
import * as THREE from 'three';
import type { Building, FantasyBuildingType } from '../types';

interface FantasyBuildingsProps {
  buildings: Building[];
}

const COLORS: Record<FantasyBuildingType, string> = {
  castle: '#6b6b6b',
  tower: '#555555',
  cottage: '#8B7355',
  temple: '#DAA520',
  tavern: '#A0522D',
  fortress: '#4a4a4a',
  windmill: '#C4A882',
};

const ROOF_COLORS: Record<FantasyBuildingType, string> = {
  castle: '#4a0000',
  tower: '#333366',
  cottage: '#654321',
  temple: '#FFD700',
  tavern: '#8B0000',
  fortress: '#2a2a2a',
  windmill: '#8B7355',
};

export function FantasyBuildings({ buildings }: FantasyBuildingsProps) {
  const meshes = useMemo(() => {
    return buildings.map((b) => {
      const center = polygonCenter(b.polygon);
      const radius = polygonRadius(b.polygon, center);
      return { ...b, center, radius };
    });
  }, [buildings]);

  return (
    <group>
      {meshes.map((b, i) => (
        <BuildingMesh key={i} building={b} />
      ))}
    </group>
  );
}

interface BuildingMeshProps {
  building: Building & { center: [number, number]; radius: number };
}

function BuildingMesh({ building }: BuildingMeshProps) {
  const { center, radius, height, type } = building;
  const color = COLORS[type];
  const roofColor = ROOF_COLORS[type];

  switch (type) {
    case 'castle':
    case 'fortress':
      return <CastleMesh center={center} radius={radius} height={height} color={color} roofColor={roofColor} />;
    case 'tower':
      return <TowerMesh center={center} radius={radius} height={height} color={color} roofColor={roofColor} />;
    case 'temple':
      return <TempleMesh center={center} radius={radius} height={height} color={color} roofColor={roofColor} />;
    case 'tavern':
      return <TavernMesh center={center} radius={radius} height={height} color={color} roofColor={roofColor} />;
    case 'windmill':
      return <WindmillMesh center={center} radius={radius} height={height} />;
    default:
      return <CottageMesh center={center} radius={radius} height={height} color={color} roofColor={roofColor} />;
  }
}

function CastleMesh({ center, radius, height, color, roofColor }: MeshProps) {
  const r = Math.max(radius, 3);
  const h = Math.max(height, 8);
  return (
    <group position={[center[0], 0, center[1]]}>
      {/* Main keep */}
      <mesh position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[r * 1.5, h, r * 1.5]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      {/* Battlements - 4 corner towers */}
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([dx, dz], i) => (
        <group key={i} position={[dx * r * 0.8, 0, dz * r * 0.8]}>
          <mesh position={[0, h * 0.6, 0]} castShadow>
            <cylinderGeometry args={[r * 0.2, r * 0.25, h * 1.2, 6]} />
            <meshStandardMaterial color={color} flatShading />
          </mesh>
          {/* Tower cap */}
          <mesh position={[0, h * 1.25, 0]} castShadow>
            <coneGeometry args={[r * 0.3, h * 0.3, 6]} />
            <meshStandardMaterial color={roofColor} flatShading />
          </mesh>
        </group>
      ))}
      {/* Flag on top */}
      <mesh position={[0, h + 2, 0]}>
        <boxGeometry args={[0.1, 4, 0.1]} />
        <meshStandardMaterial color="#4a3000" />
      </mesh>
      <mesh position={[0.8, h + 3.5, 0]}>
        <boxGeometry args={[1.5, 0.8, 0.05]} />
        <meshStandardMaterial color="#8B0000" flatShading />
      </mesh>
    </group>
  );
}

function TowerMesh({ center, radius, height, color, roofColor }: MeshProps) {
  const r = Math.max(radius, 1.5);
  const h = Math.max(height, 10);
  return (
    <group position={[center[0], 0, center[1]]}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[r * 0.6, r * 0.8, h, 8]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      <mesh position={[0, h + r * 0.4, 0]} castShadow>
        <coneGeometry args={[r * 0.9, r * 1.5, 8]} />
        <meshStandardMaterial color={roofColor} flatShading />
      </mesh>
    </group>
  );
}

function TempleMesh({ center, radius, height, color, roofColor }: MeshProps) {
  const r = Math.max(radius, 3);
  const h = Math.max(height, 7);
  return (
    <group position={[center[0], 0, center[1]]}>
      {/* Base */}
      <mesh position={[0, h * 0.4, 0]} castShadow>
        <boxGeometry args={[r * 2, h * 0.8, r * 1.5]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      {/* Spire */}
      <mesh position={[0, h + 2, 0]} castShadow>
        <coneGeometry args={[r * 0.3, h * 0.8, 4]} />
        <meshStandardMaterial color={roofColor} flatShading emissive="#FFD700" emissiveIntensity={0.2} />
      </mesh>
      {/* Columns */}
      {[-1, 1].map((dx, i) => (
        <mesh key={i} position={[dx * r * 0.8, h * 0.3, r * 0.8]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, h * 0.6, 6]} />
          <meshStandardMaterial color="#e8e0c8" flatShading />
        </mesh>
      ))}
    </group>
  );
}

function TavernMesh({ center, radius, height, color, roofColor }: MeshProps) {
  const r = Math.max(radius, 2);
  const h = Math.max(height, 5);
  return (
    <group position={[center[0], 0, center[1]]}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[r * 1.8, h, r * 1.4]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      {/* Pitched roof */}
      <mesh position={[0, h + 1.5, 0]} castShadow rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[r * 1.5, 3, 4]} />
        <meshStandardMaterial color={roofColor} flatShading />
      </mesh>
      {/* Sign */}
      <mesh position={[r * 0.9 + 0.5, h * 0.5, 0]}>
        <boxGeometry args={[0.8, 0.5, 0.05]} />
        <meshStandardMaterial color="#DAA520" flatShading />
      </mesh>
    </group>
  );
}

function CottageMesh({ center, radius, height, color, roofColor }: MeshProps) {
  const r = Math.max(radius, 1.5);
  const h = Math.max(height, 4);
  return (
    <group position={[center[0], 0, center[1]]}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[r * 1.6, h, r * 1.3]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      <mesh position={[0, h + 1, 0]} castShadow rotation={[0, 0, 0]}>
        <coneGeometry args={[r * 1.2, 2.5, 4]} />
        <meshStandardMaterial color={roofColor} flatShading />
      </mesh>
      {/* Chimney */}
      <mesh position={[r * 0.4, h + 2, 0]} castShadow>
        <boxGeometry args={[0.6, 1.5, 0.6]} />
        <meshStandardMaterial color="#555" flatShading />
      </mesh>
    </group>
  );
}

function WindmillMesh({ center, radius, height }: { center: [number, number]; radius: number; height: number }) {
  const r = Math.max(radius, 2);
  const h = Math.max(height, 8);
  return (
    <group position={[center[0], 0, center[1]]}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[r * 0.4, r * 0.6, h, 8]} />
        <meshStandardMaterial color="#C4A882" flatShading />
      </mesh>
      <mesh position={[0, h + 0.5, 0]} castShadow>
        <coneGeometry args={[r * 0.5, 2, 8]} />
        <meshStandardMaterial color="#8B7355" flatShading />
      </mesh>
      {/* Blades */}
      {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((angle, i) => (
        <mesh key={i} position={[Math.cos(angle) * 2, h * 0.8 + Math.sin(angle) * 2, r * 0.5]} rotation={[0, 0, angle]}>
          <boxGeometry args={[0.2, 3.5, 0.05]} />
          <meshStandardMaterial color="#ddd" flatShading />
        </mesh>
      ))}
    </group>
  );
}

interface MeshProps {
  center: [number, number];
  radius: number;
  height: number;
  color: string;
  roofColor: string;
}

function polygonCenter(pts: [number, number][]): [number, number] {
  let x = 0, z = 0;
  for (const p of pts) { x += p[0]; z += p[1]; }
  return [x / pts.length, z / pts.length];
}

function polygonRadius(pts: [number, number][], center: [number, number]): number {
  let maxDist = 0;
  for (const p of pts) {
    const d = Math.sqrt((p[0] - center[0]) ** 2 + (p[1] - center[1]) ** 2);
    if (d > maxDist) maxDist = d;
  }
  return maxDist;
}
