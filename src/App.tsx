import { useReducer, useCallback, useRef, useEffect, useState } from 'react';
import { SceneRoot } from './scene/SceneRoot';
import { ControlPanel } from './ui/ControlPanel';
import {
  algorithmReducer,
  createInitialState,
} from './state/algorithm-state';
import { DEFAULT_CONFIG } from './types';
import type { AlgorithmConfig } from './types';

export default function App() {
  const [config, setConfig] = useState<AlgorithmConfig>(DEFAULT_CONFIG);
  const [state, dispatch] = useReducer(
    algorithmReducer,
    DEFAULT_CONFIG,
    createInitialState,
  );

  const autoRef = useRef<number | null>(null);

  const stopAuto = useCallback(() => {
    if (autoRef.current !== null) {
      cancelAnimationFrame(autoRef.current);
      autoRef.current = null;
    }
    dispatch({ type: 'STOP_AUTO' });
  }, []);

  const startAuto = useCallback(() => {
    dispatch({ type: 'START_AUTO' });
  }, []);

  // Auto-step loop
  useEffect(() => {
    if (state.phase !== 'AUTO_RUNNING') {
      if (autoRef.current !== null) {
        cancelAnimationFrame(autoRef.current);
        autoRef.current = null;
      }
      return;
    }

    const tick = () => {
      dispatch({ type: 'AUTO_STEP' });
      autoRef.current = requestAnimationFrame(tick);
    };
    autoRef.current = requestAnimationFrame(tick);

    return () => {
      if (autoRef.current !== null) {
        cancelAnimationFrame(autoRef.current);
        autoRef.current = null;
      }
    };
  }, [state.phase]);

  const handleReset = useCallback(() => {
    if (autoRef.current !== null) {
      cancelAnimationFrame(autoRef.current);
      autoRef.current = null;
    }
    dispatch({ type: 'RESET', config });
  }, [config]);

  // Auto-reset when config changes
  const configRef = useRef(config);
  useEffect(() => {
    if (configRef.current !== config) {
      configRef.current = config;
      handleReset();
    }
  }, [config, handleReset]);

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      <header className="shrink-0 px-4 py-3 border-b border-slate-700 bg-slate-800/50">
        <h1 className="text-lg font-bold text-slate-100">
          Metropolis Algorithm: Bayesian Change-Point Detection
        </h1>
        <p className="text-xs text-slate-500">
          Change-point model: τ, μ₁, μ₂ (known observation sigma)
        </p>
      </header>

      <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-y-auto md:overflow-hidden">
        <SceneRoot state={state} />
        <ControlPanel
          state={state}
          config={config}
          onConfigChange={setConfig}
          onNextStep={() => dispatch({ type: 'NEXT_STEP' })}
          onAccept={() => dispatch({ type: 'ACCEPT' })}
          onStartAuto={startAuto}
          onStopAuto={stopAuto}
          onReset={handleReset}
        />
      </div>
    </div>
  );
}
