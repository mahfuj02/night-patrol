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

## [0.0.1] - TBD

### Added

- Next.js App Router + TypeScript strict + Tailwind + pnpm scaffold
- ESLint, Prettier, Husky, lint-staged, commitlint
- Vitest + Testing Library, Playwright + axe smoke test
- GitHub Actions CI, PR/issue templates, Dependabot
