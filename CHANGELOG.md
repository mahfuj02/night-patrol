# Changelog

All notable changes are documented here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/).

## [Unreleased]

### Added

- Zod content schemas and typed content for profile, projects, skills, experience, stops, radio and the community note, with cross-reference validation
- `/simple` page: hero, projects, skills, experience and education, community note, contact and resume link
- Page metadata, canonical URL, Open Graph tags, `sitemap.xml`, `robots.txt` and Person JSON-LD
- Playwright and axe tests for `/simple`
- Lighthouse CI workflow (not a required check yet)
- `docs/content-guide.md`
- Route control points in `src/content/route.ts`, validated against the stops
- 3D drive on `/`: road and snowbanks along a curve, placeholder car, chase camera, scroll/wheel/touch/keyboard input with a stop magnet
- Drive controls (Prev / Next stop, simple-view link, live stop announcement)
- WebGL fallback to the simple view, reduced-motion stepping between stops, quality tiers with adaptive resolution
- Dev-only performance overlay (fps, draw calls, triangles)

- Lighting and weather zones in `src/content/atmosphere.ts` (Exchange, Downtown, Shelter, Avenue, Forks, Sunrise) with smooth blending as `t` changes
- Zone-driven sky (overcast glow, clear night with a big moon, sunrise), fog, ambient light and moonlight
- Instanced streetlights in three types (sodium, cool LED, warm) with halos and light pools; car headlights
- GPU snowfall: one draw call, depth layers, wind and gusts, flakes that brighten in lamp and headlight cones; 14k / 7k / 2.5k flakes by quality tier
- `?quality=high|medium|low` URL override that pins the quality tier and disables adaptation
- CC0 textures (Poly Haven asphalt snow, snow, factory brick) with a conversion script and a dev-only preview page, and the world palette

- Rut-mask road (asphalt_snow in the wheel ruts, snow_02 on ridges and edges), snow ground and lumpy snowbanks with world-space two-scale snow so marks never repeat
- Bare elm silhouettes along the road, placed by a per-zone `trees` density, with a procedural branch texture

### Changed

- The painted centre line is gone: lane markings are buried under snow

- Content data files are plain typed data; `src/content/index.ts` validates them. Keeps zod out of the client bundle.
- Stop `t` values now match the route curve

## [0.0.1] - TBD

### Added

- Next.js App Router + TypeScript strict + Tailwind + pnpm scaffold
- ESLint, Prettier, Husky, lint-staged, commitlint
- Vitest + Testing Library, Playwright + axe smoke test
- GitHub Actions CI, PR/issue templates, Dependabot
