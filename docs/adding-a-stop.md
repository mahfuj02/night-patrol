# Adding a stop

How a stop works, end to end, and the exact steps to turn one on. The RRC Polytechnic Exchange District Campus (stop 3) is the worked example: it is the first stop with the full pattern.

A stop has up to four parts, and each one is optional until you build it:

| Part                | What the visitor sees                                    | Where it lives                        |
| ------------------- | -------------------------------------------------------- | ------------------------------------- |
| Landmark            | A building or scene that lights up as the car arrives    | `src/scene/Landmarks/`                |
| Sign                | A lit sign with the project name and a slogan            | `sign` in `src/content/projects.ts`   |
| Radio caption       | The dispatch line, as text, while the car is at the stop | `src/content/radio.ts`, `src/ui/Hud/` |
| Entry in `stops.ts` | The stop itself: where it is and what it is called       | `src/content/stops.ts`                |

Everything the visitor reads comes from `src/content`. Scene and UI components hold no copy.

## 1. The stop and its content

The stop is already in `src/content/stops.ts` (position `t`, title, landmark id, kind). Point it at its content and its radio line:

```ts
{
  id: 'exchange-warehouses',
  order: 3,
  t: 0.134,
  title: 'Exchange District warehouses',
  landmark: 'exchange-warehouses',
  kind: 'project',
  contentRef: 'eventflow', // the project
  radioId: 'exchange-warehouses', // a line in radio.ts
}
```

- `contentRef` is the id of a project (or an experience entry, for a station).
- Add the radio line to `src/content/radio.ts`. Every radio line is shown as a caption; there is no audio, and sound stays off by default. Mark wording you are not sure of `// TODO(content): verify`.

## 2. The sign

A drive-by project stop has no popup. The project's building carries a lit sign with the project name and a slogan, from the project's `sign` field in `src/content/projects.ts`:

```ts
sign: { name: 'CivicTrack', slogan: 'Help make Winnipeg better. Report it, track it, fixed.' },
```

- A project with a route stop must have a `sign` (`pnpm test` checks it). A project without a stop (a library book only) has none.
- The landmark draws the sign (a marquee, a request board, a rooftop sign, whatever suits the building) from that field with `sloganLines` (`signText.ts`), which sets a long slogan over two lines. It brightens through `landmarkGlow` as the car arrives, like the rest of the landmark.
- The sign is drawn in 3D, so it has no text for a screen reader. `Subtitles` adds the words as hidden text beside the radio caption ("Sign: CivicTrack. Help make…"), also at stops with no radio line.
- The full project details are never a popup. They live in the Projects library and in the route map's project list (`resolveProjectDetails`).

## 3. The landmark

A landmark is a component in `src/scene/Landmarks/` wrapped in the `Landmark` base component, listed in `Landmarks.tsx`:

```tsx
export const landmarkComponents = { 'rrc-campus': RrcCampus };
```

- **Placement** (`placement.ts`): a landmark stands beside the route, measured in metres from its stop (`offset`), on a `side`, with a `depth` and a `setback`. `landmarkFrame` gives its position and orientation: local `+z` points away from the road, so the front faces `-z`. Add the ground it covers to `reservedRect` use in `Buildings/sceneBuildings.ts`, so ordinary buildings leave it free.
- **Glow** (`src/lib/landmark.ts`): `landmarkGlow(t, stopT, reducedMotion)` returns 0 to 1: it eases up as the car approaches, holds at the stop, and eases down after it. Under reduced motion it is a cut. `Landmark` writes it once per frame to a shared `GlowUniform` that shader materials read, and to an optional `onGlow` for materials that are not shaders. Bloom does the rest, because lit surfaces are brighter than 1.
- **Camera.** While a landmark is lit, `Landmark` offers a focus point and the camera leans a little toward it (`landmarkFocus.ts`).
- **Style.** Follow `docs/art-reference.md`: original geometry and drawing only, no logos, banners, crests or signage lettering copied from the photos (CLAUDE.md rules 8, 10 and 13). Real lettering comes from `src/content/signage.ts`.
- **Budget.** Merge geometry that shares a material (a landmark is a handful of draw calls), use the shared materials and the wall shader in `landmarkMaterials.ts`, and report draw calls and triangles per tier in the PR.

## 4. Checks before the PR

- `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- A unit test for any new maths in `src/lib`, a component test for UI changes (mouse and keyboard), and a Playwright test for the visitor flow (`tests/e2e/signs.spec.ts` is the model, with an axe check).
- Screenshots: the stop on approach and at the stop, with the sign lit, on desktop and phone width.
- Check keyboard use and reduced motion by hand.
- Update `CHANGELOG.md` and these docs if the pattern changed.

## Stations

A section station (Education, Projects, Experience, Skills, Contact) is a stop whose building the car parks at, and whose content shows on the wall. See [docs/stations.md](stations.md): add the landmark first, then an entry in `src/content/stations.ts`,
