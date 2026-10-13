# Back lanes

The scenery behind the houses of the residential stretch, seen between and above the houses.

## Data

`src/content/backLanes.ts`: `poleSpacing`, `poleOffset` (how far behind the house row the pole line runs), `poleHeight`, `fenceHeight`, and the chance that a house has fences or bins. Everything follows the `house` stretches in `src/content/buildings.ts`, including the houses along the cross streets.

## What is there

- **Power poles** on a line behind the houses on each side of the route, staggered by half a spacing, with a cross arm and three wires that sag between neighbouring poles (across a cross street too). A pole blocked by a building or a cross street slides along the lane to the nearest free spot; poles never stand in an intersection gap.
- **Fences** along the back lot line behind the garage, and down one side of most lots. Fences skip any spot a building or garage is in.
- **City bins**, two side by side, against the back of many houses (blue, green or grey, with snow on top).

All of it is lit by the nearest streetlights and the headlights, and dusted with snow, like the trees (`patchTreeMaterial`).

## Cost

Five draw calls: poles, cross arms, wires (one line mesh), fences and bins. The low tier keeps every pole and wire and only every other fence and bin. Layout is in `src/scene/BackLanes/backLaneLayout.ts`, with tests (no overlaps with buildings, poles clear of the cross streets, wires sag below the arms).

Measured by counting GL draw calls per frame (SwiftShader): about 65 on high and medium and about 44 on low, up from 60 and 39 before back lanes.
