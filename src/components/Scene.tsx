import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Environment } from '@react-three/drei';
import type { MapData } from '../types';
import { Terrain } from './Terrain';
import { FantasyBuildings } from './FantasyBuildings';
import { FantasyRoads } from './FantasyRoads';
import { FantasyTrees } from './FantasyTrees';
import { Particles } from './Particles';

interface SceneProps {
  mapData: MapData;
}

export function Scene({ mapData }: SceneProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [200, 150, 200], fov: 50, near: 1, far: 5000 }}
      style={{ width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        <SceneContent mapData={mapData} />
      </Suspense>
    </Canvas>
  );
}

function SceneContent({ mapData }: SceneProps) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} color="#b8a9d4" />
      <directionalLight
        position={[150, 200, 100]}
        intensity={1.2}
        color="#ffe4b5"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={1000}
        shadow-camera-left={-300}
        shadow-camera-right={300}
        shadow-camera-top={300}
        shadow-camera-bottom={-300}
      />
      <directionalLight position={[-100, 50, -100]} intensity={0.3} color="#6a5acd" />

      {/* Sky */}
      <Sky
        distance={450000}
        sunPosition={[100, 50, 100]}
        inclination={0.52}
        azimuth={0.25}
        rayleigh={0.5}
        turbidity={8}
      />

      {/* Fog for atmosphere */}
      <fog attach="fog" args={['#2a1a4a', 100, 800]} />

      {/* Map content */}
      <Terrain mapData={mapData} />
      <FantasyBuildings buildings={mapData.buildings} />
      <FantasyRoads roads={mapData.roads} />
      <FantasyTrees greenAreas={mapData.greenAreas} />
      <Particles count={300} spread={400} />

      {/* Controls */}
      <OrbitControls
        makeDefault
        maxPolarAngle={Math.PI / 2.1}
        minDistance={20}
        maxDistance={600}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
}
