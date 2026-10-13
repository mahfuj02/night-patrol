# Buildings

Procedural, instanced buildings along the route. No models, no textures per building.

## Data

`src/content/buildings.ts` lists stretches in route order. Each stretch runs from one stop to another (plus optional `fromOffset` / `toOffset` in metres along the road) and fills both sides of the road with lots of one style:

| Style       | Where                                               | Look                                                            |
| ----------- | --------------------------------------------------- | --------------------------------------------------------------- |
| `warehouse` | Exchange District (Ignition to City services)       | Brick, 10-24 m, dense windows, snow on a flat roof              |
| `tower`     | The straight into Portage & Main, then downtown     | Concrete and dark glass, 16-95 m, some with a smaller crown     |
| `house`     | Warming shelter to Esplanade Riel (a neighbourhood) | Siding, gabled or flat roofs, few warm windows, detached garage |

`setback` is the gap between the road edge and the building front. It has to clear the plowed ridge and the tree row (about 6 m); a test enforces at least 6.5 m. `lit` scales how many windows are lit from the zone's `windows` values in `atmosphere.ts`, so the shelter stays warm only and houses show just a few lit windows. `pnpm test` checks that stretches are in order, do not overlap and refer to real stops.

## Layout

`src/scene/Buildings/buildingLayout.ts` lays lots end to end on each side, with a gap per style. A lot is skipped where it would touch the road, another building or an intersection gap (so side streets stay clear), or by the stretch's `density`. Every lot draws the same random numbers whether it is built or not, so changing one stretch never moves another. Colours come from the `world` palette.

`buildingParts.ts` turns buildings into three kinds of instance: wall boxes (including tower crowns and garages), gabled roofs, and thin snow slabs on flat roofs. `src/lib/footprint.ts` holds the rectangle maths (overlap, clearance), with tests.

## Window shader

One material for every wall (`Materials/buildingMaterials.ts`). The fragment shader draws an emissive grid from the metres along each face, so there is no texture per building. Each window rolls once from its cell and the building's seed: warm, cool, or unlit, using the share set by the zone and stretch. Unlit windows are dark glass. Brick detail is the `factory_brick` colour map, used for brightness only so the instance colour keeps control of the hue. The walls are also lit by the nearest streetlights and the headlights, like the trees.

## Cost

Three instanced draw calls (walls, gables, snow slabs) on every tier. About 47 buildings (70 wall boxes, 10 gables, 60 slabs): roughly 1,600 triangles. The `low` tier builds every other building (about 900 triangles). Brick uses the 512 colour map on every tier (no normal or roughness yet).

## Not yet

Back lanes (poles, bins, fences), cross streets and traffic lights, and the landmarks (RRC campus, Portage & Main, CMHR) come in later slices. Street names and signs arrive with the signs.
