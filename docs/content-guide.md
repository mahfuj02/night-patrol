# Content guide

All text, links, skills, stops and radio lines live in `src/content/*`. Components never hardcode copy. Every file is parsed with a zod schema from `src/content/schema.ts`, and `src/content/integrity.ts` checks cross-references when the module loads. A mistake fails `pnpm test` and `pnpm build`.

| File            | Holds                                                                       |
| --------------- | --------------------------------------------------------------------------- |
| `profile.ts`    | Name, role, pitch, contact links, resume path                               |
| `projects.ts`   | Projects. `stopId` is optional; projects without one show only in `/simple` |
| `skills.ts`     | Skills by group (gauge, switch, indicator, preset)                          |
| `experience.ts` | Patrol log: work, education, achievements                                   |
| `community.ts`  | Community notes (the warming shelter note)                                  |
| `stops.ts`      | Route order and `t` along the path, landmark id, `contentRef`               |
| `radio.ts`      | Dispatch lines; every line is captioned                                     |
| `ui.ts`         | Section headings, labels and link text for the HTML views                   |

## Editing rules

- Anything unverified gets `// TODO(content): verify`. Remove all of them before v1.0.0.
- Dates are `YYYY` or `YYYY-MM`.
- A stop's `contentRef` and the project's `stopId` must point at each other.
- `t` must strictly increase with `order`. Phase 2 tunes the values against the route curve.
- Never add a phone number to the site.
- Skill levels are placeholders and are not shown in `/simple`.

## Resume

Put the real PDF at `public/resume.pdf`. The link on `/simple` points there.

## Site URL

Set `NEXT_PUBLIC_SITE_URL` (see `.env.example`) once the domain is decided. Without it the site uses the Vercel production URL, then `http://localhost:3000`. It feeds canonical URLs, the sitemap, robots and JSON-LD.
