# Art reference: stylized realistic winter night Winnipeg

Style guide for the 3D scene, written from the reference photos in `design/reference/`.

**The photos are reference only.** The folder is git-ignored. Never commit them, ship them, trace them, or use them (or crops, or colour-graded versions) as textures. Nothing in this repo may contain a logo, banner, or signage lettering copied from them. The notes below describe what the photos show, in our own words, so the guide stands on its own.

## Direction in one paragraph

Stylized realistic, not low-poly. Think of a graded film still: believable materials and lighting, simplified shapes, soft detail. The look comes from light and atmosphere (lamp halos, heavy falling snow, haze, packed-snow roads, emissive windows), not from geometry. Everything is original or CC0 and stays inside the performance budgets in PROJECT_PLAN §5.5.

## Photo index

| File           | Shows                                                                                                                                                                                                                            | Used for                                                                                                                                |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `image.png`    | Top-down view of downtown at night: two diagonal avenues crossing, orange-lit roads with car light trails, snow-covered flat roofs with mechanical units and steam                                                               | Road glow colour, roof snow, how sodium light reads against cold roofs                                                                  |
| `image1.jpg`   | Corner with a cylindrical glass atrium glowing blue-cyan from inside, brick base, corporate signage, amber and red traffic signals on a mast, large soft out-of-focus snowflakes, snow-packed intersection                       | Glass-glows-from-inside, snowfall bokeh, signal colours                                                                                 |
| `image2.jpg`   | Suburban crescent in a haze: hoar-frosted trees, sculpted snowbanks, one lantern-style lamp post, grey-brown overcast, a few lit house windows                                                                                   | Overcast sky, frost, snowbank shapes, warm lantern                                                                                      |
| `image4.png`   | Avenue at dusk: deep-blue clear sky, large low pink moon, a row of cobra-head lamps arching over the lanes, dark ruts in slush, bare trees as silhouettes, red tail-lights, green signals in the distance                        | The clear-sky stretch, road surface, lamp rhythm                                                                                        |
| `image5.png`   | Downtown avenue in heavy snow: bus with headlight glow, bare elm in the foreground, tall tower with irregular lit windows, heritage building with a domed corner at left, warm lamp halos                                        | Downtown mood, window patterns, snowfall density                                                                                        |
| `image6.png`   | Black-and-white elm-lined residential street in snowfall: massive trunks, interlocking branches, hydrant, footprints on the sidewalk, snow-covered parked cars, backlit haze                                                     | Elm canopy, tree silhouettes, depth haze                                                                                                |
| `image7.png`   | Red River College Exchange District campus by day: glass curtain wall with a dark mullion grid, rooftop lettering, printed-heritage-facade glass section, cream limestone and red-brick neighbours, signals and street furniture | RRC landmark (see its own section)                                                                                                      |
| `image8.jpg`   | A plaza with a large glowing magenta word sign, lavender-lit frosted trees, flat trampled snow, a glass tower at the edge, mauve overcast                                                                                        | The Forks / Human Rights Museum stretch, coloured accent lighting                                                                       |
| `image9.jpg`   | A chalet among snow-laden conifers under a mountain, pink-gold clouds                                                                                                                                                            | **Off-brief: not Winnipeg** (mountains and conifers). Use only as a loose reference for sunrise cloud colour. Never copy its landscape. |
| `preview.webp` | Back lane: wooden power poles with crossarms and wires, a cobra lamp with a big halo, city bins, wooden fence, garages, tyre tracks in fresh snow, thick green-grey haze                                                         | Back-lane props and the lamp-in-fog look                                                                                                |

## What the photos tell us

### Road surface: packed snow and slush, not asphalt

