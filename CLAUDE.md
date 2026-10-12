# CLAUDE.md — Night Patrol (3D Portfolio)

Standing instructions for Claude Code in this repo. Read this and `PROJECT_PLAN.md` at the start of every session.

## Project in one line
A scroll-driven 3D night drive through stylized-realistic winter Winnipeg. Each stop is a chapter of Mahfuj's career. Full spec: `PROJECT_PLAN.md`.

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
7. **Performance budgets** (see PROJECT_PLAN §5.5): < 150 draw calls, < 300k triangles, 3D JS chunk ≤ 450 KB gz. Use `InstancedMesh` for repeated objects (buildings, trees, lamps, props). Report draw calls/triangles when a PR touches the scene, per quality tier. The `low` tier drops PBR maps (and downloads none) and reduces buildings, trees and snow.
8. **Original models, CC0 textures and audio only.** Models are original: procedural geometry, or hand-modelled detail for real Winnipeg landmarks. No purchased or downloaded city or building models. The only third-party assets allowed are CC0: PBR textures from Poly Haven or ambientCG, and CC0 audio. Check the CC0 licence on each asset's page before adding it, and credit every one in the README (name, source URL, licence). Primitive blockouts are fine until Phase 10.
9. **Warming shelter stop:** no human figures, no sad music, no dramatic effects. Warm lit windows, a quiet captioned line, and resource links only.
10. **No logos or trademarks** of real organizations (Winnipeg Transit, Jets, Canada Life, etc.) in models, textures or signage. Landmarks are stylized silhouettes. The RRC campus rooftop text reads "RRC Polytechnic", with no college logo, banner or crest. Buses and signs stay generic.
11. **Browser storage** (localStorage) only for sound/quality preferences, always wrapped in try/catch.
12. **No secrets in the repo.** Use `.env.example` if env vars are ever needed.
13. **Reference photos are reference only.** `design/reference/` is git-ignored. Never commit, ship, trace, or use them as textures, including crops, edits or colour-graded copies. Never reproduce logos or signage lettering from them. The written summary is `docs/art-reference.md`.

## Art direction
Stylized realistic winter night, not low-poly. Read `docs/art-reference.md` before any scene work.
- The look comes from light and atmosphere (lamp halos, heavy snowfall, haze, emissive windows), not from polygon count.
- Roads are packed snow and slush with dark tyre ruts, never clean asphalt.
- Lamps: cool white LED cobra-heads on avenues, warm sodium downtown, with halos.
- Bare elms, buildings and back-lane props are instanced. Buildings are procedural; windows come from one shader (emissive grid, random lit/unlit, warm and cool), with no texture per building.
- PBR maps are CC0 only and tiered: none on `low`.
- Warming shelter stop: warm windows only, no people, no drama (rule 9 still applies).

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
**UI palette** (HUD, panels, Tailwind tokens; unchanged): night `#0B1426`, night-2 `#14233F`, snow `#E8EEF5`, street `#FFB25C`, hud `#4FE3E3`, brick `#8A4B3A`, sunrise `#FF8A5B` → `#FFD27A`.

**World palette** (3D scene only): sampled from the reference photos and listed in `docs/art-reference.md`. Scene code takes colours from `src/lib/palette.ts` (`world` group), never inline hex values.

## Definition of done
CI green · budgets respected · keyboard + reduced motion checked · content from `src/content` · tests updated · docs updated · PR description ready.
