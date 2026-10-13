# Station arrival pattern

Design for how the car arrives at a **section station** (Education, Projects, Experience, Skills, Contact), and how the Skills station replaces the dashboard skills. This is a plan, not built. It is written to slot into the navigation redesign docs; wording that depends on that document is listed under [Open questions](#open-questions).

A **station** is a section of the portfolio with its own building. It is different from the 12 route **stops** built so far: a stop is a drive-by checkpoint (a landmark that lights up and a side panel). A station is somewhere the car pulls in and parks.

## The pattern

One sequence for every station:

1. **Red light.** Approaching a station, its traffic light turns red and an **Open &lt;Section&gt;** button appears. The car eases to a stop at the line (the red-light pause). The pause never traps the visitor: any forward input (scroll, arrow, Next, Page Down) drives on, and the light goes back to green.
2. **Turn in.** On Open, the car slows, turns left or right into a parking bay in front of the station building and stops facing the wall head-on. The camera swings behind the car so the wall fills the frame.
3. **Lit wall.** The headlights brighten into a visible lit area on the wall.
4. **Content.** The section content fades in inside that lit area. Education, for example, shows the campus name, years and courses.
5. **Leave.** Scroll or Esc: the car backs out and continues along the route.

### State machine

`en-route` → `at-light` (red, button shown) → `turning-in` → `parked` (content shown) → `backing-out` → `en-route`.

- It lives in `src/lib/station.ts` as a pure reducer, with unit tests. The drive store holds the state and the station index; the scene reads it each frame.
- `at-light` is the existing stop magnet at the light's `t`, so Prev, Next, wheel and the mini-map already know how to leave it.
- Turning and backing out are timed (about 1.6 s and 1.2 s), not driven by scroll. While they run, only Esc and the skip control act, and both jump straight to the end of the manoeuvre.
- Any jump that leaves a station (mini-map, Prev, Next, a far wheel nudge) backs out first, and skips the animation when the jump is large.

### Per-station data, not hardcoded

Everything that differs between stations is data in `src/content/stations.ts`, validated by zod and by `integrity.ts`, and read by the scene and the UI:

```ts
{
  id: 'education',
  section: 'education',          // heading and the "Open <Section>" label come from ui copy
  stopId: 'rrc-campus',          // the checkpoint it replaces or extends
  light: { offset: -22, side: 1 },                 // metres along the road from the stop, side of the road
  bay: { offset: -4, turn: 'left', depth: 5.5 },   // where to park, which way to turn in, nose-to-wall gap
  camera: { back: 7, up: 2.4, fov: 42 },           // the parked pose, behind the car
  wall: { landmark: 'rrc-campus', rect: { x: 2, y: 1, width: 9, height: 5 } },  // the lit area, in the landmark frame
  contentRef: 'rrc-diploma',     // what the wall shows (see "Content")
}
```

Positions are measured from the stop along the route, in the same way as intersections and landmarks, so the bay follows the road if the route is reshaped. Nothing about turn direction, pose or timing is in a component.

## The wall

### Wall content is real DOM placed in 3D

Text on the wall is not a texture (CLAUDE.md rule 3). It is DOM, positioned on the wall by a CSS 3D transform (Drei `Html` with `transform`, or our own small component that builds one `matrix3d` from the camera and the wall rectangle).

- **Own the transform.** The camera is still while parked, so the transform is computed once when the camera settles, not every frame. That avoids the main cost of `Html transform` (layout work every frame) and the blurry text a moving 3D-transformed layer can show. This favours the small custom component; plain Drei `Html` is the fallback if it gets in the way.
- **No occlusion tests.** `occlude` raycasts against the scene; the wall is the nearest thing to the camera, so it is not needed.
- **Outside the hidden scene.** The 3D container is `aria-hidden` today. The wall DOM must live outside it (a sibling element the transform is applied to, or Drei's `portal` option pointed at one), so it is in the accessibility tree and the tab order. It comes after the drive controls, like the checkpoint panel does now.
- **Text from `src/content`.** The same resolver as the checkpoint panel (`src/lib/checkpoint.ts`) feeds it, so Education shows the campus, years and courses from `experience.ts`, with no second copy of the words.
- **Keyboard and screen readers.** Heading, list items and links are normal elements with visible focus. On open, focus stays where it is (no focus theft, as in the panel); a live region announces "Education station opened. Press Escape to leave." Esc backs out and returns focus to the Open or Next button.
- **Glow ties to the fade.** The content fades in with the headlight ramp: it is at full opacity when the lit area is fully lit.

### Headlights and the lit area

The Car already has two real spotlights, and the lamp uniforms include the headlights, so the lit wall needs no new light sources:

- A `parkedGlow` value (0 to 1, the same pattern as `landmarkGlow`) ramps the headlight intensity and cone, and the wall material's headlight term.
- The lit rectangle is the headlight cone on the wall plus a soft additive decal behind the DOM, so the area reads on the `low` tier (no bloom) too.

### Reduced motion

- No turn, no back-out animation and no camera swing: the scene **cuts** to the parked view, and the content and headlights are fully on at once. Esc cuts back to the route.
- The red light switches colour instantly.
- The existing rule stays: one gesture moves one step.

### Mobile

The pattern is the same. The wall is projected to a small area on a phone, so the layout checks it:

- Each station has a design width for its wall content. The scene computes the on-screen scale when the camera settles; if body text would be under about 14 CSS px, the content **also** opens in the bottom sheet (the same sheet the checkpoint panel uses).
- When the sheet is showing, the wall copy is visual only (`aria-hidden`, `inert`) and the sheet is the accessible one, so screen readers never read it twice.
- Sheet and wall are one component with two presentations, fed by one view model.

## The Skills station

Skills move from the dashboard to their own station building, using the same parking pattern. The wall shows four groups: **Web, Backend, Embedded, AI tools.** Each skill is a list item with its name, its level as text ("level 4 of 5", also drawn as pips) and its note ("Learning", "Embedded side"). The dashboard keeps only a small hint (see below).

### Where on the route

Between the City services building (stop 5) and Portage & Main, at about **t = 0.30** (about 340 m along the route, the red light at about t = 0.285).

- It is the long straight (258 m, 12 m wide) with nothing on it: no intersection and no other stop between the City services building and the Portage & Main intersection (which starts about 470 m).
- The wide road leaves room for a parking bay and for the turn.
- It is the tower stretch, so the station building can be a modern low-rise or office base with a large flat front.
- Story: after CivicTrack and before RoleReady, it reads as the toolbox between two projects.
- Park on the **right**, a simple right turn, so the two patterns (Education turns left, Skills right) both get exercised and tested.

### Content change

The current skill groups in `skills.ts` (`gauge`, `switch`, `indicator`, `preset`) were made for dashboard widgets. The wall needs categories. Proposed mapping, to be confirmed (levels stay placeholders until the owner verifies them, `TODO(content)`):

| Group    | Skills                                                                |
| -------- | --------------------------------------------------------------------- |
| Web      | TypeScript, Next.js, React, Vue, Angular, WordPress                   |
| Backend  | Node.js, C# / .NET (learning), Django, SQL, Prisma, MongoDB, Firebase |
| Embedded | C / C++                                                               |
| AI tools | Gemini, Groq / Whisper, Claude                                        |

Embedded has one entry today. If the owner has more to show (microcontroller work, Arduino or similar), add it; otherwise the group stays small, and that is honest. The schema gets a `category` field; the dashboard `group` field goes away when the dashboard widgets do.

### What the dashboard keeps

A small hint only: for example one gauge or badge that says there is a Skills station ahead and jumps to it (a click, so it counts toward the 2-click rule). The gauges, switches and presets, and their tooltips, are removed from the plan. Phase 6 gets smaller (interior, wipers, props, patrol log).

## Changes to what is already built

### RRC campus becomes the Education station

The RRC landmark and checkpoint panel (Phase 4) were built as a drive-by stop. They become the first station:

- **Panel.** At a station the side panel does not open. The panel's content moves to the wall (and the sheet on a phone). For stops that stay drive-bys, such as the project stops, the side panel stays. `CheckpointPanel` and the new wall become two presentations of one `ContentSurface` fed by `resolveCheckpoint`; a stop is `presentation: 'panel'` or `'station'` in `checkpoints.ts` or `stations.ts`.
- **Landmark.** Nothing is rebuilt. The wall rectangle is chosen on the curtain wall's lower floors (a glass wall behind DOM text still works; the recessed ground floor and the heritage panel stay as they are). The glow ramp stays: parked holds `landmarkGlow` at 1.
- **Bay.** The campus front is 7.5 m behind the road edge, behind the plowed ridge. The bay needs: a gap in the plowed ridge and the tree rows (the same way intersections do it, a list of bays), a short road patch from the lane to the bay, and clear ground to the wall. The campus is on the left, so the car turns left across the oncoming lane (empty, so this is safe and is what a driver would do).
- **Camera.** The landmark focus lean (`landmarkFocus`) is replaced by the station's camera pose while parked.
- **Traffic lights.** The Princess St signals, 16 m past the stop, are fixed green by design. The station light becomes the one that changes: signal heads get a state per head (lit lamp colour as data) instead of being fixed. A station without existing signals gets its own mast arm from `light` in its data.
- **Radio.** The RRC radio line stays and plays on approach; the parked view adds no new line.
- **Tests.** The Education e2e changes from "panel opens" to "the red light and Open button appear, Open parks the car and shows the wall content, Esc backs out"; the panel e2e keeps testing the project stops.

### Other stops

The EventFlow stop and the later project stops stay drive-bys with the side panel (see Open questions on how Projects becomes a station).

## Phase placement and size

New **Phase 5b: Station arrival pattern**, after the current stop PRs reach a natural pause and **before the remaining Phase 5 stops**, so those stops are built on the final presentation model, not reworked.

| Piece                                                                                                                           | Size                | Notes                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------- |
| Station state machine, drive store changes, `stations.ts` content and integrity checks, Open button, mini-map and jump handling | **M**               | Pure logic, well testable                                                                           |
| Parking path and camera swing (lane to bay, turn, back out), bays in the ridge, trees and road                                  | **L**               | The hard part; shares path maths with the Phase 8 U-turn, so build the primitives once in `src/lib` |
| Headlight brighten and lit area, wall DOM (custom `matrix3d`), content surface shared with the panel and the sheet              | **M**               | Accessibility and mobile checks                                                                     |
| Station light: signal heads with state                                                                                          | **S**               |                                                                                                     |
| Education station (convert the RRC stop)                                                                                        | **S**               | The first user of the pattern                                                                       |
| Skills station: building, bay, wall, `skills.ts` categories                                                                     | **M**               | Phase 6 (dashboard) shrinks to match                                                                |
| Experience, Contact, Projects stations                                                                                          | **S** to **M** each | After the pattern lands; Contact lines up with the Phase 7 Forks ending                             |
| Dashboard slimdown to a hint                                                                                                    | **S**               | Part of Phase 6                                                                                     |

Overall: one **L** (pattern), three **M**, a handful of **S**. The pattern and Education are one PR series; each further station is one small PR following `docs/adding-a-stop.md`, which gets a "station" section.

Dependencies: the lane maths (`src/lib/lanes.ts`) and, for backing out and U-turns, a shared path module. Phase 8's rule that the car never drives backwards gets one stated exception: the reverse out of a parking bay (a manoeuvre, not travel).

## The 2-click rule and `/simple`

- `/simple` is unchanged and still has all content. Station content comes from the same files, so nothing is lost, and `/simple` gets section anchors (`#education`, `#skills`, and so on) for deep links.
- Mini-map: every station is a destination. Choosing one drives to its light and opens it for you, so any station is two clicks from anywhere (open the map, pick the station). The Open button is also reachable by keyboard.
- The dashboard hint links straight to the Skills station.

## Performance risks

| Risk                                      | Why                                                                                                                | Mitigation                                                                                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| DOM in 3D every frame                     | `Html transform` recomputes layout as the camera moves, and CSS 3D text can blur or jank, especially on iOS Safari | Only mount when parked; compute the transform once the camera settles; no `occlude`; sheet fallback on small screens                               |
| Fill rate with the wall filling the frame | The wall shader (grid and 14-lamp light loop) covers the whole screen, plus bloom and snow overdraw                | While parked, use the headlights only in the wall light loop; cap snow density near the camera; `low` tier skips bloom and uses the additive decal |
| Draw calls                                | A building per station                                                                                             | Each landmark is 4 to 6 frustum-culled meshes; five stations add about 25, so about 95 against a budget of 150                                     |
| Updating signal state                     | Instance colour writes                                                                                             | A handful of heads, written only when a state changes                                                                                              |
| Bays and ridge gaps                       | A little extra road and ridge geometry                                                                             | Negligible; merged into the existing meshes                                                                                                        |
| State machine bugs                        | Scroll, Prev/Next, mini-map jumps and Esc during a turn                                                            | Pure reducer with exhaustive unit tests; Playwright flow for each station; manoeuvres are timed and skippable                                      |
| E2E time                                  | SwiftShader renders slowly and several accessibility tests are already slow                                        | Station tests use the `low` tier; reuse one flow helper                                                                                            |
| Accessibility                             | Content in a hidden 3D container, or read twice                                                                    | Wall DOM outside `aria-hidden`; the sheet and the wall are never both exposed; axe on every station                                                |

## Open questions

1. **Stops and stations.** Do the 12 route stops stay as drive-by checkpoints, with the five stations added? Or do the project stops (EventFlow, CivicTrack, RoleReady, and so on) fold into one Projects station? This document assumes the first: drive-bys stay, stations are the section deep-dives. Suggested mapping: Education is the RRC campus; Projects, Experience and Contact still need a building and a place on the route (Contact fits the Forks).
2. **The red-light pause.** This document makes it an eased stop at the line using the existing stop magnet, so any forward input carries on. Is that the intended "never trapping"?
3. **Reversing.** Backing out of the bay is the one place the car moves backwards. Fine, or should it pull forward and U-turn out instead?
4. **Skill groups.** Is the Web, Backend, Embedded, AI tools split above right, and is there more Embedded work to show?
5. **The 2-click rule.** I have assumed it means any stop or station is at most two clicks away, as in Phase 8. If the redesign defines it differently, the mini-map flow above should follow that.
