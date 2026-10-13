# Night Patrol — 3D Portfolio of Mahfuj

> A cinematic, scroll-driven night drive through a stylized-realistic winter Winnipeg. Each stop on the patrol route is a chapter of Mahfuj's career: projects, skills, education, achievements, contact.

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
- Photorealism. Style is "stylized realistic": believable light, atmosphere and materials on simplified shapes (see `docs/art-reference.md`).
- Downloaded or purchased third-party **models**, and anything copied from reference photos. Models are original (procedural or hand-modelled). The only third-party assets allowed are **CC0 PBR textures** (Poly Haven, ambientCG) and CC0 audio, credited in the README.
- A CMS. Content lives in typed TypeScript files.

---

## 2. Experience design

### 2.1 Story
Winter night in Winnipeg. Snow is falling. The visitor rides along on Mahfuj's patrol, "Unit 02". Dispatch radio narrates. The route runs from the Exchange District through downtown to The Forks, and the shift ends at sunrise.

### 2.2 The route (stops in order)

| # | Stop | Landmark (stylized, recognizable by silhouette) | Content |
|---|------|------------------------------------------------|---------|
| 0 | **Ignition** | Car dashboard, dark | Loading screen. Fuel gauge = load %. "Start Patrol" button. "Skip to simple view" link. |
| 1 | **Dispatch** | Car pulls out onto a snowy Exchange District street | Name, role, one-line pitch on windshield HUD. Radio: "Unit 02, Mahfuj, Full Stack Developer, starting patrol." |
| 2 | **RRC Polytechnic, Exchange District Campus** | Glass curtain wall with a dark mullion grid, a printed-heritage-facade glass panel, "RRC Polytechnic" rooftop letters (no logo), cream limestone and red-brick neighbours; the glass glows from inside. Details in `docs/art-reference.md` | Education: Diploma, Red River College Polytechnic. Sprint-Innovation 2025 teaser. |
| 3 | **Exchange District warehouses** | Old brick warehouses, painted "ghost sign" style murals | **EventFlow** checkpoint (marquee-style sign on a venue) |
| 4 | **City services building** | Civic building with a "311" sign | **CivicTrack** checkpoint |
| 5 | **Portage & Main** | Wide intersection, tall towers, wind-blown snow | **RoleReady** checkpoint (office tower, one lit window = interview in progress). Radio joke about the wind. |
| 6 | **Dashcam moment** | Overlay on the visitor's own view | **Safe Drive AI** checkpoint: dashcam UI switches on, detection boxes appear on road objects |
| 7 | **Arcade / corner shop** | Neon-lit storefront | **Akari puzzle game** checkpoint |
| 8 | **Building under inspection** | Scanner beam sweeping floors | **Site audit extension** checkpoint |
| 9 | **Warming shelter** | Warm-lit windows, no people depicted | Quiet, honest note about people sleeping out downtown in −30°. Links to Siloam Mission, Main Street Project, Winnipeg Harvest. No sad music, no figures. |
| 10 | **Canadian Museum for Human Rights + Esplanade Riel** | Glass Tower of Hope lit, cable-stayed bridge spire glowing | Sprint-Innovation 2025 trophy landmark |
| 11 | **The Forks: End of shift** | Market building, frozen river skating trail with lights, sunrise | Radio: "Shift complete." Contact: email, GitHub, LinkedIn, resume PDF, link back to mahfuj.dev |

**Distant skyline elements** (always visible, cheap billboards or simple silhouettes): Golden Boy on the Legislative Building, downtown towers, Esplanade Riel spire.

**Ambient life:** a generic city bus (no logos or livery), parked cars buried in snow with block heater cords, snowbanks, bare elms arching over streets, back-lane details (wooden power poles with wires, bins, fences, garages), streetlights, occasional passing car headlights.

**Setting by stretch:** the Exchange District is brick warehouses and low-rises; downtown and Portage & Main are towers; from the warming shelter through the avenue to the Human Rights Museum and Esplanade Riel the route runs through a **residential Winnipeg neighbourhood** (houses, garages, back lanes with wooden power poles and wires, city bins) under the elm tunnel. Cross streets branch off at intersections, with traffic lights at the corners, so it feels like a city grid; the car never leaves the route.

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
- The car follows the route and **never steers freely**. It also **never drives backwards**: when the travel direction reverses, it makes a smooth U-turn and drives back in the opposite lane facing forward (Canada drives on the right), and the camera stays behind it in the direction of travel (Phase 8).

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
Full style guide: **`docs/art-reference.md`** (written from reference photos in `design/reference/`, which are git-ignored and never committed, shipped or used as textures).

