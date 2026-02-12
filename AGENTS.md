# Repository Guidelines

## Project Description
Interactive 3D visualization of Metropolis-Hastings MCMC applied to Bayesian change-point detection over a 24-hour period. The model samples `tau`, `mu1`, and `mu2` while using known observation `sigma` in the likelihood. React + TypeScript + Vite, with react-three-fiber for 3D and Tailwind CSS v4.

## Project Structure & Module Organization
Core code lives in `src/` and is split by responsibility:
- `src/engine/`: pure algorithm/math modules (no React imports), including MCMC proposal and posterior calculations.
- `src/state/`: reducer-driven algorithm state and action types.
- `src/scene/`: 3D visualization components (react-three-fiber).
- `src/ui/`: control panel and status components.
- `src/config/`: input/config sanitization.

Tests are in `tests/` (`calculations.test.cjs`). Static assets are in `public/`. Build output is `dist/` (generated; do not edit manually).

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: start Vite dev server at `http://localhost:5173`.
- `npm run build`: type-check (`tsc -b`) and build production assets.
- `npm run preview`: serve the production build locally.
- `npm run lint`: run ESLint across TypeScript/TSX files.
- `npm test` or `npm run test:calculations`: bundle test targets with `esbuild` and run `node --test`.

## Coding Style & Naming Conventions
Use TypeScript with React function components. Follow existing style:
- 2-space indentation, single quotes, and no semicolons.
- Component files use PascalCase (for example, `SceneRoot.tsx`, `ControlPanel.tsx`).
- Non-UI modules use descriptive kebab-case/lowercase names (for example, `metropolis.ts`, `data-generator.ts`).

Keep algorithm logic isolated in `src/engine/` and state transitions in `src/state/` to preserve testability.

## Testing Guidelines
Testing uses Node’s built-in `node:test` with `assert/strict`. Add tests under `tests/*.test.cjs`, following the existing `calculations` pattern. Prioritize deterministic coverage for:
- numeric edge cases (`NaN`, `Infinity`, bounds like tau in `[0,24]`, positive prior stds, known sigma minimum),
- acceptance ratio/probability behavior,
- reducer transitions and config sanitization.

`npm test` writes temporary bundles to `tests/.tmp/`; do not commit that directory.

## Commit & Pull Request Guidelines
Recent history uses concise, imperative commit subjects (for example, `Fix prior beliefs settings are not wired in`). Keep commits focused to one logical change.

For pull requests, include:
- what changed and why,
- how you validated it (`npm run lint`, `npm test`, manual UI checks),
- screenshots/GIFs for UI/3D scene changes,
- linked issue/ticket when applicable.
