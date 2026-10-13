/**
 * Paths for the car to turn into a parking bay and back out again. Pure maths on the ground plane:
 * a point is (x, z), and a heading is an angle `h` in radians where the car faces
 * `(sin h, cos h)`, the same convention as the car model (local +z forward, rotation about Y).
 */

export interface Pose {
  x: number;
  z: number;
  heading: number;
}

type Point = [number, number];

/** The direction a heading points in, as a unit vector (x, z). */
export function headingVector(heading: number): Point {
  return [Math.sin(heading), Math.cos(heading)];
}

/** The heading of a direction vector (x, z). */
export function vectorHeading(x: number, z: number): number {
  return Math.atan2(x, z);
}

/** A point on a cubic Bezier curve, for `s` from 0 to 1. */
export function bezierPoint(p0: Point, p1: Point, p2: Point, p3: Point, s: number): Point {
  const k = 1 - s;
  const a = k * k * k;
  const b = 3 * k * k * s;
  const c = 3 * k * s * s;
  const d = s * s * s;
  return [
    a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
    a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
  ];
}

/** The direction of travel (not normalised) along a cubic Bezier curve at `s`. */
export function bezierTangent(p0: Point, p1: Point, p2: Point, p3: Point, s: number): Point {
  const k = 1 - s;
  const a = 3 * k * k;
  const b = 6 * k * s;
  const c = 3 * s * s;
  return [
    a * (p1[0] - p0[0]) + b * (p2[0] - p1[0]) + c * (p3[0] - p2[0]),
    a * (p1[1] - p0[1]) + b * (p2[1] - p1[1]) + c * (p3[1] - p2[1]),
  ];
}

/** Smooth start and finish: 0 to 1 with zero slope at both ends. */
export function easeInOut(p: number): number {
  const k = Math.min(1, Math.max(0, p));
  return k * k * (3 - 2 * k);
}

export interface ParkingPath {
  /** The pose at `s` from 0 (the start) to 1 (the bay). */
  pose: (s: number) => Pose;
  /** Length of the path in metres, measured along the curve. */
  length: number;
}

/**
 * A smooth path from `start` (on the road, heading along it) to `end` (in the bay, heading at the
 * wall). The curve leaves the start along its heading and arrives along the end heading, so the car
 * never slides sideways. The handles scale with the distance, so a short hop and a long swing both
 * look right.
 */
export function parkingPath(start: Pose, end: Pose): ParkingPath {
  const a: Point = [start.x, start.z];
  const d: Point = [end.x, end.z];
  const distance = Math.hypot(d[0] - a[0], d[1] - a[1]);
  const [sx, sz] = headingVector(start.heading);
  const [ex, ez] = headingVector(end.heading);
  const handleOut = Math.max(distance * 0.45, 0.01);
  const handleIn = Math.max(distance * 0.4, 0.01);
  const b: Point = [a[0] + sx * handleOut, a[1] + sz * handleOut];
  const c: Point = [d[0] - ex * handleIn, d[1] - ez * handleIn];

  // Approximate the length with a polyline, which is plenty for timing and tests.
  let length = 0;
  let previous = a;
  for (let i = 1; i <= 24; i++) {
    const next = bezierPoint(a, b, c, d, i / 24);
    length += Math.hypot(next[0] - previous[0], next[1] - previous[1]);
    previous = next;
  }

  return {
    length,
    pose: (s) => {
      const k = Math.min(1, Math.max(0, s));
      if (k <= 0) return { ...start };
      if (k >= 1) return { ...end };
      const [x, z] = bezierPoint(a, b, c, d, k);
      const [tx, tz] = bezierTangent(a, b, c, d, k);
      return { x, z, heading: vectorHeading(tx, tz) };
    },
  };
}

/** The bay pose: the car's centre in the bay, facing the wall. */
export function bayPose(
  roadPoint: { x: number; z: number },
  toward: { x: number; z: number },
  distance: number,
): Pose {
  const length = Math.hypot(toward.x, toward.z) || 1;
  const hx = toward.x / length;
  const hz = toward.z / length;
  return {
    x: roadPoint.x + hx * distance,
    z: roadPoint.z + hz * distance,
    heading: vectorHeading(hx, hz),
  };
}

/**
 * The pose while backing out: the same path as driving in, played backwards, with the car still
 * facing the way it drove in (it reverses; it does not turn around).
 */
export function reversePose(path: ParkingPath, s: number): Pose {
  return path.pose(1 - s);
}
