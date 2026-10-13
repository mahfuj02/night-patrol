# Cross streets, traffic lights and stop signs

Side streets at the intersections, and what stands at their corners.

## Data

Each entry in `intersections` in `src/content/route.ts` can have:

| Field     | Meaning                                                                                                           |
| --------- | ----------------------------------------------------------------------------------------------------------------- |
| `street`  | `{ width, length, skew? }`: the cross street, in metres (and degrees off square). Without it the gap stays empty. |
| `control` | `signals` (traffic lights), `stop` (stop signs on the cross street) or `none`.                                    |

`halfLength` (the gap in the ridge, tree rows and building rows) has to be at least half the street width plus 3 m; `pnpm test` checks that. The stop sign lettering ("STOP", nothing else) is in `src/content/signage.ts`.

| Intersection    | Street | Control |
| --------------- | ------ | ------- |
| `princess-st`   | 8 m    | signals |
| `portage-main`  | 12 m   | signals |
| `residential-a` | 7 m    | stop    |
| `residential-b` | 7 m    | stop    |
| `residential-c` | 7 m    | stop    |

## Roads

`Road/crossStreets.ts` turns every intersection with a street into two straight arms running away from the route from the centre of the gap, each as a path (`PathModel`) that the ridge and building layouts can use. All arms are drawn as one road mesh with the same packed-snow and rut shader as the route, and one ridge mesh with the same plowed snow (`CrossStreetRoads.tsx`). The ridge tapers away near the junction, like the route's ridge at its gaps. The streets run on into the haze; there are no streetlights along them yet.

## Buildings

`buildBuildings` takes the crossings and lines the first 70 m of each arm in the style of the stretch the crossing sits in (an attached wall of warehouses at Princess St, towers at Portage & Main, houses in the neighbourhood). Arm buildings avoid the route, every cross street and each other, and share the lighting of their crossing's zone. The main layout is unchanged by them (a test checks).

## Traffic lights

At a `signals` crossing there are four mast arms: two for traffic on the route (one each way, on the right of the road, with a head over each lane) and one for each end of the cross street. The route heads show green, the cross-street heads red, and the state is fixed (no animation, so nothing changes under reduced motion). A head is a yellow housing with three lamps; the lit lamp is an unlit material brighter than 1, so the bloom pass gives it a soft glow, plus a halo and a faint green or red pool of light on the snow ahead of the head. The design is generic: no logos or marks (CLAUDE.md rule 10).

Six instanced meshes, six draw calls: poles, arms, housings, lamps, halos and pools (`Signals/Signals.tsx`). The layout is in `Signals/signalLayout.ts`, with tests.

## Stop signs

At a `stop` crossing a stop sign stands on the right of each end of the cross street, facing traffic that comes up to the route: a post and an octagon with a red face, white border and the lettering (`StopSigns.tsx`, two draw calls). The face has a little glow of its own, as reflective sheeting catches the headlights.

## Cost

Measured by counting GL draw calls per frame (SwiftShader): about 62 on high and medium and about 41 on low, up from 50 and 29 before this slice.
