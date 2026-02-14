import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { PointCloud } from './PointCloud';
import { TrueMode } from './TrueMode';
import { CurrentHypothesis } from './CurrentHypothesis';
import { ProposalPoint } from './ProposalPoint';
import { AxisSystem } from './AxisSystem';
import { Legend } from './Legend';
import type { AlgorithmState } from '../state/types';
import { useMemo } from 'react';
import { computeBounds, paramsToPosition } from './scene-math';

interface SceneRootProps {
  state: AlgorithmState;
}

export function SceneRoot({ state }: SceneRootProps) {
  const bounds = useMemo(() => computeBounds(state), [state]);

  return (
    <div className="relative min-h-[60vh] md:min-h-0 md:flex-1">
      <Canvas
        camera={{ position: [-5, 5, 20], fov: 50, near: 0.1, far: 200 }}
        style={{ background: '#0f172a' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 10]} intensity={0.8} />
        <pointLight position={[-10, -10, -10]} intensity={0.3} />

        <AxisSystem bounds={bounds} />

        <PointCloud
          burnInSamples={state.burnInSamples}
          acceptedSamples={state.acceptedSamples}
          maxBurnIn={state.config.burnInSamples}
          maxAccepted={state.config.totalSamples}
          bounds={bounds}
        />

        <TrueMode
          position={paramsToPosition(state.config.trueParams, bounds)}
        />

        <CurrentHypothesis
          position={paramsToPosition(state.currentParams, bounds)}
        />

        {state.proposedParams && (
          <ProposalPoint
            proposalPosition={paramsToPosition(state.proposedParams, bounds)}
            currentPosition={paramsToPosition(state.currentParams, bounds)}
          />
        )}

        <OrbitControls
          enableDamping
          dampingFactor={0.1}
          target={[5, 5, 5]}
          minDistance={5}
          maxDistance={50}
        />
      </Canvas>

      <Legend />
    </div>
  );
}