- **Style:** stylized realistic winter night. Believable lighting, atmosphere and materials on simplified shapes. The look comes from light, haze, snowfall and emissive windows, not from polygon count.
- **Roads and ground:** packed snow and slush with dark tyre ruts, never clean asphalt. Soft, dirty snowbanks. Dull specular, no mirror reflections.
- **Lighting:** cool white LED cobra-head lamps on avenues, warm sodium orange downtown, visible halos around lamps. Signals have yellow housings.
- **Sky:** overcast city glow (grey-green or orange-tinged) for snowy sections; deep blue with a low moon for one clear stretch; peach and gold at sunrise.
- **Trees:** bare elms arching over streets as near-black silhouettes (instanced).
- **Buildings:** procedural and instanced: varied towers downtown, brick low-rises in the Exchange District. A single window shader draws an emissive grid with random lit/unlit windows in warm and cool tones, so there is no texture per building.
- **Materials:** PBR from **CC0 textures only** (Poly Haven, ambientCG), credited in the README. Hand-modelled detail only for real Winnipeg landmarks. No purchased or downloaded city models.
- **Atmosphere:** heavy snowfall (small flakes plus a few large soft near-camera discs), haze and fog tinted by the local light.
- **Palette:** the **UI palette** is unchanged (HUD, panels, CSS tokens): night `#0B1426`, night-2 `#14233F`, snow `#E8EEF5`, street `#FFB25C`, hud `#4FE3E3`, brick `#8A4B3A`, sunrise `#FF8A5B` → `#FFD27A`. The **world palette** (sky, lamps, glass, brick, limestone, snow and slush, sign accents) is sampled from the photos and listed in `docs/art-reference.md`; it lives in `src/lib/palette.ts` under `world`.
- **Quality tiers:** `high` and `medium` use PBR maps (colour, normal, roughness; 1024², brick 512²). `low` uses 512² **colour maps only** (no normal or roughness maps; a constant roughness), reduces buildings, trees and flakes, and disables bloom. Same §5.5 budgets in every tier.
- **Post-processing:** bloom (lights only), vignette, subtle film grain, light fog.
- **Typography (HUD/panels):** one monospace for radio/log (e.g. JetBrains Mono), one clean sans for panels (e.g. Inter). Self-hosted via `next/font`.
- **The car:** the owner's own white 2019 Honda Civic sedan, modified (amber roof light bar, tinted windows, black rims, subtle cyan underglow), with no manufacturer logos or badges. Details in Phase 10.
- **No logos or trademarks.** The owner's own school, employers and projects may appear as plain lettering (the RRC rooftop reads "RRC Polytechnic", the experience office sign reads "LIILAB · Sylhet, Bangladesh"), with no logo, crest or brand mark; other signage is generic.

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
| Buildings and props | Procedural geometry in code, instanced (`InstancedMesh`); no per-building textures |
| Shaders | Custom window shader (emissive grid, hash-based lit/unlit and warm/cool) via `onBeforeCompile` or `ShaderMaterial`; lamp halo and snow sprites |
| Models | Blender → GLB for real Winnipeg landmarks only, Draco + meshopt via gltf-transform |
| Textures | CC0 PBR sets (Poly Haven, ambientCG), WebP, tiled and shared. Maps that matter at night only: colour, normal, roughness (no displacement or AO unless they visibly help). 1024² for `high`/`medium` (brick 512²), plus 512² colour-only versions for `low`. Initial picks: `asphalt_snow` (road), `snow_02` (ground and banks), `factory_brick` (brick) |
| Audio | Howler.js (lazy-loaded only when sound is enabled) |
| Perf tooling | Dev-only overlay (Drei `Stats` + renderer draw calls and triangles), Drei `PerformanceMonitor` for adaptive quality. (`r3f-perf` was dropped: it targets fiber 8 / React 18 and crashes the Turbopack dev server.) |
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
│  ├─ models/        # compressed .glb (real landmarks only)
│  ├─ textures/      # CC0 PBR sets + CREDITS.md (source, licence)
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
│  │  ├─ Road/              # path curve, road mesh (packed snow, ruts), snowbanks
│  │  ├─ Car/               # car model, headlights, wipers, dashboard
│  │  ├─ Buildings/         # procedural instanced towers and low-rises, window shader
│  │  ├─ Materials/         # PBR material sets per quality tier, shared shaders
│  │  ├─ Landmarks/         # one component per landmark (hand-modelled detail)
│  │  ├─ Environment/       # sky, fog, snow particles, streetlights, elm trees (instanced)
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
├─ design/
│  └─ reference/            # reference photos: git-ignored, never committed or shipped
├─ docs/
│  └─ art-reference.md      # style guide and sampled palette
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
- **Quality tiers:** `high | medium | low` chosen by Drei `PerformanceMonitor` + device hints. Low disables post FX, uses 512² colour-only texture maps (it must not download normal or roughness maps or the 1024² sets), reduces buildings, trees and snow particles, lowers DPR.
- **Fallback:** no WebGL or reduced-motion preference → show prompt offering simple view (reduced motion: auto-switch to gentle camera cuts instead of continuous motion).
- **Instancing:** streetlights, trees, snowbanks, buildings, props (bins, poles, fences), snow particles use `InstancedMesh`. Windows are drawn by the shader, not geometry.
- **Procedural buildings:** a few shape variants (tower, slab, brick low-rise) placed along the route from a seeded generator (deterministic, so identical on every load). One shared window material, parameterised per instance. Placement stays clear of the road and the camera path.
- **Materials per tier:** one `Materials` module returns the material set for the current tier, so components never branch on tier themselves.
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
| PBR textures (`high`/`medium`) | ≤ 3 MB of that total (target about 2 MB), each ≤ 1024², shared across the scene. The total is reported in each PR that changes textures |
| `low` tier textures | 512² colour maps only, ≤ 0.5 MB total; downloads no normal or roughness maps |
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
- `docs/art-reference.md`: style guide and sampled world palette (reference photos stay local in `design/reference/`).

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
- Placeholder car (primitives), follows `t`, oriented to tangent
- Scroll / keys / swipe → damped `t`; CameraRig chase camera
- Stop "magnet" easing; unit tests for route math
- Dev-only stats overlay (fps, draw calls, triangles)
- **Done when:** scrolling smoothly drives the car end to end at 60 fps on desktop.

