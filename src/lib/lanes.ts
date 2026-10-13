/**
 * Lane geometry for the road. Offsets are lateral distances in metres from the road centre line,
 * positive to the right of the direction of travel (Canada drives on the right).
 *
 * The same constants feed the road shader (where the wheel ruts are drawn), so the car's wheels
 * sit in the ruts of its lane.
 */

/** The driving lane's centre stays within these bounds, so it never jumps as the road widens. */
export const MIN_DRIVE_OFFSET = 1.4;
export const MAX_DRIVE_OFFSET = 2;
/** Distance between the centres of extra lanes, outward from the two driving lanes. */
export const OUTER_LANE_SPACING = 3.4;
/** Half the distance between the two wheel ruts of a lane: the car's wheels are at ±0.95 m. */
export const RUT_HALF_GAP = 0.95;
/** Extra lanes only exist where there is room: a lane centre must be this far inside the edge. */
export const OUTER_LANE_EDGE_MARGIN = 1.5;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Lateral offset of the centre of the right-hand driving lane for a road of the given width:
 * the middle of the right half, kept between 1.4 and 2 m. Continuous in `roadWidth`.
 */
export function driveOffset(roadWidth: number): number {
  return clamp(roadWidth / 4, MIN_DRIVE_OFFSET, MAX_DRIVE_OFFSET);
}

/**
 * Centres of every lane on a road of the given width, sorted left to right in the direction of
 * travel: the right-hand driving lane (positive), the oncoming lane (negative), and extra lanes
 * outward on each side wherever the road is wide enough.
 */
export function laneCentres(roadWidth: number): number[] {
  const drive = driveOffset(roadWidth);
  const half = roadWidth / 2;
  const centres = [-drive, drive];
  for (let k = 1; drive + k * OUTER_LANE_SPACING < half - OUTER_LANE_EDGE_MARGIN; k++) {
    const outer = drive + k * OUTER_LANE_SPACING;
    centres.push(-outer, outer);
  }
  return centres.sort((a, b) => a - b);
}

/** Lateral offsets of the wheel ruts for one lane centre. */
export function rutOffsets(laneCentre: number): [number, number] {
  return [laneCentre - RUT_HALF_GAP, laneCentre + RUT_HALF_GAP];
}
