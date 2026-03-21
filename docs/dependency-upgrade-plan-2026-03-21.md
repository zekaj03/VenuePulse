# Dependency Upgrade Scan (2026-03-21)

## Scope and method
- Command used: `npm outdated --long`
- Goal: identify **safe upgrades** (no major-version jump) and separate them from majors that should be scheduled/tested separately.

## Safe upgrades to apply now (patch/minor only)

These are low-risk updates where `Wanted` and `Latest` are in the same major line.

| Package | Current | Wanted | Latest | Risk | Notes |
|---|---:|---:|---:|---|---|
| `@capacitor/cli` | 8.0.2 | 8.2.0 | 8.2.0 | Low | Keep Capacitor packages aligned on the same version. |
| `@capacitor/core` | 8.0.2 | 8.2.0 | 8.2.0 | Low | Upgrade with `@capacitor/ios` + CLI together. |
| `@capacitor/ios` | 8.0.2 | 8.2.0 | 8.2.0 | Low | Run iOS sync after upgrade. |
| `@revenuecat/purchases-capacitor` | 12.1.1 | 12.3.0 | 12.3.0 | Low | Minor update in same major. |
| `@types/node` | 20.19.25 | 20.19.37 | 25.5.0 | Low (to 20.19.37) | Stay on Node 20 type line for now. |
| `@types/react` | 18.3.27 | 18.3.28 | 19.2.14 | Low (to 18.3.28) | Keep aligned with React 18 runtime. |
| `@upstash/redis` | 1.36.2 | 1.37.0 | 1.37.0 | Low | Patch/minor safe update. |
| `autoprefixer` | 10.4.19 | 10.4.27 | 10.4.27 | Low | Standard patch update. |
| `postcss` | 8.4.38 | 8.5.8 | 8.5.8 | Low | Standard minor update. |
| `stripe` | 20.3.1 | 20.4.1 | 20.4.1 | Low | Minor SDK update. |
| `tailwindcss` | 3.4.3 | 3.4.19 | 4.2.2 | Low (to 3.4.19) | Avoid v4 jump in same pass. |
| `typescript` | 5.8.3 | 5.9.3 | 5.9.3 | Medium-Low | Minor update; run full typecheck/tests. |

## Defer (major upgrades)

These are likely to require code/config migration and should be done in dedicated PRs.

- `react` / `react-dom`: 18.x -> 19.x
- `@types/react` / `@types/react-dom`: 18.x -> 19.x (pair with React 19 migration)
- `@testing-library/dom`: 9.x -> 10.x
- `@testing-library/react`: 14.x -> 16.x
- `@vitejs/plugin-react`: 4.x -> 6.x
- `vite`: 5.x -> 8.x
- `vitest`: 1.x -> 4.x
- `jsdom`: 24.x -> 29.x
- `tailwindcss`: 3.x -> 4.x

## Recommended rollout plan

1. **PR 1 (safe bump only)**
   - Apply all same-major upgrades listed above.
   - Commands:
     ```bash
     npm install @capacitor/cli@^8.2.0 @capacitor/core@^8.2.0 @capacitor/ios@^8.2.0 @revenuecat/purchases-capacitor@^12.3.0 @types/node@^20.19.37 @types/react@^18.3.28 @upstash/redis@^1.37.0 autoprefixer@^10.4.27 postcss@^8.5.8 stripe@^20.4.1 tailwindcss@^3.4.19 typescript@^5.9.3
     npm run test
     npm run build
     npm run ios:sync
     ```

2. **PR 2+ (major migrations, one stack at a time)**
   - `vite` + `@vitejs/plugin-react` + `vitest` + `jsdom`
   - `react` + type packages + testing-library
   - `tailwindcss` v4 migration

## Why this is considered safe
- Same-major upgrades generally preserve API compatibility.
- Toolchain majors are intentionally separated because they often bundle breaking config/runtime changes.
- Keeping Capacitor packages at the same version avoids plugin/platform skew.
