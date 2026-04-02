import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Environment } from './Environment';
import { GridCells } from './GridCells';
import { Buildings } from './Buildings';
import type { GridState } from '../types';

interface SceneProps {
  grid: GridState;
  onTap: (worldX: number, worldZ: number) => void;
}

export function Scene({ grid, onTap }: SceneProps) {
  return (
    <Canvas
      camera={{ position: [12, 14, 12], fov: 45, near: 0.1, far: 200 }}
      shadows
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <ambientLight intensity={0.4} color="#FFF5E0" />
      <directionalLight
        position={[15, 20, 10]}
        intensity={1.2}
        color="#FFF0D0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-camera-near={0.1}
        shadow-camera-far={60}
        shadow-bias={-0.001}
      />
      <directionalLight position={[-8, 10, -5]} intensity={0.3} color="#8AB4F8" />
      <hemisphereLight args={['#87CEEB', '#4A7A2E', 0.3]} />
      <fog attach="fog" args={['#C8DFF0', 30, 60]} />

      <Environment />
      <GridCells grid={grid} onTap={onTap} />
      <Buildings grid={grid} />

      <OrbitControls
        makeDefault
        enablePan
        enableZoom
        enableRotate
        minDistance={5}
        maxDistance={40}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={0.3}
        target={[0, 0, 0]}
        enableDamping
        dampingFactor={0.08}
      />
    </Canvas>
  );
}
