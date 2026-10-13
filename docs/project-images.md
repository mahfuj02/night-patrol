# Project images

The pictures for each project's book in the Millennium Library (and anywhere else a project's `images` are shown). They are WebP files in `public/images/projects/`, listed per project in `src/content/projects.ts` (`images: [{ src, alt, caption? }]`).

| Project              | Image                                 | Notes                                                                                           |
| -------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| EventFlow            | Screenshot of the live site, 1280x800 | Kept as is, including the site's floating "Bring your event" card                               |
| RoleReady            | Screenshot of the live site, 1280x800 |                                                                                                 |
| Safe Drive AI        | The owner's mobile image, 417x900     | A concept design, so the book shows the caption "Concept design" (the text is in `projects.ts`) |
| Connexions Spectrum  | The owner's concept image, 1024x572   | A campus project that is not on GitHub, so there is no live capture; captioned "Concept design" |
| Game Hub             | none                                  | Its page is full of real game cover art (rule 10), so it gets a typographic cover               |
| AV Device Controller | none                                  | A real terminal screenshot will replace the typographic cover later                             |
| CivicTrack           | none yet                              |                                                                                                 |

Alt text is marked `TODO(content)` for the owner to check. `outdoor-adventure.jpg` is not used (it is not a project yet).

## Making them

```
node scripts/capture-project-screenshots.mjs [id ...]   # live sites, 1280x800, to design/project-images/raw/
node scripts/prepare-project-images.mjs [id ...]        # raw/ and source/ to public/images/projects/*.webp
```

- `capture-project-screenshots.mjs` takes the top of each live page after it has loaded. Look at every shot: a cookie banner or a half-loaded page needs a different wait or URL.
- `prepare-project-images.mjs` writes WebP at quality 80 (stepping down to 55 only if a file is over 150 KB), landscape at most 1280 px wide and portrait at most 900 px tall, and prints each size and the total. It fails if an image cannot fit 150 KB.
- The owner's original files live in `design/project-images/source/` and the raw captures in `design/project-images/raw/`; both are git-ignored. Only the WebP output ships.
- `pnpm test` checks each image exists, is a WebP in `public/images/projects/`, and is at most 150 KB.

## Adding one

Put the source in `design/project-images/source/` (or capture it), add an entry to `images` in `scripts/prepare-project-images.mjs`, run the script, add `{ src, alt }` (and `caption` for a mock-up) to the project, and check the shot by eye.
