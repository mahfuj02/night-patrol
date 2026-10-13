# Adding a stop

How a stop works, end to end, and the exact steps to turn one on. The RRC Polytechnic Exchange District Campus (stop 3) is the worked example: it is the first stop with the full pattern.

A stop has up to four parts, and each one is optional until you build it:

| Part                | What the visitor sees                                    | Where it lives                                          |
| ------------------- | -------------------------------------------------------- | ------------------------------------------------------- |
| Landmark            | A building or scene that lights up as the car arrives    | `src/scene/Landmarks/`                                  |
| Checkpoint panel    | A DOM panel with the content for the stop                | `src/content/checkpoints.ts`, `src/ui/CheckpointPanel/` |
| Radio caption       | The dispatch line, as text, while the car is at the stop | `src/content/radio.ts`, `src/ui/Hud/`                   |
| Entry in `stops.ts` | The stop itself: where it is and what it is called       | `src/content/stops.ts`                                  |

Everything the visitor reads comes from `src/content`. Scene and UI components hold no copy.

## 1. The stop and its content

The stop is already in `src/content/stops.ts` (position `t`, title, landmark id, kind). Point it at its content and its radio line:

```ts
{
  id: 'rrc-campus',
  order: 2,
  t: 0.081,
  title: 'RRC Polytechnic, Exchange District Campus',
  landmark: 'rrc-campus',
  kind: 'education',
  contentRef: 'rrc-diploma', // an experience entry or a project
  radioId: 'rrc-campus', // a line in radio.ts
}
```

- `contentRef` is the id of an entry in `experience.ts` or `projects.ts`.
- Add the radio line to `src/content/radio.ts`. Every radio line is shown as a caption; there is no audio, and sound stays off by default. Mark wording you are not sure of `// TODO(content): verify`.

## 2. The checkpoint panel

Add the stop to `src/content/checkpoints.ts`:

```ts
{ stopId: 'rrc-campus', teaserRef: 'sprint-innovation-2025' }
```

- A stop only opens a panel if it is listed here and has a `contentRef`. `teaserRef` is optional: another entry shown as a short "Also:" line.
- `pnpm test` checks the stop exists, has content, and that the teaser exists (`src/content/integrity.ts`).
- `src/lib/checkpoint.ts` turns the entry into what the panel shows. An experience entry shows its title, organisation, dates, summary and bullets; a project shows its tagline, problem, what was built, stack and links. A new kind of content means a new view there.
- Panel wording that is not content (the close button, the announcement) is in `src/content/ui.ts` under `checkpoint`.

### How the panel behaves

- It opens when the car reaches the stop (`atStop` in `src/store/drive.ts`) and slides out when the visitor drives on. On a desktop it is a side panel on the right; on a phone it is a bottom sheet above the drive buttons. Under reduced motion it appears and disappears without sliding.
- **Focus.** It never takes focus by itself, because the visitor may be driving with the wheel or the arrow keys. A live region announces it, and it comes right after the drive controls in the tab order, so Tab reaches it next. Escape (anywhere) or the close button closes it; if focus was inside, it goes back to the Next stop button. While closed it is `inert`.
- **Closing.** Closing remembers the stop (`dismissedStop` in the drive store): the panel stays closed while the visitor stays at that stop, and may open again when they come back.

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
- A unit test for any new maths in `src/lib`, a component test for UI changes (mouse and keyboard), and a Playwright test for the visitor flow (`tests/e2e/checkpoint.spec.ts` is the model, with an axe check).
- Screenshots: the stop on approach and at the stop, with the panel open and closed, on desktop and phone width.
- Check keyboard use and reduced motion by hand.
- Update `CHANGELOG.md` and these docs if the pattern changed.

## Stations

A section station (Education, Projects, Experience, Skills, Contact) is a stop whose building the car parks at, instead of a side panel. See [docs/stations.md](stations.md): add the landmark first, then an entry in `src/content/stations.ts`, and leave the stop out of `checkpoints.ts`.