- Roads are never clean black. They are packed snow and slush with two dark tyre ruts per lane, a lighter ridge between them, and slush banked along the edge. Lane markings are mostly invisible.
- Under blue twilight the road reads blue-grey (`#27375B` average); under sodium it reads warm grey-beige; in fog it reads green-grey. The same material, tinted by the light.
- Back lanes and side streets are fresher snow with a few tyre tracks and footprints. Sidewalks are trampled white.
- Snowbanks are big, soft, sculpted, and slightly dirty near the road. In the scene they are one continuous plowed ridge along each road edge with gentle lumpy variation, broken only at intersections.
- Specular: dull, with a soft sheen on the ruts where slush is wet. No mirror reflections.

### Lighting

- **Avenues:** cool white LED cobra-head lamps on tall poles with curved arms, evenly spaced, so they form a rhythm that recedes toward a vanishing point. Each lamp has a visible halo in snow and haze. The lamp head itself is clipped white.
- **Downtown:** warm sodium-orange wash on the roads and lower facades, much stronger and more saturated than the avenues.
- **Lantern posts** (residential): single warm-white lantern heads on short black posts.
- **Headlights and tail-lights** bloom in falling snow. Tail-lights are red, headlights warm white.
- **Traffic signals:** yellow housings with black visors, amber/red/green lenses, often mast-mounted. Cheap, and a distinctive local detail.
- Light pools are visible as cones in the haze. Fake them with soft sprites and fog, not real lights.

### Sky

- Snowy sections: low overcast with a city glow. It is grey-green near fluorescent or LED areas (the back lane) and grey-brown or orange-tinged near sodium. The horizon is brighter than the zenith, with no stars.
- One clear stretch: deep blue (`#24437E` at the top, `#3F5B98` at the horizon) with a large, low, slightly pink moon. This is the only place the moon appears.
- Sunrise at The Forks: peach and gold clouds against clear blue (see palette).

### Trees: bare elms

- Winnipeg's avenue canopy is elm. Trunks are thick and forked low, branches arch up and across the street and interlock overhead. In the dark they are near-black silhouettes against the lit haze.
- Frosted trees (`image2`) go light grey-white and catch lamp light. Use for a few hero moments.
- Implementation: real 3D procedural trees (3 to 4 merged variants, instanced with a random turn and about 15% scale variation): a tapered trunk with a slight base flare that forks at 2 to 3 m into 3 to 5 limbs arching up and outward in a vase shape, then smaller branches, with small twig planes at the tips only. Dark grey-brown bark (never black), lit by lamps and headlights, with snow dusting upward-facing surfaces. No canopy picture cards and no trunk in any texture. Rows stand behind the snow ridge with the long limbs turned to the road, so avenue branches arch over it.

### Back lanes (side-detail stretches)

In the scene these belong to the residential stretch (the dashcam stop through the avenue): houses and garages set back behind the elm rows, with the lanes running behind them.

- Wooden utility poles with crossarms, drooping wires, and a lamp bracket. Poles are tall, grey-brown and weathered.
- City bins (blue recycling, dark green or charcoal garbage), usually lined along the fence.
- Wooden plank fences and flat-roofed or gabled garages with beige siding and snow on the roof.
- Parked cars buried in snow. Hydrants.
- Use these as sparse instanced props on the route sides. Wires are a few thin ribbons, not geometry per cable.

### Atmosphere

- **Snowfall:** heavy. Two layers: lots of small fast flakes, and a few large soft out-of-focus discs close to the camera (the bokeh seen in `image1`). Flakes are brighter near lights and lamp halos. Wind angles the fall.
- **Haze and fog:** thick and tinted by the local light (green-grey in a lane, warm near sodium, blue under a clear sky). Distant lamps become soft glows long before they resolve.
- Reduced motion: a static, fewer-flake variant. No streaking.

### Downtown buildings and windows

- Towers are tall slabs with a regular window grid in which about a quarter to a third of windows are lit, in a random pattern, with a mix of warm and cool white. Upper floors are darker than mid floors. Dark mass reads as the building.
- Mechanical boxes, parapets and steam plumes on roofs; the snow-covered flat roof is bright against dark streets from above.
- Heritage buildings: dark stone with arched windows and a rounded or domed corner, lit softly from street level.
- Brick low-rises in the Exchange District: red-brown brick, regular small windows, with faded painted wall signs ("ghost signs") on side walls.
- Glass atrium bases glow from inside in cool cyan-blue and are the brightest surface on their block.

