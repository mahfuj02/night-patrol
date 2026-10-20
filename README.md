# Night Patrol

A cinematic, scroll-driven 3D night drive through a stylized winter Winnipeg. Each stop on the patrol route is a chapter of Mahfuj's career. Full spec: [PROJECT_PLAN.md](PROJECT_PLAN.md).

> **Status:** feature complete (v1.0 candidate). `/` is a continuous 3D night patrol through winter Winnipeg: out along the road past every stop, round the roundabout at The Forks, back along the return lane, round a small turnaround behind Ignition, and out again for ever. Five stations open from either direction (Education, Projects at the library, Skills, Experience, Contact); `/simple` is the complete HTML portfolio and the fallback. Content is edited in `src/content/` (see [docs/content-guide.md](docs/content-guide.md)). How the drive works: [docs/patrol-loop.md](docs/patrol-loop.md). Launch checklist for the owner: [docs/launch.md](docs/launch.md).

## Controls

Scroll down, swipe up or press Down/Right to drive on; scroll up, press Up/Left or Page Up to brake (the car never reverses and never turns by itself). Space or Page Down drives to the next stop; the buttons are Brake, Next stop, Turn around and Start over. The route map jumps to any stop in one or two clicks. Press `?` for the shortcuts. Sound is off until you turn it on.

<!-- TODO: screenshot or GIF -->
<!-- TODO: live link once the domain is decided -->

## Tech stack

Next.js (App Router), TypeScript (strict), Tailwind CSS, pnpm. three.js / React Three Fiber, Zustand, Web Audio (synthesised sound, no audio files). Tests: Vitest, Testing Library, Playwright, axe.

## Local setup

Requires Node 24 (see `.nvmrc`) and pnpm 12.

```bash
pnpm install
pnpm dev
```

## Scripts

| Command                | What it does                                                  |
| ---------------------- | ------------------------------------------------------------- |
| `pnpm dev`             | Local dev server                                              |
| `pnpm build`           | Production build                                              |
| `pnpm typecheck`       | `tsc --noEmit`                                                |
| `pnpm lint`            | ESLint                                                        |
| `pnpm format`          | Prettier (write)                                              |
| `pnpm test`            | Vitest unit and component tests                               |
| `pnpm test:coverage`   | Vitest with coverage thresholds                               |
| `pnpm test:e2e`        | Playwright (needs `pnpm build` first)                         |
| `pnpm models:optimize` | glTF pipeline (nothing to process: all models are procedural) |

## Deployment

Hosted on Vercel with a preview deploy per PR. See [docs/vercel-setup.md](docs/vercel-setup.md).

## Credits

All models are original (procedural or hand-modelled). Third-party assets are CC0 only.

**Textures** (CC0, [Poly Haven](https://polyhaven.com)). Full details in [public/textures/CREDITS.md](public/textures/CREDITS.md).

- [Asphalt Snow](https://polyhaven.com/a/asphalt_snow) by eye-candy.xyz
- [Snow 02](https://polyhaven.com/a/snow_02) by Rob Tuytel
- [Factory Brick](https://polyhaven.com/a/factory_brick) by Rob Tuytel

Audio: none to credit. Every sound (engine, tyres, wipers, radio blips) is synthesised in the browser with the Web Audio API; there are no audio files.

## License

[MIT](LICENSE)
