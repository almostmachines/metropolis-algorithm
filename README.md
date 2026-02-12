# Metropolis Algorithm Change-Point Explorer

An interactive 3D visualization of the Metropolis algorithm applied to Bayesian change-point detection. The app estimates when a process changed over a 24-hour period, plus the mean level before and after the change.

## What it does

The app fits a change-point model with three unknown parameters:

- **τ**: the change time (hours in `[0, 24]`)
- **μ₁**: mean observation level before the change
- **μ₂**: mean observation level after the change

Observation noise **sigma is known and fixed** during sampling (but editable in settings).

You can run the sampler step-by-step:

1. A white proposal point appears with a line to the current state
2. The control panel shows log posterior ratio and acceptance probability
3. Click **Accept** to run the Metropolis accept/reject draw
4. Repeat or switch to full auto mode

**Full Auto** runs batches of steps every animation frame until the target sample count is reached.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Controls

| Control | Action |
|---------|--------|
| **Next Step** | Generate a proposal and display it |
| **Accept (X%)** | Run the accept/reject decision |
| **Full Auto** | Run all remaining samples automatically |
| **Stop** | Pause auto mode |
| **Reset** | Generate new data and restart from scratch |
| **Click + drag** | Rotate the 3D view |
| **Scroll** | Zoom in/out |
| **Right-click + drag** | Pan |

All settings are editable while the algorithm is idle.

## 3D scene legend

| Marker | Meaning |
|--------|---------|
| Gold octahedron | True values `(τ, μ₁, μ₂)` |
| Cyan sphere | Current chain position |
| White sphere + line | Pending proposal |
| Blue dots | Accepted samples (early) |
| Purple dots | Accepted samples (late) |
| Gray dots | Burn-in samples |

The accepted-sample gradient shows chain progression over time.

## Statistical model

- **Data generation**: `time_i ~ Uniform(0, 24)` and
  - if `time_i < τ`: `y_i ~ Normal(μ₁, knownSigma)`
  - else: `y_i ~ Normal(μ₂, knownSigma)`
- **Likelihood**: product of normal densities, evaluated in log-space
- **Prior**:
  - `τ ~ Uniform(0, 24)`
  - `μ₁ ~ Normal(priorMean₁, priorStd₁)`
  - `μ₂ ~ Normal(priorMean₂, priorStd₂)`
- **Proposal**: symmetric normal perturbation with configurable widths for `τ`, `μ₁`, `μ₂`
- **Acceptance**: `alpha = min(1, exp(log_posterior_proposed - log_posterior_current))`

## Project structure

```text
src/
  engine/
    random.ts              # Box-Muller normal sampling
    data-generator.ts      # Synthetic change-point observations
    model.ts               # logLikelihood, logPrior, logPosterior
    metropolis.ts          # propose, acceptanceProbability, step

  state/
    types.ts               # State shape and actions
    algorithm-state.ts     # useReducer state machine

  scene/
    SceneRoot.tsx          # Canvas, camera, lighting, controls
    PointCloud.tsx         # InstancedMesh sample cloud
    AxisSystem.tsx         # 3D axes for τ, μ₁, μ₂
    TrueMode.tsx           # Gold marker at true values
    CurrentHypothesis.tsx  # Cyan current state marker
    ProposalPoint.tsx      # White proposal marker + connecting line
    Legend.tsx             # Scene legend overlay

  ui/
    ControlPanel.tsx
    StepControls.tsx
    ParameterInputs.tsx
    StatusDisplay.tsx
    ProgressBar.tsx
    ResultsDisplay.tsx

  config/
    sanitize.ts            # Input/config sanitization
```

## Built with

- [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org) + [Vite](https://vite.dev)
- [react-three-fiber](https://r3f.docs.pmnd.rs) + [@react-three/drei](https://drei.docs.pmnd.rs)
- [Tailwind CSS v4](https://tailwindcss.com)

## License

[MIT](LICENSE)