### Phase 3: Night mood and materials  → `v0.3.0`
Style guide: `docs/art-reference.md`. Two branches, merged in order:

**3a. Branch `feat/p3-night-mood`**
- Sky per section: overcast city glow (grey-green, grey-brown, orange-tinged), one clear deep-blue stretch with a low moon, tinted fog that follows the route
- Instanced streetlights in three types (cool LED cobra-head, warm sodium, lantern) with halo sprites + bloom; car headlights (spot lights, shadows off or baked)
- Snow: small flakes plus a few large soft near-camera discs; count scales with quality tier
- Road and ground: packed snow and slush with dark tyre ruts, rounded dirty snowbanks, CC0 PBR maps on `high`/`medium` and 512² colour-only maps on `low`
- Bare elm silhouettes arching over streets (instanced)
- Vignette, grain (windshield and wipers move to Phase 6, with the interior view)
- World palette added to `src/lib/palette.ts`; CC0 texture credits in README and `public/textures/CREDITS.md`
- Reduced-motion variants
- **Done when:** the scene feels like a winter night in Winnipeg with no buildings yet. Perf budgets met in every tier.

**3b. Branch `feat/p3-buildings`**

**Decision:** the stretch from the warming shelter through the avenue to the Human Rights Museum and Esplanade Riel is a **residential Winnipeg neighbourhood** under the elm tunnel. Downtown stays towers; the Exchange District stays brick warehouses and low-rises.

- **First commit of this branch: the lane offset.** The car, the chase camera and everything placed along the road (lamps, tree rows, the snow ridge, buildings) are positioned relative to correct lanes. The car drives in the **right-hand lane** (Canada drives on the right) instead of on the centre line, and the road's ruts line up with the lane the car uses. This lands before any buildings so nothing has to be re-placed later; Phase 8 then reuses it for the opposite lane in the U-turn.
- **Intersections anchored to stops:** intersections in `src/content/route.ts` are anchored to a stop plus an offset in metres, so they can sit between stops. The list is agreed with the owner before it is built.
- Procedural, instanced buildings by stretch:
  - Exchange District: brick warehouses and low-rises
  - Downtown and Portage & Main: varied towers
  - Shelter and avenue: houses (gabled and flat-roofed, snow on the roofs) and detached garages, set back behind the tree rows
