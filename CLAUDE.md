# CLAUDE.md — Night Patrol (3D Portfolio)

Standing instructions for Claude Code in this repo. Read this and `PROJECT_PLAN.md` at the start of every session.

## Project in one line
A scroll-driven 3D night drive through low-poly winter Winnipeg. Each stop is a chapter of Mahfuj's career. Full spec: `PROJECT_PLAN.md`.

## How to work with me
- **Plan first.** Before writing code for a task, list the files you'll create/change and the approach. Wait for my OK on anything larger than a small fix.
- **One vertical slice per branch.** Never build multiple phases on one branch. Branch names: `feat/pN-name`, `fix/...`, `chore/...`, `docs/...`, `perf/...`.
- **Never commit directly to `main`.** Work on the branch, I open the PR.
- **Small Conventional Commits** (`feat(scene): ...`, `fix(ui): ...`, `test(lib): ...`). commitlint enforces this.
- **Finish each task by:** running `pnpm typecheck && pnpm lint && pnpm test && pnpm build`, reporting results, and writing a PR description (what, why, screenshots needed, perf note, a11y note).
- If something in the plan seems wrong or a better approach exists, say so before implementing.
- Don't invent facts about me or my projects. Use `src/content/*` and mark anything unverified `// TODO(content): verify`.

## Commands
```
pnpm dev            # local dev
pnpm build          # production build
pnpm typecheck      # tsc --noEmit
pnpm lint           # eslint
pnpm format         # prettier --write
pnpm test           # vitest
pnpm test:e2e       # playwright
pnpm models:optimize  # gltf-transform pipeline for public/models
```

## Hard rules
1. **3D isolation:** `three`, `@react-three/*`, `postprocessing` may only be imported under `src/scene/`. Load the scene with `next/dynamic` and `ssr: false`. Never import 3D code in `app/layout.tsx` or shared UI.
2. **Content-driven:** no user-facing copy hardcoded in scene or UI components. All text, links, skills, stops, and radio lines come from `src/content/*` and are validated by zod schemas.
3. **HTML for reading:** panels, HUD text, mini-map, patrol log, tooltips are DOM elements (Tailwind), not 3D text. They must be keyboard focusable with visible focus.
4. **`/simple` must always work** and contain all content. It is the SEO page and the fallback.
5. **Reduced motion:** respect `prefers-reduced-motion` in every new animation (fades/cuts instead of continuous motion).
6. **Sound off by default.** Never autoplay audio. Caption every radio line.
7. **Performance budgets** (see PROJECT_PLAN §5.5): < 150 draw calls, < 300k triangles, 3D JS chunk ≤ 450 KB gz. Use `InstancedMesh` for repeated objects. Report draw calls/triangles when a PR touches the scene.
8. **Original assets only.** No downloaded models of recognizable templates. Primitive blockouts are fine until Phase 10. Audio must be original or CC0 with credit in README.
9. **Warming shelter stop:** no human figures, no sad music, no dramatic effects. Warm lit windows, a quiet captioned line, and resource links only.
10. **No logos or trademarks** of real organizations (Winnipeg Transit, Jets, etc.) in models or textures. Landmarks are stylized silhouettes.
11. **Browser storage** (localStorage) only for sound/quality preferences, always wrapped in try/catch.
12. **No secrets in the repo.** Use `.env.example` if env vars are ever needed.

## Code style
- TypeScript strict, `noUncheckedIndexedAccess`. No `any` without a justifying comment.
- Function components, named exports, one component per file, folder per feature (`Component/index.ts`, `Component.tsx`, `Component.test.tsx`).
- 3D components receive data via props; state via Zustand stores in `src/store/`.
- Math/route helpers go in `src/lib/` and must have unit tests.
- Dispose manually created three.js resources; prefer Drei-managed ones.
- No `console.log` in commits; use `src/lib/logger.ts` (dev only).

## Testing expectations
- New `src/lib`, `src/store`, `src/content`, `src/ui` code ships with tests (≥ 80% coverage there).
- New UI interactions get a Testing Library test for mouse + keyboard.
- User-visible flows get a Playwright test. Run axe on new pages/panels.

## Palette (use these tokens, defined in Tailwind config and a shared `src/lib/palette.ts`)
night `#0B1426`, night-2 `#14233F`, snow `#E8EEF5`, street `#FFB25C`, hud `#4FE3E3`, brick `#8A4B3A`, sunrise `#FF8A5B` → `#FFD27A`.

## Definition of done
CI green · budgets respected · keyboard + reduced motion checked · content from `src/content` · tests updated · docs updated · PR description ready.
