"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, RoundedBox, MeshDistortMaterial } from "@react-three/drei";
import { useRef, useMemo } from "react";
import * as THREE from "three";

/**
 * Random decorative values are generated once at module scope rather than
 * during render, which keeps the components pure (React 19 lint rule:
 * no impure function calls — e.g. Math.random() — in the render phase).
 */

const FLOATING_PARTICLE_COUNT = 40;
const FLOATING_PARTICLE_POSITIONS: Float32Array = (() => {
  const pos = new Float32Array(FLOATING_PARTICLE_COUNT * 3);
  for (let i = 0; i < FLOATING_PARTICLE_COUNT; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 12;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
  }
  return pos;
})();

interface SmallCubeData {
  position: [number, number, number];
  color: string;
  scale: number;
  speed: number;
}

const SMALL_CUBE_DATA: SmallCubeData[] = (() => {
  const colors = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981"];
  return Array.from({ length: 8 }, (_, i) => ({
    position: [
      Math.cos((i / 8) * Math.PI * 2) * 3.2,
      Math.sin((i / 8) * Math.PI * 2) * 1.5,
      (Math.random() - 0.5) * 2,
    ] as [number, number, number],
    color: colors[i % 4],
    scale: 0.15 + Math.random() * 0.1,
    speed: 0.5 + Math.random() * 1.5,
  }));
})();

function CodeCube() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
      meshRef.current.rotation.y += 0.003;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <RoundedBox
        ref={meshRef}
        args={[2.5, 2.5, 2.5]}
        radius={0.15}
        smoothness={8}
      >
        <MeshDistortMaterial
          color="#1e40af"
          attach="material"
          distort={0.15}
          speed={2}
          roughness={0.2}
          metalness={0.8}
          transparent
          opacity={0.85}
        />
      </RoundedBox>
    </Float>
  );
}

function FloatingParticles() {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(
    () => FLOATING_PARTICLE_POSITIONS,
    []
  );

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={FLOATING_PARTICLE_COUNT}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#60a5fa"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

function GlowingRing() {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.x = Math.PI / 2.5;
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <mesh ref={ringRef}>
        <torusGeometry args={[2, 0.02, 16, 100]} />
        <meshStandardMaterial
          color="#3b82f6"
          emissive="#3b82f6"
          emissiveIntensity={0.5}
          transparent
          opacity={0.4}
        />
      </mesh>
    </Float>
  );
}

function SmallCubes() {
  const cubesRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (cubesRef.current) {
      cubesRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <group ref={cubesRef}>
      {SMALL_CUBE_DATA.map((cube, i) => (
        <Float key={i} speed={cube.speed} floatIntensity={0.4}>
          <mesh position={cube.position}>
            <boxGeometry args={[cube.scale, cube.scale, cube.scale]} />
            <meshStandardMaterial
              color={cube.color}
              emissive={cube.color}
              emissiveIntensity={0.3}
              transparent
              opacity={0.7}
              roughness={0.3}
              metalness={0.5}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

export default function HeroScene() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0" style={{ opacity: 0.85 }}>
      <Canvas
        camera={{ position: [0, 0, 7], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} color="#60a5fa" />
        <directionalLight position={[-5, 3, -5]} intensity={0.4} color="#8b5cf6" />
        <pointLight position={[0, -3, 3]} intensity={0.5} color="#06b6d4" />

        <CodeCube />
        <GlowingRing />
        <SmallCubes />
        <FloatingParticles />
      </Canvas>
    </div>
  );
}