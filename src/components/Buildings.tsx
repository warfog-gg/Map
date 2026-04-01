import { useMemo } from 'react';
import * as THREE from 'three';
import type { GridState } from '../types';
import { PALETTE } from '../types';
import { getNeighborIds, CELL_SIZE } from '../grid';

interface BuildingsProps {
  grid: GridState;
}

const BLOCK_H = 0.8;
const BLOCK_R = CELL_SIZE * 0.44;

export function Buildings({ grid }: BuildingsProps) {
  const blocks = useMemo(() => {
    const result: {
      x: number; y: number; z: number;
      isTop: boolean;
      isBottom: boolean;
      height: number;
      level: number;
      neighborMask: number;
      neighborCount: number;
    }[] = [];

    grid.forEach((cell) => {
      if (cell.height <= 0) return;

      const nIds = getNeighborIds(cell.col, cell.row);
      const neighborHeights = nIds.map((nid) => grid.get(nid)?.height ?? 0);

      for (let level = 0; level < cell.height; level++) {
        // Neighbor mask at this level (which neighbors also have a block at this height)
        let mask = 0;
        let count = 0;
        neighborHeights.forEach((nh, i) => {
          if (nh > level) {
            mask |= (1 << i);
            count++;
          }
        });

        result.push({
          x: cell.x,
          y: level * BLOCK_H,
          z: cell.z,
          isTop: level === cell.height - 1,
          isBottom: level === 0,
          height: cell.height,
          level,
          neighborMask: mask,
          neighborCount: count,
        });
      }
    });

    return result;
  }, [grid]);

  return (
    <group>
      {blocks.map((b, i) => (
        <BuildingBlock key={i} {...b} />
      ))}
    </group>
  );
}

interface BlockProps {
  x: number; y: number; z: number;
  isTop: boolean;
  isBottom: boolean;
  height: number;
  level: number;
  neighborMask: number;
  neighborCount: number;
}

function BuildingBlock({ x, y, z, isTop, isBottom, height, level, neighborCount }: BlockProps) {
  const isTower = height >= 4 && neighborCount <= 1;

  // Wall color: stone at base, timber for upper floors
  const wallColor = useMemo(() => {
    if (isBottom) return PALETTE.stone;
    if (level <= 1) return PALETTE.stoneDark;
    return level % 2 === 0 ? PALETTE.timber : PALETTE.timberDark;
  }, [isBottom, level]);

  // Roof color
  const roofColor = isTower ? PALETTE.roofBlueLt : PALETTE.roofBlue;

  return (
    <group position={[x, y, z]}>
      {/* Main block body */}
      <mesh castShadow receiveShadow position={[0, BLOCK_H / 2, 0]}>
        <cylinderGeometry args={[BLOCK_R * 0.92, BLOCK_R, BLOCK_H, 6]} />
        <meshLambertMaterial color={wallColor} />
      </mesh>

      {/* Stone trim at bottom of each block */}
      <mesh castShadow position={[0, 0.04, 0]}>
        <cylinderGeometry args={[BLOCK_R * 1.02, BLOCK_R * 1.02, 0.08, 6]} />
        <meshLambertMaterial color={PALETTE.stoneDark} />
      </mesh>

      {/* Window details on upper floors */}
      {level > 0 && !isTop && (
        <WindowDetails y={BLOCK_H / 2} radius={BLOCK_R} />
      )}

      {/* Gold trim on second floor */}
      {level === 1 && (
        <mesh position={[0, BLOCK_H, 0]}>
          <cylinderGeometry args={[BLOCK_R * 0.95, BLOCK_R * 0.97, 0.05, 6]} />
          <meshLambertMaterial color={PALETTE.gold} />
        </mesh>
      )}

      {/* Roof on top block */}
      {isTop && (
        <>
          {isTower ? (
            <TowerRoof y={BLOCK_H} radius={BLOCK_R} color={roofColor} />
          ) : (
            <StandardRoof y={BLOCK_H} radius={BLOCK_R} color={roofColor} neighborCount={neighborCount} />
          )}
        </>
      )}

      {/* Door on ground floor */}
      {isBottom && (
        <DoorDetail y={0} radius={BLOCK_R} />
      )}
    </group>
  );
}

/** Pointed tower roof (for tall isolated columns) */
function TowerRoof({ y, radius, color }: { y: number; radius: number; color: string }) {
  return (
    <group position={[0, y, 0]}>
      <mesh castShadow position={[0, 0.5, 0]}>
        <coneGeometry args={[radius * 1.15, 1.0, 6]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* Gold tip */}
      <mesh position={[0, 1.05, 0]}>
        <sphereGeometry args={[0.06, 6, 4]} />
        <meshLambertMaterial color={PALETTE.goldBright} emissive={PALETTE.gold} emissiveIntensity={0.3} />
      </mesh>
      {/* Flag */}
      <mesh position={[0.08, 1.15, 0]} rotation-z={0.1}>
        <planeGeometry args={[0.2, 0.12]} />
        <meshLambertMaterial color="#1E3A8A" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** Standard peaked roof */
function StandardRoof({ y, radius, color, neighborCount }: { y: number; radius: number; color: string; neighborCount: number }) {
  const roofHeight = neighborCount >= 3 ? 0.25 : 0.45;
  return (
    <group position={[0, y, 0]}>
      <mesh castShadow position={[0, roofHeight / 2, 0]}>
        <coneGeometry args={[radius * 1.12, roofHeight, 6]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* Roof edge trim */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[radius * 1.13, radius * 1.13, 0.04, 6]} />
        <meshLambertMaterial color={PALETTE.timber} />
      </mesh>
    </group>
  );
}

/** Small window bumps */
function WindowDetails({ y, radius }: { y: number; radius: number }) {
  return (
    <group>
      {[0, 2, 4].map((i) => {
        const angle = (Math.PI / 3) * i + Math.PI / 6;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * radius * 0.95,
              y,
              Math.sin(angle) * radius * 0.95,
            ]}
            rotation-y={-angle}
          >
            <boxGeometry args={[0.15, 0.2, 0.04]} />
            <meshLambertMaterial color={PALETTE.goldBright} emissive="#FFD700" emissiveIntensity={0.15} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Door arch on ground floor */
function DoorDetail({ y, radius }: { y: number; radius: number }) {
  const angle = Math.PI / 6; // face one hex edge
  return (
    <group
      position={[
        Math.cos(angle) * radius * 0.93,
        y + 0.3,
        Math.sin(angle) * radius * 0.93,
      ]}
      rotation-y={-angle}
    >
      {/* Door frame */}
      <mesh>
        <boxGeometry args={[0.22, 0.45, 0.06]} />
        <meshLambertMaterial color={PALETTE.timberDark} />
      </mesh>
      {/* Door arch top */}
      <mesh position={[0, 0.22, 0]}>
        <sphereGeometry args={[0.11, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshLambertMaterial color={PALETTE.stoneDark} />
      </mesh>
    </group>
  );
}
