import type { Station } from './schema';

/**
 * The section stations: where the car parks to show a section of the portfolio. Everything that
 * differs between stations is data here, so the scene and the UI hold no per-station constants
 * (docs/navigation-redesign.md).
 *
 * Distances are in metres along the road from the stop named by `stopId` (negative is before it).
 * - `light`: where the car stops at the red light; the signal mast stands a little past it.
 * - `bay`: the parking bay, which sits squarely in front of the lit rectangle on the wall. `turn` is
 *   which way the car turns in (and so which side of the road the building is on), `depth` the gap
 *   between the car's nose and the wall, `width` the bay width, and `clearBefore` and `clearAfter`
 *   how much road edge is cleared of plowed snow and trees before and after the bay.
 * - `camera`: the parked view, behind the car: metres back, metres up and the field of view.
 * - `wall`: the landmark whose wall is lit, and the lit rectangle on that wall in the landmark's
 *   own frame (`x` along the wall, `y` up, `z` the plane the rectangle lies on).
 * - `contentRef` and `teaserRef`: what the wall shows, from `experience.ts` or `projects.ts` (the
 *   library has none: its wall lists the books).
 * TODO(content): add the Education courses (the entry has none yet).
 */
export const stations: Station[] = [
  {
    id: 'education',
    section: 'education',
    stopId: 'rrc-campus',
    light: { offset: -20 },
    bay: { turn: 'left', depth: 3, width: 4.6, clearBefore: 12, clearAfter: 5 },
    camera: { back: 6.5, up: 4.2, fov: 45 },
    wall: { landmark: 'rrc-campus', rect: { x: -4, y: 1.7, z: -5, width: 9, height: 4.5 } },
    contentRef: 'rrc-diploma',
    teaserRef: 'sprint-innovation-2025',
  },
  {
    // The Millennium Library: no single entry, the wall lists the books (see library.ts).
    id: 'projects',
    section: 'projects',
    stopId: 'millennium-library',
    light: { offset: -23 },
    bay: { turn: 'left', depth: 3, width: 4.6, clearBefore: 12, clearAfter: 5 },
    camera: { back: 7, up: 4.6, fov: 45 },
    wall: { landmark: 'millennium-library', rect: { x: 0, y: 1.6, z: -8, width: 12, height: 6 } },
  },
  {
    // The Skills building, on the right of the route: no single entry, the wall shows the skill groups.
    id: 'skills',
    section: 'skills',
    stopId: 'skills-station',
    light: { offset: -23 },
    bay: { turn: 'right', depth: 3, width: 4.6, clearBefore: 12, clearAfter: 5 },
    camera: { back: 7, up: 4.6, fov: 45 },
    wall: { landmark: 'skills-station', rect: { x: 0, y: 1.6, z: -8, width: 12, height: 6 } },
  },
  {
    // The LIILAB office, on the right of the route: no single entry, the wall shows the entries.
    id: 'experience',
    section: 'experience',
    stopId: 'liilab-office',
    light: { offset: -23 },
    bay: { turn: 'right', depth: 3, width: 4.6, clearBefore: 12, clearAfter: 5 },
    camera: { back: 7, up: 4.6, fov: 45 },
    wall: { landmark: 'liilab-office', rect: { x: 0, y: 1.6, z: -7, width: 12, height: 6 } },
    entryRefs: ['liilab', 'industrial-project', 'sprint-innovation-2025'],
  },
  {
    // The market building at The Forks, at the end of the route, on the right: no single entry, the
    // wall shows the headline contact details.
    id: 'contact',
    section: 'contact',
    stopId: 'the-forks',
    light: { offset: -23 },
    bay: { turn: 'right', depth: 3, width: 4.6, clearBefore: 12, clearAfter: 5 },
    camera: { back: 7, up: 4.6, fov: 45 },
    wall: { landmark: 'the-forks', rect: { x: 0, y: 1.2, z: -6, width: 12, height: 4.4 } },
  },
];
