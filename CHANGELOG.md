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

### Changed

- Content data files are plain typed data; `src/content/index.ts` validates them. Keeps zod out of the client bundle.
- Stop `t` values now match the route curve

## [0.0.1] - TBD

### Added

- Next.js App Router + TypeScript strict + Tailwind + pnpm scaffold
- ESLint, Prettier, Husky, lint-staged, commitlint
- Vitest + Testing Library, Playwright + axe smoke test
- GitHub Actions CI, PR/issue templates, Dependabot
