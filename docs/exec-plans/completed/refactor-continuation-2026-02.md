# Refactor Continuation (2026-02)

Status: completed
Date: 2026-02-25

## Objective

Continue the big-bang refactor to achieve a clean compile and tree aligned with the target architecture (`src/main` + `src/preload` + `src/renderer` + `src/shared`).

## Outcome Summary

1. **Config alignment**: Updated `vitest.config.ts`, `tsconfig.node.json`, `tailwind.config.ts` to match migrated layout; fixed `src/env.d.ts` ChatAttachment import path.
2. **Shared contract consolidation**: Centralized tool protocol types in `src/shared/tools/` (browser, terminal, file-patch); removed duplicated renderer copies; added `src/shared/ipc/channels.ts` for canonical IPC channel names.
3. **Tree cleanup**: Removed empty legacy root folders (`src/constants`, `src/lib`, `src/mocks`, `src/types`, `src/utils`); moved route composition into `src/renderer/app/routes/`.
4. **Documentation parity**: Updated `ARCHITECTURE.md`, `docs/FRONTEND.md`, `docs/SECURITY.md`, `docs/references/design-system-reference-llms.txt` to reflect current paths.

## Verification Gates

- `npm run build` – Passes (TypeScript + Vite build)
- `npm run test` – 55 passed, 4 failed (pre-existing in `browser-screenshot-prune.test.ts`)
- `npm run lint` – Fails (no ESLint config; see TD-010)
- `npm run dev` – Runtime smoke (Ask + Agent flows) – manual verification recommended

## Follow-ups (captured in tech-debt-tracker)

- TD-009: Fix browser-screenshot-prune test expectations
- TD-010: Add ESLint configuration
