# Night Patrol — 3D Portfolio of Mahfuj

> A cinematic, scroll-driven night drive through a low-poly winter Winnipeg. Each stop on the patrol route is a chapter of Mahfuj's career: projects, skills, education, achievements, contact.

- **Owner:** Mahfuj (Full Stack Web Developer, Winnipeg MB)
- **Repo:** `github.com/mahfuj02/night-patrol` (rename if preferred)
- **Domain:** `TBD` (separate domain; main resume site stays at mahfuj.dev and links here)
- **Hosting:** Vercel
- **Workflow:** Claude Code in VS Code, guided by `CLAUDE.md` + this file, one vertical slice per feature branch

---

## 1. Goals and non-goals

### Goals
1. Unforgettable, original 3D experience that is clearly Mahfuj's own story (night patrol + Winnipeg + career).
2. A recruiter can reach any project, the resume, and contact info in **≤ 2 clicks** (mini-map + simple view).
3. Smooth on a mid-range phone: **≥ 50 fps target on desktop, ≥ 30 fps on mid-range mobile**.
4. Accessible: full HTML "simple view", keyboard navigation, `prefers-reduced-motion` support.
5. Production-grade repo: typed, linted, tested, CI on every PR, conventional commits, documented.

### Non-goals
- Free-roam driving / physics steering (the car follows a fixed path).
- Photorealism. Style is low-poly, flat-shaded, stylized.
- Downloaded third-party models of recognizable portfolio templates. **Everything original.**
- A CMS. Content lives in typed TypeScript files.

---

## 2. Experience design

### 2.1 Story
Winter night in Winnipeg. Snow is falling. The visitor rides along on Mahfuj's patrol, "Unit 02". Dispatch radio narrates. The route runs from the Exchange District through downtown to The Forks, and the shift ends at sunrise.

### 2.2 The route (stops in order)

| # | Stop | Landmark (low-poly, recognizable by silhouette) | Content |
|---|------|------------------------------------------------|---------|
| 0 | **Ignition** | Car dashboard, dark | Loading screen. Fuel gauge = load %. "Start Patrol" button. "Skip to simple view" link. |
| 1 | **Dispatch** | Car pulls out onto a snowy Exchange District street | Name, role, one-line pitch on windshield HUD. Radio: "Unit 02, Mahfuj, Full Stack Developer, starting patrol." |
| 2 | **RRC Polytechnic, Exchange District Campus** | Brick heritage facade + modern glass (Roblin Centre style), lit windows | Education: Diploma, Red River College Polytechnic. Sprint-Innovation 2025 teaser. |
| 3 | **Exchange District warehouses** | Old brick warehouses, painted "ghost sign" style murals | **EventFlow** checkpoint (marquee-style sign on a venue) |
| 4 | **City services building** | Civic building with a "311" sign | **CivicTrack** checkpoint |
| 5 | **Portage & Main** | Wide intersection, tall towers, wind-blown snow | **RoleReady** checkpoint (office tower, one lit window = interview in progress). Radio joke about the wind. |
| 6 | **Dashcam moment** | Overlay on the visitor's own view | **Safe Drive AI** checkpoint: dashcam UI switches on, detection boxes appear on road objects |
| 7 | **Arcade / corner shop** | Neon-lit storefront | **Akari puzzle game** checkpoint |
| 8 | **Building under inspection** | Scanner beam sweeping floors | **Site audit extension** checkpoint |
| 9 | **Warming shelter** | Warm-lit windows, no people depicted | Quiet, honest note about people sleeping out downtown in −30°. Links to Siloam Mission, Main Street Project, Winnipeg Harvest. No sad music, no figures. |
| 10 | **Canadian Museum for Human Rights + Esplanade Riel** | Glass Tower of Hope lit, cable-stayed bridge spire glowing | Sprint-Innovation 2025 trophy landmark |
| 11 | **The Forks: End of shift** | Market building, frozen river skating trail with lights, sunrise | Radio: "Shift complete." Contact: email, GitHub, LinkedIn, resume PDF, link back to mahfuj.dev |

