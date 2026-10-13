# Navigation redesign

> **Status:** the station arrival pattern and the Education station are built (Phase 5b); see [docs/stations.md](stations.md) for how. The transit-map menu is built too (Phase 5c, [docs/routemap.md](routemap.md)). The other stations follow.

How visitors move through Night Patrol and read its content: five **section stations** the car parks at, a **transit-map menu** that replaces the Phase 8 mini-map, and the changes to the plan, the code already built and the phase order. This is a plan, not built.

## Summary

| Before                                                       | After                                                                                   |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| 12 route stops, each a drive-by checkpoint with a side panel | The 12 stops stay as drive-bys. Five **stations** are added: the car pulls in and parks |
| Skills on the dashboard (gauges, switches, tooltips)         | Skills are a station building. The dashboard keeps only a hint                          |
| Experience in a "patrol log" panel                           | Experience is a station: an office with the entries on monitors                         |
| Projects only as stops along the route                       | A Projects station (a library) is the browse hub; each book has "Drive to it"           |
| Mini-map with a stop list (Phase 8)                          | A **transit-map menu**, built earlier, with section buttons                             |
| Contact at the Forks stop                                    | Contact is a station at The Forks                                                       |

Vocabulary: a **stop** is a point on the route with a landmark and a checkpoint panel (`stops.ts`). A **station** is a section of the portfolio with its own building and a parking bay (`stations.ts`, new). Some stations sit on an existing stop (Education is the RRC campus stop); others have their own spot.

## The five stations

| Section    | Building                  | Where                                  | What the visitor gets                                       |
| ---------- | ------------------------- | -------------------------------------- | ----------------------------------------------------------- |
| Education  | RRC campus (built)        | Exchange District, stop 3, left        | Campus, years and courses on the lit wall                   |
| Projects   | A library                 | Downtown straight, about t 0.245, left | A room of books, one per project. Details and "Drive to it" |
| Skills     | A tech building           | Downtown straight, about t 0.33, right | Skill groups on the lit wall                                |
| Experience | The LIILAB office         | Downtown, about t 0.483, right         | Experience entries on monitors seen through the glass       |
| Contact    | The Forks market building | End of the route, about t 0.97         | Email, GitHub, LinkedIn, resume, link to mahfuj.dev         |

