# Contributing

Read [CLAUDE.md](CLAUDE.md) (working rules) and [PROJECT_PLAN.md](PROJECT_PLAN.md) (spec) first.

## Workflow

- Never commit to `main`. One vertical slice per branch: `feat/pN-name`, `fix/...`, `chore/...`, `docs/...`, `perf/...`.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/), enforced by commitlint: `feat(scene): add road curve`, `fix(ui): panel focus trap`.
- Open a small PR, fill in the template, squash merge.
- Before pushing: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.

## Hooks

Husky runs lint-staged on commit (ESLint + Prettier) and commitlint on the message.

## Adding a stop or project

Stops and projects are content-driven (`src/content/*`). Step-by-step docs arrive in Phase 4 (`docs/adding-a-stop.md`).

## Labels

```bash
gh label create scene --color 4FE3E3
gh label create ui --color FFB25C
gh label create content --color E8EEF5
gh label create perf --color FF8A5B
gh label create a11y --color 8A4B3A
gh label create infra --color 14233F
gh label create good-first --color 7057FF
```
