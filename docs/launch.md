# Launch checklist (Phase 11)

What is done in the repository, and what only the owner can do.

## Done in the repo

- 404 page in theme ("Wrong turn, Unit 02", `src/app/not-found.tsx`), with links back to the drive and to `/simple`.
- Social preview (`opengraph-image.tsx`), the favicon set (`favicon.ico`, `icon.svg`, `apple-icon.tsx`), theme colour, Open Graph and Twitter metadata, sitemap and robots.
- Security headers (`next.config.ts`): no sniffing, strict referrer policy, same-origin framing, no camera, microphone or location.
- Accessibility: axe runs in Playwright on the drive, the route map, every station panel and the shortcuts overlay; keyboard and reduced-motion paths are tested. Sound is off by default and never autoplays.
- Performance: quality tiers (`high`, `medium`, `low`) with an adaptive monitor, instanced props, the 3D code loaded only in the browser and only with WebGL, Lighthouse CI on the loading screen, and `/simple` as the fast fallback.
- Every part of the patrol loop is covered by unit tests, a frame-by-frame simulation and position-driven end-to-end tests.

## Only the owner can do these

1. **Deploy and the custom domain** on Vercel, HTTPS check ([vercel-setup.md](vercel-setup.md)); set `NEXT_PUBLIC_SITE_URL` to the domain.
2. **Link from mahfuj.dev** ("Explore in 3D →") to the new domain.
3. **Real-device tuning** on a mid-range Android phone and an iPhone, and a pass in Safari, Firefox and mobile Safari (the adaptive tiers are in `src/lib/quality.ts`; `?quality=low|medium|high` forces one).
4. **Proofread the content and clear the `TODO(content)` markers.** They are facts and wording only the owner can confirm, so none were guessed:
   - `profile.ts`: the pitch wording and the details marked verify.
   - `projects.ts`: each project's tagline, problem and built text, the sign wording, the alt text of the images, the shelf, and the Safe Drive AI description.
   - `experience.ts`: the result, category and month of the entries marked verify.
   - `skills.ts`: every level from 1 to 5 (they are placeholders).
   - `stations.ts`: the Education courses.
   - `radio.ts`: the wording of the radio lines, including the return lines ("heading back to base", "on your right").
   - `library.ts`: the shelves and the featured project.
   - `community.ts`: the community note.
   - `route.ts`, `atmosphere.ts`, `buildings.ts`, `backLanes.ts`: the look and the shape of the route, tuned by eye against real Winnipeg.
5. Add a screenshot or GIF and the live link to the README.
6. Tag `v1.0.0` once the above is done.