**Distant skyline elements** (always visible, cheap billboards or low-poly): Golden Boy on the Legislative Building, downtown towers, Esplanade Riel spire.

**Ambient life:** Winnipeg Transit-style bus (generic, no logos), parked cars with block heater cords, snowbanks, streetlights, occasional passing car headlights.

### 2.3 In-car UI (always available)
- **Dashboard = Skills.** Gauges and indicator lights, each one a skill. Hover/focus shows a tooltip with level and where it was used.
  - TypeScript, Next.js, Node.js, React (gauges)
  - C# / .NET (gauge marked "learning", needle rising)
  - C / C++ ("engine" indicator, embedded side)
  - SQL, Prisma, MongoDB, Firebase, Vue, Angular (switch row)
  - AI tooling: Gemini, Groq/Whisper, Claude (radio presets)
- **Patrol log = Experience.** Clipboard on the passenger seat. Opens an HTML panel with timestamped log entries:
  - LIILAB (Bangladesh): Junior Software Engineer, team lead bridging backend and WordPress teams
  - Red River College Polytechnic: Diploma
  - Sprint-Innovation 2025: Winner (Canada Life, Tech Manitoba, RRC)
  - Current roles (owner decides what to include)
- **Personal props:** small Bangladesh flag on the dash, coffee cup in the holder.

### 2.4 Navigation
- **Desktop:** scroll wheel / trackpad / arrow keys / PageUp-PageDown drive forward and back along the path. Space = next stop.
- **Mobile:** vertical swipe + large "Next stop ›" / "‹ Prev" buttons.
- **Mini-map (GPS):** bottom corner, lists every stop. Click/tap jumps the car there (eased camera move). Keyboard focusable.
- **Simple view:** `/simple` route (and top-corner link) renders all content as a normal fast HTML page. Also the automatic fallback when WebGL is unavailable or the device is too weak.
- Car **never** steers freely.

### 2.5 Checkpoint behaviour
1. Car approaches → decelerates (scroll progress eases).
2. Landmark lights up (emissive ramp + bloom).
3. HTML info panel slides in (DOM, not 3D text, for readability and accessibility): title, one-line summary, problem/what I built, tech stack chips, links (Live / GitHub / Case study), 1–3 screenshots.
4. Scroll on → panel slides out, car accelerates.

### 2.6 Sound
- **Off by default.** Speaker toggle in HUD; preference saved in localStorage (wrapped in try/catch).
- Layers: engine idle hum, tire-on-snow, wiper swish, radio static + short dispatch blips.
- Radio lines are **text first** (subtitles on HUD). Optional voice later.
- No dramatic or sad music at the warming shelter stop. Silence or just wind.

### 2.7 Art direction
- **Style:** low-poly, flat-shaded, slightly toy-like proportions.
- **Palette:**
  - Night sky `#0B1426` → `#14233F`
  - Snow `#E8EEF5`
  - Streetlight warm `#FFB25C`
  - HUD cyan `#4FE3E3`
  - Brick `#8A4B3A`
  - Sunrise `#FF8A5B` → `#FFD27A`
- **Post-processing:** bloom (lights only), vignette, subtle film grain, light fog.
- **Typography (HUD/panels):** one monospace for radio/log (e.g. JetBrains Mono), one clean sans for panels (e.g. Inter). Self-hosted via `next/font`.
- **All models original**, built in Blender (or primitives in code for early phases). No Sketchfab downloads.

---

## 3. Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js (App Router) + TypeScript (strict) |
| 3D | three, @react-three/fiber, @react-three/drei |
| Post FX | @react-three/postprocessing |
| Animation | GSAP (camera/UI tweens) + Drei `ScrollControls` or custom scroll progress |
| State | Zustand (current stop, sound on/off, quality tier, panel open) |
| Styling | Tailwind CSS for HTML UI |
| Models | Blender → GLB, Draco + meshopt compression via gltf-transform |
| Textures | KTX2 / small PNG atlases, mostly vertex colors (low-poly) |
| Audio | Howler.js (lazy-loaded only when sound is enabled) |
| Perf tooling | r3f-perf (dev only), Drei `PerformanceMonitor` for adaptive quality |
| Unit tests | Vitest + Testing Library |
| E2E tests | Playwright (simple view, navigation, mini-map, a11y via @axe-core/playwright) |
| Lint/format | ESLint (next + typescript-eslint), Prettier |
| Git hooks | Husky + lint-staged + commitlint (Conventional Commits) |
| CI | GitHub Actions |
| Perf CI | Lighthouse CI on `/simple` and `/` |
| Hosting | Vercel (preview deploy per PR) |
| Analytics | Vercel Analytics (privacy-friendly), optional |

