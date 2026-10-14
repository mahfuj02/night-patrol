# The Experience station (the LIILAB office)

The Experience station is the third section station after Portage & Main (Phase 5g). The car parks in front of a small glass office on the **right** of the route, 940 m along, on the avenue, and a panel lists the experience entries. It replaces the old "patrol log" panel.

## What the visitor gets

- **The building.** A small three-storey glass office under a pale roof slab, with an entrance canopy, the sign **"LIILAB · Sylhet, Bangladesh"** in plain lettering (from `signage.ts`; the place matches `experience.ts`; no logo, rule 10) and two rows of lit "monitors" at desk height behind the glass. The monitors and the sign brighten as the car arrives. Five meshes.
- **Arrival.** The usual station pattern (red light, Open button, the bay), turning in to the right. The lit wall shows each entry's title, organisation and dates, as a picture only.
- **The panel** (side panel on a wide screen, bottom sheet on a phone), real DOM: the entries the station lists, in order. Today those are the **LIILAB** job, the **Industrial Project** (RRC Polytechnic, mobile app development, May to September 2025) and the **Sprint-Innovation 2025 win**, each with its title, organisation, dates, summary and bullets.
- Nothing takes focus on open. Escape, the Leave button or the close button backs the car out.

## How it works

| Part              | Where                                                                                                                                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stop and landmark | `liilab-office` in `stops.ts` (kind `section`, 940 m, a control point on the route), `officePlacement` (side `1`, the right) in `placement.ts`, `officeModel.ts`, `OfficeBuilding.tsx`                                           |
| Station data      | The `experience` entry in `stations.ts` (`turn: 'right'`, no `contentRef`, and `entryRefs` listing the entries to show)                                                                                                          |
| Content           | `experience.ts`, `signage.officeSign`                                                                                                                                                                                            |
| UI                | `src/ui/Experience/`: `ExperiencePanel` (and `experienceEntries`, which turns `entryRefs` into entries), `ExperienceWall`; `StationWall` shows `ExperienceWall` and opens no sheet of its own for a station with no single entry |

The avenue atmosphere zone and the transit map's avenue zone now anchor on this stop (before it existed they hung off The Forks by offset). The Education diploma stays on the Education station; it is not listed here.

## Content the owner supplies

Which entries the station lists is data (`entryRefs`); change it to add or reorder. All the entry wording is in `experience.ts` and marked for the owner's review there.
