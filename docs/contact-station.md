# The Contact station (The Forks)

The Contact station is the fifth and last section station (Phase 5h). The car parks in front of the market building at The Forks, at the end of the route, on the **right**, and a panel lists the ways to reach the owner. It replaces the contact lines of the old end-of-shift stop.

## What the visitor gets

- **The building.** A long low brick hall with a taller glazed market hall behind its middle under a snowy gable, and a string of warm lights along the eaves that brightens as the car arrives. No lettering and no logo. Four meshes.
- **Arrival.** The usual station pattern (red light, Open button, the bay), turning in to the right, with the radio line "Shift complete." The lit wall shows the email and the portfolio address, as a picture only.
- **The panel** (side panel on a wide screen, bottom sheet on a phone), real DOM: email, LinkedIn, GitHub, the main portfolio at mahfuj.dev and the resume (PDF). They are the same links as `/simple`. The phone number is never shown.
- Nothing takes focus on open. Escape, the Leave button or the close button backs the car out.

## How it works

| Part              | Where                                                                                                                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stop and landmark | `the-forks` in `stops.ts` (kind `contact`, the end of the route), `forksPlacement` (side `1`, the right, 2 m before the last point) in `placement.ts`, `forksModel.ts`, `ForksMarket.tsx` |
| Station data      | The `contact` entry in `stations.ts` (`turn: 'right'`, no `contentRef`)                                                                                                                   |
| Content           | `profile.ts` (email, links, `resumeUrl`)                                                                                                                                                  |
| Logic             | `src/lib/contact.ts`: `contactItems`, shared by `/simple` and the panel                                                                                                                   |
| UI                | `src/ui/Contact/`: `ContactPanel`, `ContactWall`; `StationWall` shows `ContactWall` and opens no sheet of its own for a station with no single entry                                      |

## The route here

The last 75 m of the road run straight so the station has a bay and a red light (`stationSites.test.ts` keeps them straight). That changed the end of the route, so the route is 1,108 m long (it was 1,092 m) and every stop's `t` moved a little. The Phase 7 roundabout and end-of-shift loop will reshape the end again; the station's data is measured from the stop, so it follows.

## Still to come in Phase 7

The loading screen, the roundabout, the sunrise and the reset to the first stop.