Package manager: **pnpm**. Node: LTS, pinned in `.nvmrc` and `engines`.

---

## 4. Architecture

### 4.1 Folder structure
```
night-patrol/
├─ .github/
│  ├─ workflows/ci.yml
│  ├─ workflows/lighthouse.yml
│  ├─ ISSUE_TEMPLATE/{bug.yml,feature.yml}
│  ├─ pull_request_template.md
│  └─ dependabot.yml
├─ public/
│  ├─ models/        # compressed .glb
│  ├─ textures/
│  ├─ audio/
│  ├─ images/projects/
│  └─ resume.pdf
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx         # NO three.js imports here
│  │  ├─ page.tsx           # 3D experience entry (dynamic import, ssr:false)
│  │  ├─ simple/page.tsx    # full HTML fallback, SSR, SEO
│  │  └─ opengraph-image.tsx
│  ├─ content/              # single source of truth for all text
│  │  ├─ profile.ts
│  │  ├─ projects.ts
│  │  ├─ skills.ts
│  │  ├─ experience.ts
│  │  ├─ stops.ts           # route order, path position t (0..1), landmark id, content ref
│  │  ├─ radio.ts           # dispatch lines
│  │  └─ schema.ts          # zod schemas + types; validated at build
│  ├─ scene/
│  │  ├─ Experience.tsx     # Canvas, providers, quality tier
│  │  ├─ Road/              # path curve, road mesh, snowbanks
│  │  ├─ Car/               # car model, headlights, wipers, dashboard
│  │  ├─ Landmarks/         # one component per landmark
│  │  ├─ Environment/       # sky, fog, snow particles, streetlights (instanced)
│  │  ├─ Effects/           # postprocessing
│  │  └─ CameraRig.tsx      # follows car along curve, eases into stops
│  ├─ ui/
│  │  ├─ Hud/               # windshield HUD, subtitles
│  │  ├─ CheckpointPanel/
│  │  ├─ PatrolLog/
│  │  ├─ MiniMap/
│  │  ├─ LoadingScreen/
│  │  └─ SoundToggle/
│  ├─ hooks/                # useScrollProgress, useReducedMotion, useQualityTier, useWebGLSupport
│  ├─ store/                # zustand stores
│  ├─ lib/                  # math helpers, curve utils, audio manager
│  └─ styles/
├─ tests/
│  ├─ unit/
│  └─ e2e/
├─ scripts/
│  └─ optimize-models.mjs   # gltf-transform pipeline
├─ CLAUDE.md
├─ PROJECT_PLAN.md
├─ README.md
├─ CHANGELOG.md
├─ CONTRIBUTING.md
└─ LICENSE
```

### 4.2 Key technical decisions
- **Road path:** `CatmullRomCurve3` from control points in `stops.ts`/`lib/route.ts`. Car position = `curve.getPointAt(t)`, rotation from `getTangentAt(t)`.
- **Scroll → t:** normalized progress (0..1), damped (`THREE.MathUtils.damp`) for smoothness. Near a stop's `t`, apply an easing "magnet" so the car settles at checkpoints.
- **Content-driven:** every stop, panel, skill, radio line comes from `src/content/*`. Scene components never hardcode copy. `/simple` and the 3D view read the same data.
- **3D isolation:** three/R3F imported only under `src/scene` and loaded via `next/dynamic` with `ssr: false`. Links to the 3D route use `prefetch={false}` where appropriate.
- **Quality tiers:** `high | medium | low` chosen by Drei `PerformanceMonitor` + device hints. Low disables post FX, reduces snow particles, lowers DPR.
- **Fallback:** no WebGL or reduced-motion preference → show prompt offering simple view (reduced motion: auto-switch to gentle camera cuts instead of continuous motion).
- **Instancing:** streetlights, trees, snowbanks, windows, snow particles use `InstancedMesh`.
- **Draw-call budget:** < 150 draw calls, < 300k triangles total scene.

