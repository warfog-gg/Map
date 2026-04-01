import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { PALETTE } from '../types';

/** Seeded random for consistent tree/rock placement */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function Environment() {
  return (
    <>
      <Ground />
      <Water />
      <Trees />
      <Rocks />
      <Sky />
    </>
  );
}

/** Large ground plane with grass texture */
function Ground() {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.05, 0]} receiveShadow>
      <circleGeometry args={[35, 64]} />
      <meshLambertMaterial color={PALETTE.grass} />
    </mesh>
  );
}

/** Simple animated water plane */
function Water() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = -0.12 + Math.sin(clock.elapsedTime * 0.8) * 0.02;
    }
  });

  return (
    <mesh ref={ref} rotation-x={-Math.PI / 2} position={[18, -0.12, 0]} receiveShadow>
      <circleGeometry args={[14, 48]} />
      <meshLambertMaterial color={PALETTE.water} transparent opacity={0.7} />
    </mesh>
  );
}

/** Procedural trees scattered around the grid */
function Trees() {
  const trees = useMemo(() => {
    const rng = seeded(123);
    const result: { x: number; z: number; scale: number; type: 'oak' | 'pine' }[] = [];

    for (let i = 0; i < 80; i++) {
      const angle = rng() * Math.PI * 2;
      const dist = 14 + rng() * 18;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const scale = 0.6 + rng() * 0.8;
      const type = rng() > 0.4 ? 'oak' : 'pine';
      result.push({ x, z, scale, type });
    }
    // Some trees closer but not in center grid area
    for (let i = 0; i < 30; i++) {
      const angle = rng() * Math.PI * 2;
      const dist = 10 + rng() * 5;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const scale = 0.5 + rng() * 0.6;
      const type = rng() > 0.3 ? 'oak' : 'pine';
      result.push({ x, z, scale, type });
    }
    return result;
  }, []);

  return (
    <group>
      {trees.map((t, i) =>
        t.type === 'oak' ? (
          <OakTree key={i} position={[t.x, 0, t.z]} scale={t.scale} />
        ) : (
          <PineTree key={i} position={[t.x, 0, t.z]} scale={t.scale} />
        )
      )}
    </group>
  );
}

function OakTree({ position, scale }: { position: [number, number, number]; scale: number }) {
  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, 2, 6]} />
        <meshLambertMaterial color={PALETTE.treeTrunk} />
      </mesh>
      {/* Canopy - layered spheres */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <sphereGeometry args={[1.1, 8, 6]} />
        <meshLambertMaterial color={PALETTE.treeLeaf} />
      </mesh>
      <mesh position={[0.4, 2.8, 0.3]} castShadow>
        <sphereGeometry args={[0.8, 7, 5]} />
        <meshLambertMaterial color={PALETTE.treeLeafLt} />
      </mesh>
      <mesh position={[-0.3, 2.3, -0.2]} castShadow>
        <sphereGeometry args={[0.7, 7, 5]} />
        <meshLambertMaterial color={PALETTE.treeLeaf} />
      </mesh>
    </group>
  );
}

function PineTree({ position, scale }: { position: [number, number, number]; scale: number }) {
  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.14, 2.4, 6]} />
        <meshLambertMaterial color={PALETTE.treeTrunk} />
      </mesh>
      {/* Pine layers */}
      <mesh position={[0, 2.0, 0]} castShadow>
        <coneGeometry args={[0.9, 1.4, 7]} />
        <meshLambertMaterial color={PALETTE.treePine} />
      </mesh>
      <mesh position={[0, 2.8, 0]} castShadow>
        <coneGeometry args={[0.7, 1.2, 7]} />
        <meshLambertMaterial color={PALETTE.treePine} />
      </mesh>
      <mesh position={[0, 3.5, 0]} castShadow>
        <coneGeometry args={[0.45, 1.0, 6]} />
        <meshLambertMaterial color={PALETTE.treePine} />
      </mesh>
    </group>
  );
}

/** Small rocks for detail */
function Rocks() {
  const rocks = useMemo(() => {
    const rng = seeded(777);
    const result: { x: number; z: number; s: number; ry: number }[] = [];
    for (let i = 0; i < 25; i++) {
      const angle = rng() * Math.PI * 2;
      const dist = 11 + rng() * 20;
      result.push({
        x: Math.cos(angle) * dist,
        z: Math.sin(angle) * dist,
        s: 0.15 + rng() * 0.35,
        ry: rng() * Math.PI,
      });
    }
    return result;
  }, []);

  return (
    <group>
      {rocks.map((r, i) => (
        <mesh key={i} position={[r.x, r.s * 0.3, r.z]} rotation-y={r.ry} castShadow receiveShadow>
          <dodecahedronGeometry args={[r.s, 0]} />
          <meshLambertMaterial color="#7A7A72" />
        </mesh>
      ))}
    </group>
  );
}

/** Gradient sky dome */
function Sky() {
  const skyMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor: { value: new THREE.Color(PALETTE.skyTop) },
        bottomColor: { value: new THREE.Color(PALETTE.fog) },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(h, 0.0)), 1.0);
        }
      `,
    });
  }, []);

  return (
    <mesh material={skyMat}>
      <sphereGeometry args={[80, 32, 16]} />
    </mesh>
  );
}