- Window shader: emissive grid, random lit/unlit windows, warm and cool tones, no texture per building. Houses show a few warm windows; the shelter stop shows warm windows only (rule 9: no figures).
- Back lanes (instanced) behind the houses: wooden power poles with wires, city bins, fences and garages, seen between the houses
- **Cross streets at intersections:** roads branching off the route into the distance, with traffic lights (yellow-housed signals on mast arms) at the corners, so it reads as a city grid. The car never leaves the route. Intersections come from `intersections` in `src/content/route.ts`; the snow ridge and tree rows already break at each one. The residential stretch gets its own intersections (the owner adds them there).
- `low` tier: fewer buildings and houses, fewer back-lane props, colour-only 512² maps
- If this branch grows too large for one reviewable PR, split the cross streets and traffic lights into a `feat/p3-streets` branch.
- **Done when:** the route is lined with believable buildings and houses that glow at night, with cross streets and traffic lights at the intersections, within budgets, with no landmarks yet.

### Phase 4: First checkpoint end to end (RRC Exchange District)  → `v0.4.0`
Branch: `feat/p4-checkpoint-rrc`
- `Landmark` base pattern (light-up animation, bounding focus)
- RRC Exchange District Campus landmark (stylized blockout following docs/art-reference.md)
- CheckpointPanel (DOM) with slide in/out tied to `t`, focus management, Esc to close
- HUD subtitles with dispatch line
- Component tests for panel; E2E: scroll to stop → panel visible
- **Done when:** the full checkpoint pattern works for one stop and is documented in `docs/adding-a-stop.md`.

### Phase 5: All stops  → `v0.5.0`
One branch per stop or small group, e.g. `feat/p5-stop-exchange-eventflow`, `feat/p5-stop-civictrack`, `feat/p5-stop-portage-main-roleready`, `feat/p5-stop-dashcam-safedrive`, `feat/p5-stop-arcade-akari`, `feat/p5-stop-inspection-extension`, `feat/p5-stop-warming-shelter`, `feat/p5-stop-cmhr-esplanade`
- Each landmark as a stylized blockout first (silhouette recognizable, glowing windows), detail later
- Safe Drive AI dashcam overlay (DOM/canvas overlay with bounding boxes on scene objects)
- Warming shelter: warm windows, no figures, quiet radio line, resource links
- Distant skyline: Golden Boy, towers
- **Done when:** every stop in §2.2 is reachable and shows its panel.

### Phase 6: Dashboard skills + patrol log  → `v0.6.0`
Branch: `feat/p6-dashboard-patrol-log`
- Interior dashboard view (camera can glance down, or HUD overlay of dashboard). The cabin matches the owner's car (see Phase 10): dark, tinted glass, amber light bar glow on the roof lining
- Windshield and wiper animation (needs the interior view; moved here from Phase 3). Wipers respect reduced motion (static, or a single slow wipe)
- Gauges/switches/indicators/presets from `skills.ts`, hover/focus tooltips
- PatrolLog panel with experience entries
- Bangladesh flag + coffee cup props
- **Done when:** skills and experience are fully explorable by mouse, touch, and keyboard.

### Phase 7: Ignition + end of shift  → `v0.7.0`
Branch: `feat/p7-ignition-sunrise`
- LoadingScreen: fuel gauge progress from Drei `useProgress`, Start Patrol, Skip to simple view
- The Forks landmark: market building, frozen river skating trail with lights
- **Roundabout at The Forks**, at the end of the route. The car loops it for the "end of shift / start new patrol" moment, with the camera following behind. Under reduced motion the loop is a cut or a short fade, not a continuous circle. The route curve and the `the-forks` stop are reshaped around it. **After the loop the experience resets to stop 1** with a short fade and a captioned dispatch line, "New patrol starting." (a new line in `src/content/radio.ts`). Scrolling back mid-route does not reset: it uses the Phase 8 U-turn.
- Sunrise sky transition driven by `t` near the end
- Contact panel, resume download, link to mahfuj.dev
- **Done when:** the experience has a full beginning and ending.

