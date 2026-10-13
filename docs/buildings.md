# Buildings

Procedural, instanced buildings along the route. No models, no textures per building.

## Data

`src/content/buildings.ts` lists stretches in route order. Each stretch runs from one stop to another (plus optional `fromOffset` / `toOffset` in metres along the road) and fills both sides of the road with lots of one style:

| Style       | Where                                                                                | Look                                                            |
| ----------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| `warehouse` | Exchange District (Ignition to City services)                                        | Brick, 10-24 m, dense windows, snow on a flat roof              |
| `tower`     | The straight into Portage & Main, then downtown                                      | Concrete and dark glass, 16-95 m, some with a smaller crown     |
| `house`     | The dashcam stop to near The Forks (a neighbourhood, with the station sites cut out) | Siding, gabled or flat roofs, few warm windows, detached garage |

`gap` is the space between neighbouring lots. A stretch whose largest gap is 1.5 m or less is an **attached street wall** (Exchange District, the Portage straight, downtown): lots touch and overlap slightly, run right up to each intersection (the last lot is shortened to fit), and step back a little on tight bends instead of leaving a hole. Houses keep gaps of 2.5-5 m and garages.

`setback` is the gap between the road edge and the building front. It has to clear the plowed ridge and the tree row (about 6 m); a test enforces at least 6.5 m. `lit` scales how many windows are lit from the zone's `windows` values in `atmosphere.ts`, so the shelter stays warm only and houses show just a few lit windows. `pnpm test` checks that stretches are in order, do not overlap and refer to real stops.

## Layout

`src/scene/Buildings/buildingLayout.ts` lays lots end to end on each side, with a gap per style. A lot is skipped where it would touch the road or another building, or by the stretch's `density`. Lots never cover an intersection gap (so side streets stay clear): the lot before it is shortened and the next starts after it. Every lot draws the same random numbers whether it is built or not, so changing one stretch never moves another. Colours come from the `world` palette.

`buildingParts.ts` turns buildings into three kinds of instance: wall boxes (including tower crowns and garages), gabled roofs, and thin snow slabs on flat roofs. `src/lib/footprint.ts` holds the rectangle maths (overlap, clearance), with tests.

## Window shader

One material for every wall (`Materials/buildingMaterials.ts`). The fragment shader draws an emissive grid from the metres along each face, so there is no texture per building. Each window rolls once from its cell and the building's seed: warm, cool, or unlit, using the share set by the zone and stretch. Unlit windows are dark glass. Brick detail is the `factory_brick` colour map, used for brightness only so the instance colour keeps control of the hue. On high and medium the `factory_brick` normal map adds relief, scaled per instance (full on brick warehouses, light on towers and houses); the low tier has the colour map only. The walls are also lit by the nearest streetlights and the headlights, like the trees.

## Porch lights

Most houses (80%) have a warm light beside the front door: one instanced glow sprite each (`PorchLights.tsx`, shared halo material), a single draw call. They are fake lights, like the streetlight halos, so they add no real light sources.

## Moonlight

The moon is a directional light that only the zones with `moon` above 0 use (the avenue, a little at the Forks). Its gain is 1 and it sits at a lower angle than before, so the walls of the avenue houses pick up some blue light.

## Cost

Four instanced draw calls on every tier (walls, gables, snow slabs, porch lights). About 97 buildings (134 wall boxes, 9 gables, 125 slabs, 20 porch lights): roughly 3,200 triangles. The `low` tier keeps the attached street walls whole and builds every other house (about 2,800 triangles). Textures: the brick colour map on every tier, plus the 512 normal map (81 KB) on high and medium.

## Cross streets

The first 70 m of every cross street is lined in the style of the stretch it crosses (see `docs/streets.md`).

## Back lanes

See `docs/backlanes.md`.

## Not yet

The landmarks (RRC campus, warehouses, City services, Portage & Main) are built; the stations and the museum and house scenery come in later slices. Street names and signs arrive with the signs.