### 4.3 Content model (sketch)
```ts
// src/content/schema.ts
Project = {
  id: string; name: string; tagline: string;
  problem: string; built: string;          // short paragraphs
  stack: string[]; links: { live?: string; github?: string; caseStudy?: string };
  images: { src: string; alt: string }[];
  stopId: string;
}
Stop = {
  id: string; order: number; t: number;    // 0..1 along path
  title: string; landmark: LandmarkId;
  kind: 'intro' | 'education' | 'project' | 'achievement' | 'community' | 'contact';
  contentRef?: string; radio?: string;
}
Skill = { id: string; name: string; group: 'gauge'|'switch'|'indicator'|'preset'; level: 1|2|3|4|5; note?: string }
```

### 4.4 Initial project content (owner must verify every line before launch)
- **RoleReady:** AI-powered interview prep platform. Next.js full stack, Google Gemini, Groq Whisper (speech-to-text), Prisma + Neon, NextAuth v5. Designed full UI/UX and branding. Live: role-ready-snowy.vercel.app
- **CivicTrack:** 311-style civic service request tracker. C# / .NET, Angular, SQL Server.
- **EventFlow:** scoped ticketing/CRM platform. Vue 3 + TypeScript, Netlify Functions, MongoDB, Firebase, Stripe (test mode). GitHub: mahfuj02/eventflow
- **Safe Drive AI:** dashcam-integrated driving safety app; explored BlackVue, Viofo, AAOS integrations.
- **Akari puzzle game:** logic puzzle (Light Up) game, C++ / web.
- **Site audit extension:** debugger-style browser extension reviewing sites page by page and pointing to files to fix.

> Placeholders are fine during development. Mark unverified copy with `// TODO(content): verify`.

---

## 5. Engineering standards

### 5.1 Git and GitHub
- **Default branch:** `main` (protected: PR required, CI must pass, no force push, linear history).
- **One feature per branch:** `feat/<phase>-<short-name>`, `fix/...`, `chore/...`, `docs/...`, `perf/...`.
- **Conventional Commits** enforced by commitlint: `feat(scene): add road curve`, `fix(ui): panel focus trap`.
- **Small PRs** (one vertical slice). Squash merge. PR template includes: what/why, screenshots or GIF, perf note, a11y note, checklist.
- **Issues:** one issue per phase task; PR closes the issue (`Closes #12`).
- **Milestones:** one per phase below.
- **Labels:** `scene`, `ui`, `content`, `perf`, `a11y`, `infra`, `bug`, `good-first`.
- **Releases:** tag `v0.x.0` at the end of each phase; update `CHANGELOG.md` (Keep a Changelog format).
- **Dependabot:** weekly npm + GitHub Actions updates.
- **Secrets:** none required initially. Never commit `.env*`; provide `.env.example`.

### 5.2 Code quality
- TypeScript `strict: true`, `noUncheckedIndexedAccess: true`. No `any` without a comment explaining why.
- ESLint + Prettier clean before commit (lint-staged).
- Components small and single-purpose; 3D components take data via props, no hardcoded copy.
- Dispose of geometries/materials/textures created manually; prefer Drei/R3F managed resources.
- No `console.log` in committed code (use a tiny dev logger behind `process.env.NODE_ENV`).

### 5.3 Testing
- **Unit (Vitest):** content schema validation, route math (`t` ↔ stop mapping, easing magnet), stores, hooks.
- **Component (Testing Library):** CheckpointPanel, MiniMap, PatrolLog, SoundToggle, keyboard behaviour.
- **E2E (Playwright):** `/simple` renders all content; mini-map jump works; keyboard navigation; axe accessibility scan zero serious violations; WebGL-disabled fallback path.
- Coverage target: **≥ 80% on `src/lib`, `src/content`, `src/store`, `src/ui`** (scene excluded from coverage).