### RRC Exchange District Campus (landmark, hand-modelled)

From `image7.png`. Model it as a stylized silhouette, not a copy.

- **Form:** a boxy glass block about five storeys high, set on a recessed ground floor, with a lower step on the left.
- **Curtain wall:** blue-green glass in a strict grid. Most bays have panes divided by thick **dark mullions** in a repeating cross pattern that varies bay to bay; the left face is a finer, continuous grid of narrow vertical panels with a dark vertical slot at the corner.
- **Printed heritage facade:** a projecting glass panel mid-height on the right whose glass is printed with a pale image of an old arched-window brick facade (frosted, light grey-white). A signature detail. Render as a flat emissive-ish panel with an original arched pattern (our own drawing, not a trace of the photo).
- **Rooftop letters:** large serif capitals on a thin frame above the roof, with horizontal hairline strikes through them. **Our text is "RRC Polytechnic". No college logo, no banner, no crest anywhere.**
- **Neighbours:** a cream limestone heritage building on the right (arched windows, cornice, a gabled door canopy at street level), and a red-brick building on the left with faded painted signs on its wall.
- **Street furniture at the corner:** yellow-housed traffic signals, black lamp posts with curved arms (one with a teal-green arm), street-name blades, a bus stop pylon, bare small trees, snow piles, concrete barrier. Keep it simple: signal heads and lamp posts are the important ones.
- **At night:** the whole glass wall glows from inside, with a warm-to-cool mix, and the dark mullion grid reads as silhouette against it. The printed-heritage panel glows brightest and coolest. The limestone neighbour is lit warm from street lamps; the brick wall stays darker with its sign barely visible. Yellow signals add a small accent.
- Do not copy or recreate the college logo, the hanging banner, or other signage text from the photo.

### Other distinctive things

- **Glowing word sign at the plaza** (`image8`): large, magenta-violet, with a hot pale core and a soft halo; frosted trees around it pick up lavender. Use coloured accent light at The Forks and the Human Rights Museum stretch only. If we show a sign, set our own wording from `src/content` in our own lettering.
- **Glass tower at the plaza edge** (`image8`): cool teal glass with faint warm window dots; it reads as a pale slant against a mauve sky.
- **Aerial** (`image.png`): useful for the skyline only. Roads form a bright diagonal cross of orange light; roofs are cold blue-grey.
- **Steam plumes** rising from rooftops catch lamp light.
- **Corporate signage and bus liveries** appear in several photos. Do not reproduce any of it; vehicles and signs stay generic.

## Colour palette

UI colours (night, night-2, snow, street, hud, brick, sunrise) are unchanged and keep their jobs in HUD and panels. The **world palette** below is for the 3D scene and was sampled with a script (k-means clusters, region means, and brightest-1% means) from the photos. Camera white balance is unreliable, so "Basis" says what was sampled and what was adjusted.

