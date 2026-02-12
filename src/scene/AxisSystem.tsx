import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import axisFontUrl from 'three/examples/fonts/ttf/kenpixel.ttf?url';

interface AxisSystemProps {
  bounds: {
    tau: [number, number];
    mu1: [number, number];
    mu2: [number, number];
  };
}

function formatTick(value: number): string {
  return Math.abs(value) < 10 ? value.toFixed(1) : value.toFixed(0);
}

function generateTicks(min: number, max: number, count: number): number[] {
  const ticks: number[] = [];
  const step = (max - min) / (count - 1);
  for (let i = 0; i < count; i++) {
    ticks.push(min + step * i);
  }
  return ticks;
}

export function AxisSystem({ bounds }: AxisSystemProps) {
  const gridHelper = useMemo(() => {
    const grid = new THREE.GridHelper(10, 10, '#334155', '#1e293b');
    grid.position.set(5, 0, 5);
    return grid;
  }, []);

  const tauTicks = generateTicks(bounds.tau[0], bounds.tau[1], 5);
  const mu1Ticks = generateTicks(bounds.mu1[0], bounds.mu1[1], 5);
  const mu2Ticks = generateTicks(bounds.mu2[0], bounds.mu2[1], 5);

  return (
    <>
      <primitive object={gridHelper} />

      {/* X axis (τ) */}
      <group>
        <mesh position={[5, 0, 0]}>
          <boxGeometry args={[10, 0.02, 0.02]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        <Text
          position={[5, -0.6, -0.5]}
          fontSize={0.4}
          color="#ef4444"
          anchorX="center"
          font={axisFontUrl}
        >
          τ
        </Text>
        {tauTicks.map((val, i) => {
          const x = ((val - bounds.tau[0]) / (bounds.tau[1] - bounds.tau[0])) * 10;
          return (
            <Text
              key={`sx-${i}`}
              position={[x, -0.3, -0.2]}
              fontSize={0.25}
              color="#94a3b8"
              anchorX="center"
              font={axisFontUrl}
            >
              {formatTick(val)}
            </Text>
          );
        })}
      </group>

      {/* Y axis (μ₁) */}
      <group>
        <mesh position={[0, 5, 0]}>
          <boxGeometry args={[0.02, 10, 0.02]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
        <Text
          position={[-0.8, 5, 0]}
          fontSize={0.4}
          color="#22c55e"
          anchorX="center"
          rotation={[0, 0, Math.PI / 2]}
          font={axisFontUrl}
        >
          μ1
        </Text>
        {mu1Ticks.map((val, i) => {
          const y = ((val - bounds.mu1[0]) / (bounds.mu1[1] - bounds.mu1[0])) * 10;
          return (
            <Text
              key={`iy-${i}`}
              position={[-0.4, y, 0]}
              fontSize={0.25}
              color="#94a3b8"
              anchorX="right"
              font={axisFontUrl}
            >
              {formatTick(val)}
            </Text>
          );
        })}
      </group>

      {/* Z axis (μ₂) */}
      <group>
        <mesh position={[0, 0, 5]}>
          <boxGeometry args={[0.02, 0.02, 10]} />
          <meshBasicMaterial color="#3b82f6" />
        </mesh>
        <Text
          position={[0, -0.6, 5]}
          fontSize={0.4}
          color="#3b82f6"
          anchorX="center"
          font={axisFontUrl}
        >
          μ2
        </Text>
        {mu2Ticks.map((val, i) => {
          const z = ((val - bounds.mu2[0]) / (bounds.mu2[1] - bounds.mu2[0])) * 10;
          return (
            <Text
              key={`sz-${i}`}
              position={[-0.3, -0.3, z]}
              fontSize={0.25}
              color="#94a3b8"
              anchorX="right"
              font={axisFontUrl}
            >
              {formatTick(val)}
            </Text>
          );
        })}
      </group>
    </>
  );
}