### 5.4 CI (GitHub Actions, on every PR and push to main)
1. Install with pnpm (cached)
2. `pnpm typecheck`
3. `pnpm lint`
4. `pnpm test` (unit + component)
5. `pnpm build`
6. `pnpm test:e2e` (Playwright, against built app)
7. Lighthouse CI (separate workflow) on `/simple` and `/`, budgets below

### 5.5 Performance budgets
| Metric | Budget |
|---|---|
| `/simple` Lighthouse Performance | ≥ 95 |
| `/simple` Accessibility | 100 |
| `/` initial JS (before 3D chunk) | ≤ 120 KB gzipped |
| 3D chunk (JS) | ≤ 450 KB gzipped |
| Total models + textures | ≤ 6 MB, streamed progressively |
| LCP on `/` (loading screen) | ≤ 2.5 s on 4G |
| Draw calls | < 150 |
| Triangles | < 300k |

### 5.6 Accessibility
- All content reachable in `/simple`, semantic HTML, headings in order.
- 3D view: HUD, panels, mini-map, patrol log are DOM elements, keyboard focusable, visible focus styles, ARIA labels.
- `prefers-reduced-motion`: no continuous camera motion, no film grain, snow reduced; instant/fade transitions between stops.
- Colour contrast AA on all text.
- Sound off by default; captions for every radio line.

### 5.7 SEO and sharing
- `/simple` is server-rendered and canonical for content.
- Metadata, Open Graph image (rendered still of the night scene), `sitemap.xml`, `robots.txt`.
- JSON-LD `Person` schema with links to GitHub, LinkedIn, mahfuj.dev.

### 5.8 Documentation
- `README.md`: what it is, screenshot/GIF, live link, tech stack, local setup, scripts, model pipeline, deployment, credits.
- `CONTRIBUTING.md`: branch/commit conventions, how to add a stop or project.
- `docs/adding-a-stop.md`: step-by-step (content entry → landmark component → path `t` → test).
- `docs/model-pipeline.md`: Blender export settings, `pnpm models:optimize`.

---

## 6. Phased build plan

Each phase = one milestone = one or more feature branches, each merged via PR with green CI, then tagged.

### Phase 0: Repo foundation  → `v0.0.1`
Branch: `chore/p0-foundation`
- Next.js + TS strict + Tailwind + pnpm, `.nvmrc`
- ESLint, Prettier, Husky, lint-staged, commitlint
- Vitest + Testing Library, Playwright with one smoke test
- GitHub Actions CI, PR template, issue templates, Dependabot, labels doc
- README skeleton, CONTRIBUTING, CHANGELOG, LICENSE (MIT)
- Vercel project connected, preview deploys working
- **Done when:** empty app deploys, CI green, commit hooks enforce conventions.

### Phase 1: Content layer + simple view  → `v0.1.0`
Branch: `feat/p1-content-simple-view`
- Zod schemas and all `src/content/*` files with initial data (TODO markers where unverified)
- `/simple` page: hero, projects, skills, experience, education, community note, contact, resume download
- SEO metadata, sitemap, robots, JSON-LD
- Unit tests for schemas; E2E + axe on `/simple`; Lighthouse CI live
- **Done when:** a recruiter could use `/simple` as a complete portfolio. Lighthouse ≥ 95 / 100.

### Phase 2: Road, car, scroll drive  → `v0.2.0`
Branch: `feat/p2-road-car-scroll`
- Canvas setup via dynamic import, quality tier store, WebGL support check
- Route curve from control points, road mesh following curve, simple snowbanks
- Placeholder low-poly car (primitives), follows `t`, oriented to tangent
- Scroll / keys / swipe → damped `t`; CameraRig chase camera
- Stop "magnet" easing; unit tests for route math
- r3f-perf in dev
- **Done when:** scrolling smoothly drives the car end to end at 60 fps on desktop.