### Phase 8: Navigation polish  → `v0.8.0`
Branch: `feat/p8-minimap-mobile`
- MiniMap with stop list, current position, click/tap to jump (eased)
- Mobile controls: swipe + Next/Prev buttons, safe-area insets
- **Direction changes:** when the travel direction reverses (Prev, a mini-map jump back, scrolling back), the car makes a smooth U-turn and drives back in the opposite lane **facing forward** (Canada drives on the right). It never drives backwards. The camera follows behind the car in the direction of travel. This reuses the lane offset from Phase 3b (each direction uses its right-hand lane) and adds a U-turn path across the road, and an eased camera handover. Under reduced motion the car cuts to the opposite lane instead of turning continuously. The lane and U-turn math lives in `src/lib` with unit tests.
- Keyboard shortcuts overlay (`?`)
- E2E for mini-map and keyboard
- **Done when:** any stop is ≤ 2 clicks from anywhere on any device.

### Phase 9: Sound  → `v0.9.0`
Branch: `feat/p9-sound`
- SoundToggle (off by default, persisted)
- Howler lazy-loaded; engine hum, tires on snow, wipers, radio blips
- Original or properly licensed CC0 audio only; credits in README
- **Done when:** sound adds atmosphere and never autoplays.

### Phase 10: Art pass (hand-modelled landmarks)  → `v0.10.0`
Branches: `feat/p10-models-<name>`
- Replace landmark blockouts with original hand-modelled detail (each real Winnipeg landmark, the car). Procedural buildings and props stay procedural. No purchased or downloaded models.
- **The car** is the owner's own white 2019 Honda Civic sedan (10th generation), modified: amber roof light bar, tinted windows, black rims, subtle cyan underglow. Original hand-modelled, with **no Honda logos, badges or other manufacturer marks**. The licence plate reads "MAHFUJ02" on a stylized plate that is not a copy of the official Manitoba plate; the plate text comes from `src/content` (`profile.ts`), not from the scene code. Until this phase the placeholder car is a simple white sedan shape. The Phase 6 interior matches it.
- `scripts/optimize-models.mjs` (gltf-transform: dedup, weld, draco/meshopt, resize textures)
- Consistent world palette; small shared texture atlases only where needed
- **Done when:** visual quality is final and budgets still pass in every tier.

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
Read docs/art-reference.md. Start Phase 3a on feat/p3-night-mood: sky and fog per section, instanced
streetlights with halos and bloom, headlights, two-layer snowfall, packed-snow road with ruts and CC0 PBR maps
(512² colour-only maps on the low tier), elm silhouettes, vignette and grain (wipers are Phase 6), plus reduced-motion variants.
Then Phase 3b on feat/p3-buildings: procedural instanced buildings with the window shader.
Show me the plan first. Report draw calls, triangles and texture sizes per quality tier versus §5.5 budgets.
```

**Phase 4**
```
Start Phase 4 on feat/p4-checkpoint-rrc. Build the reusable Landmark pattern, the RRC Polytechnic
Exchange District Campus landmark (stylized blockout following docs/art-reference.md), the DOM CheckpointPanel with focus management,
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
- [x] CC0 texture sets: `asphalt_snow`, `snow_02`, `factory_brick` (Poly Haven; licence re-checked on each asset page at download; fall back to ambientCG Snow012/Snow014 or other Poly Haven bricks if tiling shows a seam)
- [ ] Initial JS budget on `/`: the Next/React runtime alone is about 132 KB gz, so the 120 KB budget in §5.5 cannot be met; proposal is "runtime baseline + 15 KB"
- [ ] Wording of the sign text at The Forks (our own lettering, content-driven), if shown at all
- [x] After the roundabout loop at The Forks the experience resets to stop 1 with a short fade and the dispatch line "New patrol starting."; scrolling back mid-route still uses the Phase 8 U-turn
- [x] Lane offset: done at the start of Phase 3b, before buildings; the car drives in the right-hand lane
- [x] Licence plate "MAHFUJ02" is fine (it is the owner's public GitHub username); the text is stored in `src/content/profile.ts` (`plate`)
- [ ] Intersections in `src/content/route.ts`: a list is proposed (Princess St at the RRC campus, Portage & Main, three in the residential stretch) and needs the owner's OK before it is built
