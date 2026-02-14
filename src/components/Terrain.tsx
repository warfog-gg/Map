import { useMemo } from 'react';
import * as THREE from 'three';
import type { MapData } from '../types';

interface TerrainProps {
  mapData: MapData;
}

/** Generates a terrain mesh from the elevation grid */
export function Terrain({ mapData }: TerrainProps) {
  const { geometry, waterGeometries, greenGeometries } = useMemo(() => {
    const { elevation, bounds } = mapData;
    const rows = elevation.length;
    const cols = elevation[0].length;

    const widthM = (bounds.east - bounds.west) * 111320 * Math.cos((((bounds.south + bounds.north) / 2) * Math.PI) / 180);
    const heightM = (bounds.north - bounds.south) * 111320;

    // Terrain geometry
    const geo = new THREE.PlaneGeometry(widthM, heightM, cols - 1, rows - 1);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        pos.setY(idx, elevation[row][col]);
      }
    }
    geo.computeVertexNormals();

    // Color the terrain vertices
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const h = pos.getY(i);
      const t = h / (mapData.elevationBounds.maxElev || 1);
      // Gradient: dark green valleys → light green hills → brown/grey peaks
      if (t < 0.3) {
        colors[i * 3] = 0.15 + t * 0.3;
        colors[i * 3 + 1] = 0.35 + t * 0.4;
        colors[i * 3 + 2] = 0.1;
      } else if (t < 0.7) {
        const s = (t - 0.3) / 0.4;
        colors[i * 3] = 0.25 + s * 0.3;
        colors[i * 3 + 1] = 0.55 - s * 0.15;
        colors[i * 3 + 2] = 0.1 + s * 0.1;
      } else {
        const s = (t - 0.7) / 0.3;
        colors[i * 3] = 0.55 + s * 0.2;
        colors[i * 3 + 1] = 0.4 + s * 0.15;
        colors[i * 3 + 2] = 0.2 + s * 0.2;
      }
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Water areas as flat blue polygons
    const waterGeos = mapData.waterAreas.map((area) => {
      const shape = new THREE.Shape();
      area.points.forEach((p, i) => {
        if (i === 0) shape.moveTo(p[0], p[1]);
        else shape.lineTo(p[0], p[1]);
      });
      return new THREE.ShapeGeometry(shape);
    });

    // Green areas
    const greenGeos = mapData.greenAreas.map((area) => {
      const shape = new THREE.Shape();
      area.points.forEach((p, i) => {
        if (i === 0) shape.moveTo(p[0], p[1]);
        else shape.lineTo(p[0], p[1]);
      });
      return new THREE.ShapeGeometry(shape);
    });

    return { geometry: geo, waterGeometries: waterGeos, greenGeometries: greenGeos };
  }, [mapData]);

  return (
    <group>
      {/* Main terrain */}
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial vertexColors side={THREE.DoubleSide} flatShading />
      </mesh>

      {/* Water surfaces */}
      {waterGeometries.map((geo, i) => (
        <mesh key={`water-${i}`} geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.5, 0]} receiveShadow>
          <meshStandardMaterial
            color="#1a5276"
            transparent
            opacity={0.7}
            emissive="#0e2f44"
            emissiveIntensity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Green / forest areas */}
      {greenGeometries.map((geo, i) => (
        <mesh key={`green-${i}`} geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.5, 0]} receiveShadow>
          <meshStandardMaterial color="#2d5016" side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}