### Phase 3: Night mood  → `v0.3.0`
Branch: `feat/p3-night-mood`
- Night sky gradient, fog, moon
- Instanced streetlights with warm emissive + bloom; car headlights (spot lights, shadows off or baked)
- Snow particles (instanced / points, count scales with quality tier)
- Windshield + wiper animation; vignette, grain
- Reduced-motion variants
- **Done when:** the scene feels like a winter night in Winnipeg with no landmarks yet. Perf budgets met.

### Phase 4: First checkpoint end to end (RRC Exchange District)  → `v0.4.0`
Branch: `feat/p4-checkpoint-rrc`
- `Landmark` base pattern (light-up animation, bounding focus)
- RRC Exchange District Campus landmark (primitive/low-poly blockout)
- CheckpointPanel (DOM) with slide in/out tied to `t`, focus management, Esc to close
- HUD subtitles with dispatch line
- Component tests for panel; E2E: scroll to stop → panel visible
- **Done when:** the full checkpoint pattern works for one stop and is documented in `docs/adding-a-stop.md`.

### Phase 5: All stops  → `v0.5.0`
One branch per stop or small group, e.g. `feat/p5-stop-exchange-eventflow`, `feat/p5-stop-civictrack`, `feat/p5-stop-portage-main-roleready`, `feat/p5-stop-dashcam-safedrive`, `feat/p5-stop-arcade-akari`, `feat/p5-stop-inspection-extension`, `feat/p5-stop-warming-shelter`, `feat/p5-stop-cmhr-esplanade`
- Each landmark as low-poly blockout first (shape recognizable), detail later
- Safe Drive AI dashcam overlay (DOM/canvas overlay with bounding boxes on scene objects)
- Warming shelter: warm windows, no figures, quiet radio line, resource links
- Distant skyline: Golden Boy, towers
- **Done when:** every stop in §2.2 is reachable and shows its panel.

### Phase 6: Dashboard skills + patrol log  → `v0.6.0`
Branch: `feat/p6-dashboard-patrol-log`
- Interior dashboard view (camera can glance down, or HUD overlay of dashboard)
- Gauges/switches/indicators/presets from `skills.ts`, hover/focus tooltips
- PatrolLog panel with experience entries
- Bangladesh flag + coffee cup props
- **Done when:** skills and experience are fully explorable by mouse, touch, and keyboard.

### Phase 7: Ignition + end of shift  → `v0.7.0`
Branch: `feat/p7-ignition-sunrise`
- LoadingScreen: fuel gauge progress from Drei `useProgress`, Start Patrol, Skip to simple view
- The Forks landmark: market building, frozen river skating trail with lights
- Sunrise sky transition driven by `t` near the end
- Contact panel, resume download, link to mahfuj.dev
- **Done when:** the experience has a full beginning and ending.

### Phase 8: Navigation polish  → `v0.8.0`
Branch: `feat/p8-minimap-mobile`
- MiniMap with stop list, current position, click/tap to jump (eased)
- Mobile controls: swipe + Next/Prev buttons, safe-area insets
- Keyboard shortcuts overlay (`?`)
- E2E for mini-map and keyboard
- **Done when:** any stop is ≤ 2 clicks from anywhere on any device.

### Phase 9: Sound  → `v0.9.0`
Branch: `feat/p9-sound`
- SoundToggle (off by default, persisted)
- Howler lazy-loaded; engine hum, tires on snow, wipers, radio blips
- Original or properly licensed CC0 audio only; credits in README
- **Done when:** sound adds atmosphere and never autoplays.

### Phase 10: Art pass (Blender models)  → `v0.10.0`
Branches: `feat/p10-models-<name>`
- Replace blockouts with original Blender low-poly models (car, each landmark, props)
- `scripts/optimize-models.mjs` (gltf-transform: dedup, weld, draco/meshopt, resize textures)
- Vertex colours / small atlases, consistent palette
- **Done when:** visual quality is final and budgets still pass.