Positions are in [Station positions](#station-positions). The 12 route stops stay as they are.

## The station arrival pattern

One sequence for every station:

1. **Red light.** Approaching a station, its traffic light turns red and an **Open &lt;Section&gt;** button appears. The car eases to a stop at the line (the red-light pause). The pause never traps the visitor: any forward input (scroll, arrow, Next, Page Down) drives on, and the light goes back to green.
2. **Turn in.** On Open, the car slows, turns left or right into a parking bay in front of the station building and stops facing the wall head-on. The camera swings behind the car so the wall fills the frame.
3. **Lit wall.** The headlights brighten into a visible lit area on the wall.
4. **Content.** The section content fades in inside that lit area.
5. **Leave.** Scroll or Esc: the car backs out and continues along the route.

The Projects and Experience stations vary steps 2 to 4 (see their sections). The rest of this section applies to all five.

### State machine

`en-route` → `at-light` (red, button shown) → `turning-in` → `parked` (content shown) → `backing-out` → `en-route`.

- It lives in `src/lib/station.ts` as a pure reducer, with unit tests. The drive store holds the state and the station index; the scene reads it each frame.
- `at-light` is the existing stop magnet at the light's `t`, so Prev, Next, wheel and the menu already know how to leave it. The magnet shrinks near another stop (`effectiveRadius`), so tight spacing is handled.
- Turning in and backing out are timed, not driven by scroll: about **1.6 s in and 1 to 2 s out**. While they run only Esc and the skip control act, and both jump to the end of the manoeuvre.
- Any jump that leaves a station (menu, Prev, Next, a far wheel nudge) backs out first, and skips the animation when the jump is large.
- **Backing out is the one place the car moves backwards.** "The car never drives backwards" (Phase 8) applies to route travel only; reversing out of a bay is a manoeuvre.

### Per-station data, not hardcoded

Everything that differs between stations is data in `src/content/stations.ts`, validated by zod and `integrity.ts`, and read by the scene and the UI:

```ts
{
  id: 'education',
  section: 'education',          // the heading and "Open <Section>" label come from ui copy
  stopId: 'rrc-campus',          // the stop it sits on, if any
  light: { offset: -28, side: 1 },                 // metres along the road from the stop; side of the road
  bay: { offset: -4, turn: 'left', depth: 5.5 },   // where to park, which way to turn in, nose-to-wall gap
  camera: { back: 7, up: 2.4, fov: 42 },           // the parked pose, behind the car
  wall: { landmark: 'rrc-campus', rect: { x: 2, y: 1, width: 9, height: 5 } },  // the lit area, in the landmark frame
  contentRef: 'rrc-diploma',     // what it shows
}
```

Positions are measured from a stop along the route, as intersections and landmarks already are, so the bay follows the road if the route is reshaped. Turn direction, camera pose, timing and light position are all data.

### Wall content is real DOM placed in 3D

Text on the wall is not a texture (CLAUDE.md rule 3). It is DOM, positioned on the wall by a CSS 3D transform.

- **Own the transform.** The camera is still while parked, so one `matrix3d` is computed when the camera settles, not every frame. That avoids the main cost of Drei `Html transform` (layout work each frame) and blurry text from a moving 3D layer. A small custom component is preferred; Drei `Html` is the fallback.
- **No occlusion tests.** `occlude` raycasts the scene; the wall is the nearest thing to the camera.
- **Outside the hidden scene.** The 3D container is `aria-hidden` today. The wall DOM lives in a sibling element, so it is in the accessibility tree and the tab order, after the drive controls, like the checkpoint panel.
- **Text from `src/content`**, through the same resolver as the checkpoint panel (`src/lib/checkpoint.ts`). No second copy of the words.
- **Keyboard and screen readers.** Headings, lists and links are normal elements with visible focus. On open, focus stays where it is (no focus theft, as in the panel). A live region says "Education station opened. Press Escape to leave." Esc backs out and returns focus to the Open or Next button.
- **The fade follows the glow.** The content is fully opaque when the lit area is fully lit.

### Headlights and the lit area

The Car already has two real spotlights, and the lamp uniforms include the headlights, so the lit wall needs no new light sources. A `parkedGlow` value (0 to 1, the pattern of `landmarkGlow`) ramps the headlight intensity and cone and the wall's headlight term. The lit rectangle is the headlight cone on the wall plus a soft additive decal behind the DOM, so it reads on the `low` tier (no bloom) too.

### Reduced motion

- No turn, no back-out animation, no camera swing: the scene **cuts** to the parked view, with the content and headlights fully on. Esc cuts back to the route.
- The red light switches colour instantly. The existing rule stays: one gesture moves one step.

### Mobile

The pattern is the same. The wall is a small area on a phone, so each station has a design width and the scene computes the on-screen scale when the camera settles. If body text would be under about 14 CSS px, the content **also** opens in the bottom sheet (the one the checkpoint panel uses). When the sheet shows, the wall copy is visual only (`aria-hidden`, `inert`) and the sheet is the accessible one, so screen readers never read it twice. Sheet and wall are one component with two presentations, fed by one view model.

## Transit-map menu

Replaces the Phase 8 mini-map and **moves earlier** (see [Phases](#phases-and-order)). It is the main way to jump around, and it is how any stop, station, contact detail or the resume stays within two clicks.

### Layout

- **Desktop:** a left-hand panel, **collapsible**, so the right side stays free for the checkpoint panel. It starts open on wide screens and collapsed on narrow ones. The collapsed state is not stored (CLAUDE.md rule 11 allows `localStorage` only for sound and quality preferences).
- **Mobile:** a bottom sheet opened from a button next to Prev and Next, sharing the sheet the checkpoint panel uses (one sheet at a time).
- **Above the list:** five **section buttons** (Education, Projects, Experience, Skills, Contact). One click drives to that station and opens it.
- **The list:** the route drawn as a **vertical transit line**, start at the top.
  - Coloured per zone: **sodium orange** Exchange District, **red-orange** downtown, **grey-green** residential, **blue** avenue, **gold** The Forks.
  - **Small dots** are the stops; **larger ringed circles** are the section stations, each with a coloured tag (the section name).
  - A **cyan ring with a small car** marks "you are here". It moves along the line as the car drives.
- **Project list:** below the route, every project in `projects.ts` (the six with a route stop, plus Game Hub and AV Device Controller, which have none). Choosing one opens its details (the same content as the checkpoint panel, in the side panel or the sheet), so **every project is readable without entering the library**. A project with a route stop also has a "Drive to it" button there.
- **Footer:** the resume (PDF) and a link to the Contact station, so the resume and contact details are reachable in two clicks on every device.

### Zone colours

Zones follow `atmosphere.ts`: `exchange`, `downtown`, `shelter` (residential), `avenue`, `forks`. The straight between City services and Portage & Main has no zone of its own and takes downtown's colour on the map. Colours are UI tokens (they sit on `night-2`, not in the 3D world palette), proposed as, to be tuned by eye:

| Zone        | Colour                   | Proposed  |
| ----------- | ------------------------ | --------- |
| Exchange    | sodium orange (`street`) | `#FFB25C` |
| Downtown    | red-orange               | `#E8603C` |
| Residential | grey-green               | `#7E9486` |
| Avenue      | blue                     | `#5B86D6` |
| The Forks   | gold (`sunrise-to`)      | `#FFD27A` |

Each must keep at least 3:1 contrast against `night-2` for the line and dots (WCAG 1.4.11), and the tags must keep 4.5:1 for their text; the plan adds a contrast unit test over these tokens.

### Behaviour

- Choosing a project from the list **opens its details** in place; the car does not move unless the visitor presses "Drive to it".
- Choosing a stop or station **drives there**. Under reduced motion the car **cuts** there. Going to a station drives to its red light and opens it for you; going to a stop drives to the stop.
- A **live status line** (`role="status"`) announces progress: "Driving to Portage & Main…", then "Arrived: Portage & Main" (the checkpoint panel's own announcement is not repeated).
- **Keyboard:** the menu is a `nav` landmark ("Route map") with the section buttons and an ordered list of buttons. Each button's name says what it is and its state ("Portage & Main, stop 6 of 12", "Education, section station, current"). The current item has `aria-current="location"`. The collapse button has `aria-expanded`. Esc closes the sheet on a phone and returns focus to the button that opened it. Tab order: drive controls, menu, panel.
- The line, dots and car are SVG with `aria-hidden`; the list is the accessible UI.
- The data is already in `stops.ts`, `stations.ts` and `atmosphere.ts`; the zone-to-colour map and the `t` to position map are pure functions in `src/lib` with tests.

## Projects station: the library

The Projects station is the **browse hub** for projects. The route stops stay as drive-bys; the library lists the same projects and sends the visitor to them.

- **Arrival.** The usual red light and Open button, then the car parks in front of the library. The camera then **moves inside**, through the door, to a room where **projects are books on a shelf**. Under reduced motion it cuts inside.
- **The room.** A real interior inside the library's footprint (the shell is hollow), warm light, one instanced shelf, and one book (instanced box) per project in `projects.ts`, **all of them**, including the two with no route stop (Game Hub and AV Device Controller). A desk lamp glows. It only draws when the camera is near.
- **Selecting a book.** Each book is also a button in a real DOM list (the shelf's accessible UI; the 3D books are the visuals that follow the selection). Arrow keys move along the shelf, Enter opens a book. The book's details open as DOM, reusing the checkpoint panel content (`resolveCheckpoint`): tagline, problem, what was built, stack and links.
- **"Drive to it".** A button on the details. It leaves the library (camera back out, car backs out of the bay, or a cut under reduced motion), drives to that project's stop and opens its checkpoint panel. Projects that have no route stop (`stopId` unset in `projects.ts`: Game Hub and AV Device Controller) show the details without the button; for them the library is the only place in the 3D world, and the menu project list and `/simple` also have them.
- **Esc** from a book returns to the shelf; Esc from the shelf backs out of the station.
- The library's front wall also shows the lit-wall version of the shelf list for the moment before the camera goes inside (the stack of titles), so the station is never an empty wall.

## Experience station: the LIILAB office

- **Building.** An office with a glass front. The sign reads **"LIILAB · Sylhet, Bangladesh"**, in plain lettering, with the wording in `src/content/signage.ts` (the place matches `experience.ts`). The owner worked there in person, so there is no "(remote)".
- **Arrival.** The standard pattern: park in front of the glass, headlights light the front.
- **Monitors.** Behind the glass, desks with monitors. Each **monitor screen is real DOM placed in 3D** (the same transform as the wall content, one per monitor), showing one entry from `experience.ts`: the **LIILAB** entry, the **Industrial Project** (RRC Polytechnic, mobile app development, May to September 2025) and the **Sprint-Innovation 2025 win**. The list is also a normal list for keyboard and screen readers, in the same order.
- **Rule 10 note.** CLAUDE.md rule 10 says "no logos or trademarks of real organizations … in signage". A sign with an employer's name as plain words is not a logo, so the rule now says so. **Approved by the owner and updated in this PR:** the owner's own school, employers and projects may appear as plain lettering (as "RRC Polytechnic" already does); still no logos, crests, banners or brand marks, and no lettering, colours or typography copied from the real brand.

## Skills station

Skills move from the dashboard to their own **tech building** using the standard pattern. The wall shows the groups below; each skill is a list item with its name, its level as text ("level 4 of 5", also drawn as pips) and its note ("Learning", "Embedded side", and so on). Focusing or hovering a skill shows its note in place; there are no floating tooltips.

### Skill groups (from the owner)

| Group    | Skills                                                                        |
| -------- | ----------------------------------------------------------------------------- |
| Web      | TypeScript, React, Next.js, Vue, Angular, Tailwind, WordPress                 |
| Backend  | Node.js, Django, C# / .NET, SQL, Prisma, MongoDB, Firebase, Netlify Functions |
| Embedded | C, C++                                                                        |
| AI tools | Gemini, Groq Whisper, Claude Code                                             |
| Mobile   | React Native, Expo                                                            |
| Also     | Competitive programming (1000+ problems solved)                               |

All of it is `// TODO(content): verify`, including the levels, which are placeholders until the owner reviews them. The skills content is in `skills.ts` (see below).

### Changes to `skills.ts`

Done in the content PR that syncs the content with mahfuj.dev (`content/sync-mahfuj-dev`):

- A `category` field (`web`, `backend`, `embedded`, `ai`, `mobile`) replaced the dashboard `group` (`gauge`, `switch`, `indicator`, `preset`). `ui.ts` has the labels, and `/simple` follows the same categories.
- New skills: Tailwind, Netlify Functions, React Native and Expo. `C / C++` became two entries, `C` and `C++`. `Claude` became `Claude Code`, and `Groq / Whisper` became `Groq Whisper`. WordPress stays, under Web.
- The competitive programming line ("Also") stays in `profile.ts` highlights for now. The Skills station (5f) decides how the wall shows it, because a count of solved problems is not a 1 to 5 level.
- The AV Device Controller is a library book only (no route stop). Its stack stays C++17 and CMake.

### What the dashboard keeps

A small hint only: for example one gauge or badge that says there is a Skills station and jumps to it (one click). The gauges, switches, presets and their tooltips leave Phase 6.

## Contact station: The Forks

Contact is a station at the Forks market building, the end of the route. The red light is just before the roundabout (about t 0.97); the car parks in front of the market and the wall shows email, GitHub, LinkedIn, the resume (PDF) and the link back to mahfuj.dev, from `profile.ts`. Leaving the bay continues into the Phase 7 roundabout and the end-of-shift loop, then the reset to stop 1 with the "New patrol starting." line. The route and the `the-forks` stop are reshaped around the roundabout in Phase 7; the station's data is measured from the stop, so it follows. The phone number is not shown anywhere (owner decision).

## Station positions

Measured on the current route (1,123 m long). Stops: Ignition 0, Dispatch 30 m, RRC campus 91 m, warehouses 150 m, City services 212 m, Portage & Main 493 m, Dashcam 591 m, Arcade 638 m, Inspection 688 m, Warming shelter 741 m, CMHR 862 m, The Forks 1,123 m. Intersections: Princess St 97 to 117 m, Portage & Main 470 to 515 m.

| Station    | t about | Metres | Side  | Turn  | Red light about | Why there                                                                                                                                                                                                                   |
| ---------- | ------- | ------ | ----- | ----- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Education  | 0.081   | 91     | Left  | Left  | t 0.056         | The RRC campus is already here                                                                                                                                                                                              |
| Projects   | 0.245   | 275    | Left  | Left  | t 0.222         | The long straight (212 to 470 m, 12 m wide, no intersection). It sits between the early project stops (EventFlow, CivicTrack) and the later ones (RoleReady, Dashcam, Arcade, Inspection), so "Drive to it" goes either way |
| Skills     | 0.33    | 370    | Right | Right | t 0.307         | The same straight, 95 m on, on the other side so the two patterns differ, and 100 m clear of Portage & Main                                                                                                                 |
| Experience | 0.483   | 542    | Right | Right | t 0.46          | After the Portage & Main intersection and before Dashcam; the office sits among the downtown towers                                                                                                                         |
| Contact    | 0.97    | 1,090  | Right | Right | t 0.945         | The market building at The Forks, before the roundabout                                                                                                                                                                     |

- **Skills moves** from the earlier proposal of t 0.30 to **t 0.33** to make room for the library.
- The Library, Skills and Experience stations each need a **bay** (a gap in the plowed ridge and the tree rows, a short road patch, clear ground to the wall) and a **reserved footprint** so ordinary buildings leave it free, as the landmarks do.
- The magnet radius is 0.025 in `t` (about 28 m). Experience falls between Portage & Main (0.439) and Dashcam (0.526), 0.0435 from each; `effectiveRadius` shrinks the magnets so they do not overlap, and a test checks every station's light and bay are clear of other stops.
- The red lights are separate from the Princess St and Portage & Main signals, which stay as intersection lights. A station light is a mast arm on its own, or the nearest existing signal when there is one.

## Changes to what is already built

### RRC campus becomes the Education station

- **Panel.** At a station the side panel does not open. Its content moves to the wall (and the sheet on a phone). The project stops stay drive-bys with the side panel. `CheckpointPanel` and the wall become two presentations of one content surface fed by `resolveCheckpoint`, and a stop or station says which one it uses.
- **Landmark.** Not rebuilt. The wall rectangle is the curtain wall's lower floors (DOM over glass still reads); the recessed ground floor and the heritage panel stay. The glow stays: parked holds it at 1.
- **Bay.** The campus front is 7.5 m behind the road edge, behind the plowed ridge and the elms: it needs the bay (gap in the ridge and trees, a short road patch, clear ground). The campus is on the left, so the car turns left across the empty oncoming lane.
- **Camera.** The landmark focus lean (`landmarkFocus`) is replaced by the station camera pose while parked.
- **Traffic lights.** The signals are fixed green by design. Heads gain a per-head state (the lit lamp as data, written only when it changes) so the station light can go red.
- **Radio.** The RRC line plays on approach; the parked view adds none.
- **Tests.** The Education e2e changes from "panel opens" to "red light and Open button, Open parks and shows the wall, Esc backs out". The panel e2e keeps testing the project stops.

### The EventFlow stop and the other project stops

No change: they stay drive-bys. Each gains one thing, a way back to the library, in the form of the menu.

### Phase 6 shrinks

The dashboard skill widgets, their tooltips and the patrol log panel leave Phase 6, because the Skills and Experience stations replace them. What stays: the interior view, the windshield and wipers, and the props (flag, cup), plus the Skills hint.

### Phase 8 shrinks

The mini-map moves out (it is the transit-map menu, built earlier). Phase 8 keeps the U-turn, mobile polish and the keyboard-shortcut overlay.

## Audio (Phase 9)

Everything is **off by default**, never autoplays, is toggled from the HUD speaker button, and uses original or CC0 audio only (CLAUDE.md rules 6 and 8). Every sound has a caption.

| Sound                    | When                                                                      | Caption                                                            |
| ------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Radio-check chirp        | A station opens                                                           | "Radio check." (a line in `radio.ts`)                              |
| Engine and tires on snow | While the car drives; quiet when parked                                   | "[Engine and tires on snow]", shown once when sound is switched on |
| Short static burst       | On a transition (a jump, the camera moving inside the library, the reset) | "[Static]"                                                         |

Captions use the same caption area as the radio lines, and sound captions come from `src/content` (a `kind` of `sfx` on radio lines, or a small `audio.ts`). Under reduced motion the static bursts are dropped; the chirp stays because it marks the state change. The warming shelter stop stays quiet (rule 9).

## Phases and order

The new order, with sizes. A tag at the end of a group is the release.

| Phase | Name                                                   | Size        | What changes                                                                                                   |
| ----- | ------------------------------------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------- |
| 5a    | First two stops (RRC, EventFlow)                       | done        | Landmark pattern, checkpoint panel, captions                                                                   |
| 5b    | **Station arrival pattern** + Education                | L           | State machine, `stations.ts`, parking path, lit wall, red light, bays, convert RRC                             |
| 5c    | **Transit-map menu** (moved from Phase 8)              | M           | Left panel and sheet, section buttons, zone colours, jump with cut, live status, resume link, the project list |
| 5d    | Remaining drive-by stops, one PR each                  | S to M each | City services (CivicTrack), Portage & Main (RoleReady), Dashcam, Arcade, Inspection, Warming shelter, CMHR     |
| 5e    | **Projects station** (library)                         | M to L      | Building, interior room, books, details, "Drive to it". Needs the project stops from 5d                        |
| 5f    | **Skills station** + `skills.ts` categories            | M           | Building, wall, content change, `/simple` follows. **v0.5.0** when 5b to 5f are done                           |
| 5g    | **Experience station** (LIILAB office)                 | M           | Building, monitors as DOM in 3D (LIILAB and the Sprint-Innovation win)                                         |
| 6     | Interior and props (shrunk)                            | M           | Interior view, wipers, props, Skills hint on the dashboard. **v0.6.0**                                         |
| 7     | Ignition, The Forks, **Contact station**, end of shift | L           | Loading screen, roundabout, Contact station, sunrise, reset. **v0.7.0**                                        |
| 8     | Navigation polish (shrunk)                             | M           | U-turn (shares the path maths with the parking path), mobile polish, shortcut overlay, 2-click e2e. **v0.8.0** |
| 9     | Sound                                                  | M           | Toggle, engine and tires, radio chirp, static bursts, captions. **v0.9.0**                                     |
| 10    | Art pass                                               | L           | Hand-modelled landmarks, the car, the library and office detail. **v0.10.0**                                   |
| 11    | Performance, accessibility, launch                     | M           | Hardening, Lighthouse, custom domain. **v1.0.0**                                                               |

Why this order:

- **5b first**, before more stops, so the stops and stations built afterwards use the final presentation model and nothing is reworked.
- **5c second**, because the menu is how every later station and stop is reached and tested, and it only needs the data (stops, stations, zones). Stations appear in it as they are built.
- **5d before 5e**: the library's "Drive to it" needs the project stops to exist.
- The parking path and the Phase 8 U-turn share maths, so the primitives (lane to bay, arc, reverse) are built once in `src/lib` in 5b and reused.
- PROJECT_PLAN.md edits needed: §2.2 (stations), §2.3 (the dashboard becomes a hint; the patrol log goes), §2.4 (the transit-map menu replaces the mini-map), and the phase list above.

## The 2-click rule and `/simple`

Any stop, station, the contact details or the resume is at most **two clicks** from anywhere, on any device:

- **Stop or station:** open the menu (one click, none on a desktop where it is already open), choose it (one click).
- **A station:** a section button, one click (two on a phone, where the sheet opens first).
- **Contact and resume:** the menu footer, or the Contact section button.
- **A project:** the menu's project list, one click to open its details (so it is readable without entering the library, including the two with no route stop), or the library shelf, or its stop in the menu.

`/simple` is unchanged and still has all content, from the same files. It gains section anchors (`#education`, `#projects`, `#experience`, `#skills`, `#contact`). The `/simple` link stays in the corner and in the no-WebGL fallback. A Playwright test checks the two-click rule for every destination, with axe.

## Performance risks

| Risk                                    | Why                                                                                        | Mitigation                                                                                                                                         |
| --------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| DOM in 3D every frame                   | `Html transform` recomputes layout as the camera moves; CSS 3D text can blur on iOS Safari | Mount only when parked; one transform when the camera settles; no `occlude`; sheet fallback on small screens                                       |
| Many 3D DOM surfaces (monitors)         | The office has several screens                                                             | One transform helper, a handful of surfaces, mounted only when parked                                                                              |
| Fill rate with a wall filling the frame | The wall shader (grid and a 14-lamp loop) covers the screen, plus bloom and snow overdraw  | Headlights only in the wall light loop while parked; cap snow density near the camera; `low` tier skips bloom, uses the decal                      |
| The library interior                    | An interior room, a shelf and instanced books                                              | A hollow shell, instanced books and shelf, drawn only when the camera is near; about 3 draw calls                                                  |
| Draw calls                              | A building per station                                                                     | 4 to 6 frustum-culled meshes each; five stations add about 25, so about 95 against 150                                                             |
| Signal state                            | Instance colour writes                                                                     | A handful of heads, written only when a state changes                                                                                              |
| Menu in the DOM                         | A list of 12 stops, 5 stations and an SVG line, always mounted                             | Small; the car marker moves by transform; no layout work per frame                                                                                 |
| State machine bugs                      | Scroll, Prev/Next, menu jumps and Esc during a manoeuvre                                   | A pure reducer with exhaustive tests; a Playwright flow per station; manoeuvres are timed and skippable                                            |
| E2E time                                | SwiftShader is slow and several accessibility tests are already slow                       | Station tests use the `low` tier; one shared flow helper                                                                                           |
| Accessibility                           | Content in a hidden 3D container, or read twice; 3D books and monitors have no semantics   | The wall, monitors and books each have a real DOM list as their accessible UI; the sheet and the wall are never both exposed; axe on every station |
| Audio                                   | Several sounds at once, and autoplay rules                                                 | Off by default; a user action starts audio; one shared mixer; captions for everything                                                              |

## Content and rule changes needed

- `src/content/stations.ts` (new), validated, with integrity checks (known stops and landmarks, lights clear of other stops).
- `skills.ts`: done (see above).
- `signage.ts`: the library and LIILAB office wording. `ui.ts`: section labels, the menu, the status line.
- `projects.ts`: done in the content sync (Connexions Spectrum added as a library book; stacks and case study links follow mahfuj.dev).
- CLAUDE.md rule 10: updated in this PR (the plain-text-name exception, approved).
- Everything unverified is `// TODO(content): verify`.

## Open questions

None. The owner answered the earlier ones: the AV Device Controller stays C++17 and CMake with no Arduino or I2C, the Golden Rule entry is skipped, and the Mobile skills are React Native and Expo.
