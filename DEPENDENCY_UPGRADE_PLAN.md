# Dependency Upgrade Plan (2026-03-21)

## What was updated safely now

Ran `npm update` to apply non-breaking upgrades allowed by existing semver ranges in `package.json`.
This refreshed `package-lock.json` to the latest compatible patch/minor versions.

## Remaining outdated packages

These are still behind because upgrading requires major-version changes (or paired ecosystem upgrades):

- `react` / `react-dom`: 18.3.1 -> 19.2.4
- `@types/react` / `@types/react-dom`: 18.x -> 19.x
- `vite`: 5.4.21 -> 8.0.1
- `@vitejs/plugin-react`: 4.7.0 -> 6.0.1
- `vitest`: 1.6.1 -> 4.1.0
- `jsdom`: 24.1.3 -> 29.0.1
- `tailwindcss`: 3.4.19 -> 4.2.2
- `@testing-library/react`: 14.3.1 -> 16.3.2
- `@testing-library/dom`: 9.3.4 -> 10.4.1
- `@types/node`: 20.19.37 -> 25.5.0

## Safe phased upgrade proposal

1. **Security-first tooling upgrade (medium risk)**
   - Upgrade `vite`, `@vitejs/plugin-react`, and `vitest` together.
   - Reason: current `npm audit` findings trace to `vite` -> `esbuild`; fix path requires a Vite major upgrade.
   - Validation: `npm run build`, full `npm test`, and local API route checks.

2. **React platform upgrade (medium/high risk)**
   - Upgrade `react`, `react-dom`, `@types/react`, `@types/react-dom`, and `@testing-library/react`.
   - Validation: full unit/integration tests plus manual verification of modal flows and dashboard rendering.

3. **Styling system upgrade (high risk)**
   - Upgrade `tailwindcss` from v3 to v4.
   - Expect config/content syntax changes; schedule separately after app behavior is stable on newer React/Vite.

4. **Runtime/test environment upgrades (low/medium risk)**
   - Upgrade `jsdom`, `@types/node`, and `@testing-library/dom`.
   - Validation: run test suite and TypeScript compile checks.

## Suggested command sequence

```bash
# Phase 1
npm install -D vite@latest @vitejs/plugin-react@latest vitest@latest
npm run build && npm run test -- --run

# Phase 2
npm install react@latest react-dom@latest
npm install -D @types/react@latest @types/react-dom@latest @testing-library/react@latest
npm run build && npm run test -- --run

# Phase 3
npm install -D tailwindcss@latest
npm run build && npm run test -- --run

# Phase 4
npm install -D jsdom@latest @types/node@latest @testing-library/dom@latest
npm run build && npm run test -- --run
```