| Token                 | Hex                    | Basis                                                                                              |
| --------------------- | ---------------------- | -------------------------------------------------------------------------------------------------- |
| `sky-clear-zenith`    | `#24437E`              | Sampled: `image4` sky, top                                                                         |
| `sky-clear-horizon`   | `#3F5B98`              | Sampled: `image4` sky, near horizon                                                                |
| `moon-low`            | `#BC90A5`              | Sampled: `image4` moon disc (low, pinkish)                                                         |
| `sky-overcast-green`  | `#5E6B60`              | Sampled: `preview` sky (lane haze)                                                                 |
| `sky-overcast-grey`   | `#4A4647`              | Sampled: `image2` sky near horizon                                                                 |
| `sky-overcast-orange` | `#77614C`              | Derived: `sky-overcast-grey` blended 25% toward `street` (no photo shows this directly)            |
| `night`               | `#0B1426`              | Kept. Matches the darkest samples (`#0A0D17`, `#0A0D19`)                                           |
| `shadow`              | `#050809`              | Sampled: `image5` darkest cluster                                                                  |
| `sodium`              | `#FFB25C`              | Kept as `street`. Samples of warm highlights: `#D19A6F` to `#E3A18D`                               |
| `sodium-glow`         | `#C3A465`              | Sampled: `image` road glow mean                                                                    |
| `sodium-core`         | `#FDE2A4`              | Sampled: `image` warm highlights (lamp cores)                                                      |
| `led-core`            | `#DDDFD7`              | Sampled: `image5` lamp core                                                                        |
| `led-halo`            | `#8EAABA`              | Sampled: `image5` glow region (cool, bluish)                                                       |
| `lantern`             | `#E1E1DD`              | Sampled: `image2` lantern                                                                          |
| `signal-yellow`       | `#E0A63E`              | Sampled: `image7` warm highlights (signal housing and lamp)                                        |
| `signal-green`        | `#4FE08A`              | Derived: lit green lamp on the traffic lights (tune by eye)                                        |
| `signal-pole`         | `#3C4046`              | Derived: dark steel for signal masts and sign posts                                                |
| `sign-red`            | `#B3262B`              | Derived: stop sign red (generic; no logos or lettering other than STOP)                            |
| `taillight-red`       | `#E0262E`              | Derived: saturated red for tail-lights; `image4` shows them red, sampled highlights are washed out |
| `window-warm`         | `#E8B27A`              | Derived: `image5` `#D19A6F` lifted for emissive use                                                |
| `window-cool`         | `#B9D3E0`              | Derived: `image5` `#C2C9C9` and `image1` `#E4F5FB`, cooled                                         |
| `glass-day`           | `#8FA3B5`              | Sampled: `image7` glass                                                                            |
| `glass-glow`          | `#3B5D78`              | Sampled: `image1` atrium body at night. Hot spots go to `#E4F5FB`                                  |
| `mullion`             | `#242426`              | Sampled: `image7` dark cluster                                                                     |
| `brick`               | `#8A4B3A`              | Kept (daylight brick)                                                                              |
| `brick-night`         | `#5D3C39`              | Sampled: `image1` brick under night light                                                          |
| `brick-faded`         | `#77625E`              | Sampled: `image7` wall with faded signs                                                            |
| `limestone`           | `#B5AB9E`              | Sampled: `image7` cream limestone (day; multiply down at night)                                    |
| `tower-concrete`      | `#6E7279`              | Derived: grey concrete towers (day; tune by eye)                                                   |
| `tower-glass`         | `#3A4656`              | Derived: dark glass curtain wall (tune by eye)                                                     |
| `siding-cream`        | `#A39C8E`              | Derived: house siding, pale (tune by eye)                                                          |
| `siding-blue`         | `#66737F`              | Derived: house siding, blue-grey (tune by eye)                                                     |
| `siding-grey`         | `#7C7F80`              | Derived: house siding, grey (tune by eye)                                                          |
| `siding-red`          | `#7A4A44`              | Derived: house siding, brick red (tune by eye)                                                     |
| `snow-roof`           | `#B9BDC4`              | Derived: snow on roofs, a little darker than fresh snow                                            |
| `snow`                | `#E8EEF5`              | Kept (highlights, fresh snow)                                                                      |
| `snow-packed`         | `#969089`              | Sampled: `image2` snow under haze                                                                  |
| `snow-twilight`       | `#27375B`              | Sampled: `image4` road and snow under blue light                                                   |
| `slush`               | `#B2A9A1`              | Sampled: `image7` pavement slush (day; multiply down at night)                                     |
| `rut`                 | `#181C28`              | Derived: between `image4` `#141D35` and `image2` `#1C1B1B`                                         |
| `tree-silhouette`     | `#060E11`              | Derived: `image5` clusters `#050809` and `#07161A`                                                 |
| `wood-pole`           | `#4B4238`              | Derived: `preview` pole `#51584B` with its green cast removed                                      |
| `bark`                | `#3A332C`              | Derived: dark grey-brown elm bark from the trunk tones in `image5` and `image6` (never pure black) |
| `bin-blue`            | `#2D4A6B`              | Derived: blue bins in `preview` (no clean sample)                                                  |
| `bin-green`           | `#2E4A3A`              | Derived: city garbage bin (tune by eye)                                                            |
| `bin-grey`            | `#3A3E44`              | Derived: city bin, dark grey (tune by eye)                                                         |
| `fence-wood`          | `#5A4C3E`              | Derived: back-lane wooden fence                                                                    |
| `fence-weathered`     | `#6B6259`              | Derived: weathered grey fence boards                                                               |
| `forks-magenta`       | `#AD76AE`              | Sampled: `image8` sign glow. Deep `#791F7C`, pale core `#E8BDE2`                                   |
| `sunrise-cloud`       | `#F0CBBF`              | Sampled: `image9` warm highlights, used for cloud tint only                                        |
| `sunrise`             | `#FF8A5B` to `#FFD27A` | Kept                                                                                               |

