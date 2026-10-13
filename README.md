# Night Patrol

A cinematic, scroll-driven 3D night drive through a low-poly winter Winnipeg. Each stop on the patrol route is a chapter of Mahfuj's career. Full spec: [PROJECT_PLAN.md](PROJECT_PLAN.md).

> **Status:** Phase 4 (first checkpoint). `/` is a 3D night drive along the route with buildings, cross streets, back lanes and the first landmark, the RRC campus, which opens a checkpoint panel; `/simple` is the complete HTML portfolio. Content is edited in `src/content/` (see [docs/content-guide.md](docs/content-guide.md)); how the drive works is in [docs/drive.md](docs/drive.md); how to add a stop is in [docs/adding-a-stop.md](docs/adding-a-stop.md).

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

All models are original (procedural or hand-modelled). Third-party assets are CC0 only.

**Textures** (CC0, [Poly Haven](https://polyhaven.com)). Full details in [public/textures/CREDITS.md](public/textures/CREDITS.md).

- [Asphalt Snow](https://polyhaven.com/a/asphalt_snow) by eye-candy.xyz
- [Snow 02](https://polyhaven.com/a/snow_02) by Rob Tuytel
- [Factory Brick](https://polyhaven.com/a/factory_brick) by Rob Tuytel

Audio credits will be listed here (Phase 9).

## License

[MIT](LICENSE)