### Phase 11: Performance, a11y, launch  → `v1.0.0`
Branch: `perf/p11-launch-hardening`
- Adaptive quality tuning on real mid-range Android + iPhone
- Final Lighthouse, axe, cross-browser (Chrome, Safari, Firefox, mobile Safari)
- OG image, favicon set, 404 page in theme ("Wrong turn, Unit 02")
- Custom domain on Vercel, HTTPS verified
- Link from mahfuj.dev ("Explore in 3D →")
- Content proofread; remove all `TODO(content)`
- **Done when:** v1.0.0 tagged, deployed to the custom domain, linked from mahfuj.dev.

---

## 7. Definition of done (every PR)
- [ ] CI green (typecheck, lint, unit, build, e2e)
- [ ] No new perf budget regressions (note fps / draw calls in PR)
- [ ] Keyboard + reduced-motion checked for any new UI
- [ ] Content comes from `src/content`, no hardcoded copy in scene
- [ ] Tests added/updated
- [ ] Docs updated if behaviour or workflow changed
- [ ] Screenshot or GIF in PR description

---

## 8. Ready-to-paste prompts for Claude Code

Paste these one at a time, after the previous phase is merged.

**Kickoff (Phase 0)**
```
Read CLAUDE.md and PROJECT_PLAN.md fully. We are starting Phase 0 (Repo foundation).
Create branch chore/p0-foundation. Set up everything listed in Phase 0 and §5 (standards):
Next.js App Router + TypeScript strict + Tailwind + pnpm, ESLint/Prettier, Husky + lint-staged + commitlint,
Vitest + Testing Library, Playwright smoke test, GitHub Actions CI, PR/issue templates, Dependabot,
README/CONTRIBUTING/CHANGELOG/LICENSE skeletons. Commit in small Conventional Commits.
Before writing code, show me the plan of files you will create. Stop when Phase 0's "Done when" is met
and give me the commands to verify locally and the PR description.
```

**Phase 1**
```
Phase 0 is merged. Start Phase 1 on branch feat/p1-content-simple-view per PROJECT_PLAN.md.
Build the zod schemas and src/content files using §4.3 and §4.4 (mark unverified copy with TODO(content)).
Then build /simple as a complete, accessible, SEO-ready portfolio page. Add unit tests for schemas,
Playwright + axe tests for /simple, and Lighthouse CI per §5.5. Show me the plan first.
```

**Phase 2**
```
Start Phase 2 on feat/p2-road-car-scroll. Keep all three/R3F code under src/scene and load it with
next/dynamic ssr:false. Implement the route curve, road mesh, placeholder primitive car following t,
damped scroll/keys/swipe input, chase camera, and the stop "magnet" easing. Unit-test the route math.
Target 60 fps desktop. Show me the plan first, then implement.
```

**Phase 3**
```
Start Phase 3 on feat/p3-night-mood. Add night sky, fog, instanced streetlights with bloom, headlights,
snow particles scaled by quality tier, wipers, vignette and grain, plus reduced-motion variants.
Report draw calls and triangle count at the end versus §5.5 budgets.
```

**Phase 4**
```
Start Phase 4 on feat/p4-checkpoint-rrc. Build the reusable Landmark pattern, the RRC Polytechnic
Exchange District Campus landmark (low-poly blockout), the DOM CheckpointPanel with focus management,
and HUD subtitles. Write docs/adding-a-stop.md describing the exact steps so future stops follow it.
```

**Phase 5 (repeat per stop)**
```
Start feat/p5-stop-<name>. Following docs/adding-a-stop.md, add the <STOP NAME> stop from §2.2
with its landmark blockout and panel content from src/content. Keep the PR to this stop only.
```

**Phases 6–11**
```
Start Phase <N> on branch <branch name> as described in PROJECT_PLAN.md §6. Show me the plan first,
implement in small Conventional Commits, meet the phase's "Done when", run the full CI locally,
then give me the PR description and the release notes for the tag.
```

---

## 9. Open decisions (owner)
- [ ] Final domain name
- [ ] Repo name
- [ ] Which current roles appear in the patrol log
- [ ] Final verified copy for each project (links, screenshots)
- [ ] Voice for radio lines (text only vs recorded)
- [ ] Analytics on/off
