# The Skills station

The Skills building is the second section station after Portage & Main (Phase 5f). The car parks in front of a tech building on the **right** of the route, 700 m along (the Library is on the left 100 m before it, so the two station patterns differ), and a panel lists every skill. It replaces the old dashboard gauges.

## What the visitor gets

- **The building.** A dark glass block with a rooftop plant and mast, an entrance canopy and cool accent light along the roofline, the corners and the mast tip (the accent light brightens as the car arrives). No lettering, no logo. Three meshes.
- **Arrival.** The usual station pattern (red light, Open button, the bay), turning in to the right. The lit wall shows each group and its skills on a line, as a picture only.
- **The panel** (side panel on a wide screen, bottom sheet on a phone), real DOM: the groups Web, Backend, Embedded, AI tools and Mobile, each skill with its name, its level as text ("Level 4 of 5") with pips drawn beside it, and its note in place (no tooltips). An **Also** group lists the lines that are not graded skills (`profile.highlights`, today "Competitive programming: 1000+ problems solved").
- Nothing takes focus on open. Escape, the Leave button or the close button backs the car out.

## How it works

| Part              | Where                                                                                                                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stop and landmark | `skills-station` in `stops.ts` (kind `section`, 700 m, a control point on the route), `skillsPlacement` (side `1`, the right) in `placement.ts`, `skillsModel.ts`, `SkillsBuilding.tsx` |
| Station data      | The `skills` entry in `stations.ts` (`turn: 'right'`, no `contentRef`)                                                                                                                  |
| Content           | `skills.ts` (categories and levels, all `TODO(content): verify`), the group labels `skillCategories` in `ui.ts`, `skills.levelOf` and `skills.also`                                     |
| Logic             | `src/lib/skills.ts`: `groupSkills`, `pips`                                                                                                                                              |
| UI                | `src/ui/Skills/`: `SkillsPanel`, `SkillsWall`; `StationWall` shows `SkillsWall` and opens no sheet of its own for a station with no entry                                               |

This is the first station on the right, so the landmark placement tests now check each landmark against its own `side`, and the station geometry tests run for every station (side, road clearance, the light before the bay, no trees or lamps in the bay, the pad).

## Content the owner supplies

The levels are placeholders until reviewed (`TODO(content): verify` in `skills.ts`). The "Also" line comes from `profile.highlights`.
