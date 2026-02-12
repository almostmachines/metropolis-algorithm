# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `npm run dev` (Vite, serves at http://localhost:5173)
- **Build:** `npm run build` (runs `tsc -b && vite build`, output in `dist/`)
- **Lint:** `npm run lint` (ESLint)
- **Test:** `npm test` (bundles engine/state modules with esbuild into `tests/.tmp/`, then runs with Node's built-in test runner: `node --test tests/calculations.test.cjs`)

## Architecture

Interactive 3D visualization of Metropolis-Hastings MCMC applied to Bayesian change-point detection over a 24-hour period. The sampled parameters are `tau`, `mu1`, and `mu2`, with known observation noise `sigma` fixed in the likelihood (editable in UI config). React + TypeScript + Vite, with react-three-fiber for 3D and Tailwind CSS v4.

### Layer separation

The codebase enforces a strict separation between pure computation and rendering:

- **`src/engine/`** — Pure math functions with zero React/DOM dependencies. `model.ts` computes change-point log-likelihood/prior/posterior. `metropolis.ts` handles proposals, acceptance probability, and single MH steps. `random.ts` provides Box-Muller normal sampling. `data-generator.ts` creates synthetic timestamped observations.
- **`src/state/`** — A `useReducer` state machine (`algorithm-state.ts`) drives the entire algorithm. The reducer is pure (except `Math.random()` calls in ACCEPT/AUTO_STEP). Phase transitions: `IDLE → PROPOSAL_SHOWN → RESULT_SHOWN → ... → COMPLETED`, with `AUTO_RUNNING` as a parallel auto-step mode.
- **`src/scene/`** — react-three-fiber components for 3D visualization. `scene-math.ts` normalizes `tau`, `mu1`, and `mu2` to a 0-10 coordinate space via dynamic bounds computed from all samples. `PointCloud.tsx` uses `InstancedMesh` for performance.
- **`src/ui/`** — React control panel components (buttons, inputs, status, progress, results plot).
- **`src/config/sanitize.ts`** — Clamps and validates all user-provided config values before they reach the engine.

### Key types

`src/types.ts` defines `Params` (`tau`/`mu1`/`mu2`), `DataPoint` (`time`/`value`), prior configs (`PriorMuMeans`, `PriorMuStds`), `AlgorithmConfig`, and `DEFAULT_CONFIG`. `src/state/types.ts` defines `AlgorithmState`, `Phase`, and `AlgorithmAction`.

### Data flow

`App.tsx` holds `AlgorithmConfig` in `useState` and `AlgorithmState` in `useReducer`. Config changes auto-trigger a reset. The auto-step loop uses `requestAnimationFrame` with batches of 5 samples per frame. Config is sanitized at state initialization time, not on every dispatch.

## Testing

Tests are in `tests/calculations.test.cjs` (CommonJS). They test engine functions and reducer logic, including acceptance-ratio edge cases, config sanitization (tau bounds, prior means/stds, known sigma), and prior wiring behavior. The test pipeline bundles source files with esbuild before running since the source is ESM TypeScript. Add new test cases to the existing file following the `node:test` / `node:assert/strict` pattern.
