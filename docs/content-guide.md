# Content guide

All text, links, skills, stops, radio lines and the route live in `src/content/*`. Components never hardcode copy.

Each file exports plain typed data. `src/content/index.ts` parses every file with its zod schema from `schema.ts` and `integrity.ts` checks cross-references, so a mistake fails `pnpm test` and `pnpm build`.

**Which one to import**

- Server code and tests: `@/content` (the validated index).
- Client code (components, hooks, stores, the 3D scene): the plain file, for example `@/content/stops`, `@/content/route` or `@/content/ui`. The index pulls zod and every content file into the browser bundle, so ESLint blocks it there.

| File            | Holds                                                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profile.ts`    | Name, role, pitch, contact links, resume URL (on mahfuj.dev)                                                                                                   |
| `projects.ts`   | Projects. `stopId` is optional; projects without one are library books and `/simple` only. `published: false` hides a project everywhere until it is published |
| `skills.ts`     | Skills by category (web, backend, embedded, ai, mobile)                                                                                                        |
| `experience.ts` | Patrol log: work, education, achievements                                                                                                                      |
| `community.ts`  | Community notes (the warming shelter note, shown on /simple only)                                                                                              |
| `stops.ts`      | Route order and `t` along the path, landmark id, `contentRef`                                                                                                  |
| `route.ts`      | Control points of the road (x east, z south), widths, and the stop on each                                                                                     |
| `atmosphere.ts` | Lighting and weather zones: sky, fog, lamps, snow, moon, sunrise, by stop range                                                                                |
| `radio.ts`      | Dispatch lines; every line is captioned                                                                                                                        |
| `ui.ts`         | Section headings, labels and link text for the HTML views and drive controls                                                                                   |

## Editing rules

- Anything unverified gets `// TODO(content): verify`. Remove all of them before v1.0.0.
- Dates are `YYYY` or `YYYY-MM`.
- A stop's `contentRef` and the project's `stopId` must point at each other.
- Never add a phone number to the site.
- Skill levels are placeholders and are not shown in `/simple`.

## Editing the route

`route.ts` is a list of points the road curve passes through. Tweak coordinates and `width` freely. Each stop is pinned to exactly one point with `stopId`, in stop order.

Each stop's `t` in `stops.ts` is that point's arc-length fraction along the curve. After moving points, run `pnpm test`: `src/scene/Road/route.test.ts` names the stops whose `t` drifted, and prints the expected values in its failure message. Update `stops.ts` and keep three decimals.

The road should stay gentle (the test rejects sharp kinks) and flat.

## Resume

The resume lives on mahfuj.dev (`profile.resumeUrl`, `https://mahfuj.dev/resume/MahfujAhmed_Resume.pdf`). The link on `/simple` and the Contact station point there; there is no local copy to keep in sync.

## Site URL

Set `NEXT_PUBLIC_SITE_URL` (see `.env.example`) once the domain is decided. Without it the site uses the Vercel production URL, then `http://localhost:3000`. It feeds canonical URLs, the sitemap, robots and JSON-LD.
