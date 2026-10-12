# Atmosphere and snow

How lighting and weather change along the route.

## Zones (data)

`src/content/atmosphere.ts` lists zones in route order. Each zone holds sky, fog, lamp type and colour, ambient light, snow density/wind/gust, moon, sunrise and window mix. It holds from its `from` stop to its `to` stop (plus optional `startOffset`/`endOffset` in `t`). The previous zone eases into it over `blend` (in `t`), ending where the zone starts. Colours are names from the world palette (`src/lib/palette.ts`).

`pnpm test` checks that zones are in order, refer to real stops, and that each blend fits the gap before it.

| Zone       | Stops                               | Look                                                                                                  |
| ---------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `exchange` | ignition to city-services           | Sodium lamps, heavy snow, orange-tinged overcast                                                      |
| `downtown` | portage-main to inspection-building | Sodium with cool windows, snow with strong gusts. Eases in over the second half of the long straight. |
| `shelter`  | warming-shelter                     | Cool, dimmer, light quiet snow                                                                        |
| `avenue`   | around cmhr-esplanade               | Cool LED, clear night, snow stops, big moon                                                           |
| `forks`    | late route                          | Warm lights, thin snow returns                                                                        |
| `sunrise`  | the end                             | Peach and gold sky                                                                                    |

## Blending

`src/lib/atmosphere.ts`: `sampleAtmosphere(zones, t)` returns the blended values (smoothstep between zones, colours per channel). `AtmosphereDriver` calls it every frame with the eased route progress and writes the result to a shared object that the sky, snow and lamps read. Lamp type and colour are fixed per lamp from the zone it stands in.

## Snow

`src/scene/Environment/Snow.tsx` is one `Points` draw call. Every flake has seeded random attributes; all motion (fall, wind drift, gust sway, flutter, wrapping around the camera) runs in the vertex shader. The CPU updates a few uniforms per frame, never per flake.

- **Layers:** near flakes (6%) are big, soft and fast; mid (30%) and far (64%) are smaller, crisper and slower.
- **Wind and gusts:** per zone. The wind offset accumulates on the CPU as a single vector, so changing wind never makes flakes jump.
- **Lamp light:** the 11 nearest streetlights and the two headlights are passed as cones. Flakes inside a cone get brighter and more opaque.
- **Density:** per flake threshold against the zone density; flakes above it are clipped in the vertex shader. At density 0 the draw is skipped.
- **Count by tier:** high 14,000, medium 7,000, low 2,500 (`src/lib/snow.ts`).
- **Reduced motion:** 40% of the flakes, 30% fall speed, no gusts.

## Comparing tiers

Open `/?quality=high`, `?quality=medium` or `?quality=low`. The tier is pinned and adaptive quality is off, so you can compare looks and fps. In development an overlay shows fps, draw calls and triangles.

## Road, ground and banks

- **Road** (`Road.tsx`, `Materials/surfaceMaterials.ts`): one ribbon with metric `uv` and an `aRoad` attribute (lateral offset, distance along, half width). The shader draws two ruts per lane, meandering and patchy, with `asphalt_snow` (colour, normal, roughness) in the ruts and `snow_02` on the ridges and edges. Lane count follows the road width. The bump map fades with distance and the asphalt grit blends to its average, because both shimmer at grazing angles. There is no painted centre line: markings are buried under snow in winter.
- **Snow ridge:** one continuous plowed ridge along each road edge as a single mesh, with gentle lumpy variation along its length, a crest nearer the road, and gaps only at the intersections listed in `src/content/route.ts`.
- **Ground:** `snow_02` sampled in world space at two blended scales (one rotated), so the footprint-like marks in the tile never visibly repeat. Banks are lumpy instanced mounds with a little grime near the ground. The ridge and ground share it. A faint sky-bounce glow, set from the blended ambient light, keeps snow readable far from lamps.
- **Tiers:** high and medium use the 1024² maps; low uses the 512² colour maps only. Textures load lazily behind a flat-colour fallback.

## Trees

`Environment/Trees.tsx`, `treeBuilder.ts`, `treeLayout.ts`: bare winter elms as real 3D trees, with no canopy cards and no trunk in any texture.

- **Shape:** a tapered trunk with a slight base flare that forks at 2 to 3 m into 3 to 5 limbs arching up and outward in a vase shape, then one or two levels of smaller branches, built as tapered tubes and merged. Four variants on high and medium, two with fewer branch levels on low. Small crossed twig planes (2 or 3 per cluster) sit at the branch tips only, with a procedural twig texture and alpha-to-coverage for soft edges.
- **Material:** dark grey-brown bark from vertex colours, lit by the nearest lamps (the lamp cone uniforms shared with the snow) and the headlights, with upward-facing surfaces blending to snow.
- **Placement:** regular rows 8 to 10 m apart along both sides, set back behind the plowed ridge, the two rows staggered. Each tree turns its long limbs toward the road, so on a lined avenue the branches from both sides arch over it. Rows follow each zone's `trees` density, stop at intersections and stay clear of lamp poles. The low tier plants half as many.
- **Cost:** about 1.1k triangles per high tree, about 0.4k per low tree, and two draw calls per shape.

## Post-processing

`Effects/Effects.tsx` (high and medium only): bloom on the bright lamp halos and light-lit snow, ACES tone mapping, a vignette, and film grain. The composer's MSAA (4 samples on high, 2 on medium) keeps the alpha-to-coverage twig edges smooth. Reduced motion drops the grain, because it is constantly shifting noise. The low tier skips post-processing entirely and renders straight to the screen with the renderer's own tone mapping. The choices per tier live in `effectsForTier` in `src/lib/quality.ts`.

Bloom adds blur passes, which count as draw calls: about 46 on high and medium against about 25 on low.