Notes:

- Treat "derived" rows as starting points to tune by eye in the scene.
- Emissive values go through bloom and tone mapping, so keep emissive colours saturated and let intensity do the work.

## Section-by-section mood

| Section                                          | Sky                                            | Light                                                                               | Surface and props                                                                                                    |
| ------------------------------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Exchange District (stops 1-4)                    | Overcast, grey-brown with a sodium tint        | Sodium lamps on short poles, warm window glow, RRC glass wall glowing               | Brick low-rises with faded signs, limestone neighbour, narrow packed-snow streets, bare small trees, back-lane props |
| Portage & Main approach (stop 5)                 | Overcast, wind-blown snow                      | Wide avenue, cool LED cobra-heads with big halos, tall towers with lit-window grids | Slush with dark ruts, the open "windy" feel: heavier snow streaks, banks along both edges                            |
| Downtown (stops 6-8)                             | Orange-tinged overcast                         | Strong sodium wash, tower windows, signal accents                                   | Dense towers (instanced), steam, a heritage corner building                                                          |
| Residential house scenery (near the dashcam)     | Calm, snow thinner                             | Warm lit windows only; no figures, no drama                                         | Low building, soft light spill on snow, quiet                                                                        |
| Human Rights Museum and Esplanade Riel (scenery) | The clear stretch: deep blue with the low moon | Glowing tower, lit bridge spire, coloured accent light                              | Elm silhouettes arching over the road before the clearing                                                            |
| The Forks (stop 11)                              | Clear to sunrise: blue to peach and gold       | Magenta accent fades into dawn light                                                | Frozen-river trail lights, market building, sunrise grade                                                            |

## Implementation guidance

- **Buildings:** procedural boxes with a few shape variants, instanced. Downtown towers vary in height and footprint; Exchange low-rises are brick with regular windows. No textures per building.
- **Windows:** a shader draws the grid in world or object space: lit or unlit chosen by a hash of the cell, warm or cool by another hash, brighter on mid floors, a little flicker-free noise in intensity. Output is emissive so bloom lights it. One material, parameterised per instance.
- **PBR:** CC0 textures only (Poly Haven, ambientCG) for snow, slush, brick, concrete and similar. Each used asset is credited in the README with name, source and licence. Textures are resized and compressed (KTX2 or WebP) and tiled, with a few shared across all buildings.
- **Landmarks:** hand-modelled detail only for real Winnipeg landmarks. No purchased or downloaded city models.
- **Quality tiers:** `high` and `medium` use PBR maps; `low` uses 512² colour-only maps (no normal or roughness), uses fewer buildings and fewer trees, fewer flakes, and no bloom.
- **Reduced motion:** static or very slow snow, no flicker, no camera shake.
- **Shelter stop:** nothing here changes the rule: warm windows, a quiet captioned line, and links only.
- **No logos or trademarks.** Landmarks are silhouettes, with only the text allowed by the content files.
