# Night Patrol

A cinematic, scroll-driven 3D night drive through a low-poly winter Winnipeg. Each stop on the patrol route is a chapter of Mahfuj's career. Full spec: [PROJECT_PLAN.md](PROJECT_PLAN.md).

> **Status:** Phase 1 (content layer and simple view). `/simple` is a complete HTML portfolio; there is no 3D yet. Content is edited in `src/content/` (see [docs/content-guide.md](docs/content-guide.md)).

<!-- TODO: screenshot or GIF -->
<!-- TODO: live link once the domain is decided -->

## Tech stack

Next.js (App Router), TypeScript (strict), Tailwind CSS, pnpm. Planned: three.js / React Three Fiber, Zustand, GSAP, Howler. Tests: Vitest, Testing Library, Playwright, axe.

## Local setup

Requires Node 24 (see `.nvmrc`) and pnpm 12.

```bash
pnpm install
pnpm dev
```

## Scripts

| Command                | What it does                                     |
| ---------------------- | ------------------------------------------------ |
| `pnpm dev`             | Local dev server                                 |
| `pnpm build`           | Production build                                 |
| `pnpm typecheck`       | `tsc --noEmit`                                   |
| `pnpm lint`            | ESLint                                           |
| `pnpm format`          | Prettier (write)                                 |
| `pnpm test`            | Vitest unit and component tests                  |
| `pnpm test:coverage`   | Vitest with coverage thresholds                  |
| `pnpm test:e2e`        | Playwright (needs `pnpm build` first)            |
| `pnpm models:optimize` | glTF optimisation pipeline (stub until Phase 10) |

## Deployment

Hosted on Vercel with a preview deploy per PR. See [docs/vercel-setup.md](docs/vercel-setup.md).

## Credits

Audio credits will be listed here (Phase 9). All models and textures are original.

## License

[MIT](LICENSE)
