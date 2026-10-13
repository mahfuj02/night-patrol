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
 * - `contentRef` and `teaserRef`: what the wall shows, from `experience.ts` or `projects.ts`.
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
];
