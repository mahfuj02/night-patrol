# Stations

How a section station works in the code (Phase 5b). The design and the reasons are in `docs/navigation-redesign.md`; this is the reference for what is built. The Education station on the RRC campus is the first.

## The visit, step by step

1. **Red light.** The station's light (a signal on the right of the road, a little past where the car stops) turns red as the car approaches, and an **Open Education** button appears. The car eases to a stop at the line (it is one of the stops the scroll magnet holds the car at). Any scroll, arrow key, Page Down or Next stop drives on, and the light goes green again. The button is also offered at the station's own stop, so Next stop reaches it too.
2. **Open.** The car turns into the bay along a smooth curve (2 s), the camera swings in behind it, and the headlights come on.
3. **Parked.** The car stops squarely in front of the lit rectangle on the wall. The content fades in on the wall.
4. **Leave.** Escape, the Leave station button (top right), or driving on: the car backs out (1.2 s) and, if the visitor asked to drive on, carries on to the next or previous stop.

Under reduced motion every manoeuvre is a cut: the scene jumps to the parked view and back, the light changes colour at once, and the camera does not swing.

## Data: `src/content/stations.ts`

Everything that differs between stations is data (see the comment at the top of the file): the stop the distances are measured from, the red light's distance before it, the bay (which way to turn, nose-to-wall gap, width, how much road edge to clear), the parked camera (metres back, metres up, field of view), the lit wall rectangle in the landmark's own frame, and the content (`contentRef`, `teaserRef`). `pnpm test` checks the stop, the content

`route.lengthMetres` (in `route.ts`) is the length of the route curve; a test keeps it equal to the real curve. It lets the store place a light from metres without any 3D code.

## Pieces

| Piece            | Where                                   | What it does                                                                                                                                       |
| ---------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| State machine    | `src/lib/station.ts`                    | idle, turning in, parked, backing out; what to do with a move made while parked; red light and glow rules; timing                                  |
| Store            | `src/store/drive.ts`                    | holds the station state and `openable`; movement while turning or backing out is ignored; moving while parked backs out first, then makes the move |
| Parking path     | `src/lib/parking.ts`                    | a cubic Bezier from the road pose to the bay pose; the car faces where it moves; backing out plays it in reverse                                   |
| Wall transform   | `src/lib/homography.ts`                 | maps the content layout onto the projected wall as a CSS `matrix3d`                                                                                |
| Camera framing   | `src/lib/stationCamera.ts`              | how far back the camera must be for the wall to fit; whether the wall text is big enough to read                                                   |
| Station geometry | `src/scene/Stations/stationGeometry.ts` | the bay pose, the wall corners, the road clearing and the pad, from the data and the landmark's frame                                              |
| Driver           | `src/scene/Stations/StationDriver.tsx`  | moves the car, ramps the glow, aims the camera, tells the store a manoeuvre is done; `WallProjector` places the wall DOM                           |
| Headlights       | `Car.tsx`, `lampUniforms.ts`            | brighter, wider and tipped up while parked, so they light the wall                                                                                 |
| Lit area         | `StationWalls.tsx`                      | a soft additive rectangle on the wall, so the lit area shows on every tier                                                                         |
| Station light    | `Signals.tsx`, `signalLayout.ts`        | a mast with heads that turn red and green; only a head whose colour changes is repainted                                                           |
| Bay              | `Road/route.ts`, `CrossStreetRoads.tsx` | the plowed ridge and trees stop along the bay, and a packed-road pad runs from the road edge to the wall                                           |
| UI               | `src/ui/Station/`                       | the Open and Leave buttons, the wall content and the bottom sheet                                                                                  |

## The wall is real DOM

The content is a normal element with headings and text, laid out at a fixed design size (`WALL_DESIGN_WIDTH`, 720 px) and placed on the wall by a CSS 3D transform that `WallProjector` sets each frame it is on screen (the camera is still once parked, so it settles). It lives outside the hidden 3D container, so it is in the accessibility tree and the tab order, after the drive controls. Nothing takes focus by itself: a live region says "Education station opened. Press Escape to leave."

When the wall is too small to read (its on-screen width is under `MIN_WALL_SCALE` of the design width, or wider than the screen), the same content also opens in a bottom sheet. The wall copy is then visual only (`aria-hidden`, `inert`), so assistive technology reads it once. On a phone the camera also pulls back so the whole wall fits.

## Adding a station

1. Add a landmark for the building (see `docs/adding-a-stop.md`) with a flat wall facing the road.
2. Add an entry to `stations.ts`, choosing the stop the distances are measured from. The wall rectangle is in the landmark's frame; the bay follows from it.
3. Check the bay is clear: `stationGeometry.test.ts` covers trees, lamps, the road edge and the order of the light, bay and stop. Add a Playwright flow like `tests/e2e/station.spec.ts`.
4. Report draw calls and triangles per tier in the PR.

## Cost

One extra draw call for the pad's road patch (merged into the cross street mesh, so none), one for the lit-area rectangle while it is lit, and the station light's lamps (merged into the signal meshes). The wall DOM costs nothing on the GPU. Measured numbers are in the PR.

## The Projects station

A station may have no single entry of its own: the Projects station (the Millennium Library) leaves `contentRef` out, its wall shows a stack of titles as a picture, and a DOM panel is the accessible interface. See [library.md](library.md).
