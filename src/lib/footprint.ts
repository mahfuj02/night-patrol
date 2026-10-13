/** Oriented rectangles on the ground plane, for keeping buildings off each other and the road. */
export interface Rect {
  /** Centre, in scene units. */
  x: number;
  z: number;
  /** Rotation about Y (three.js convention): local +x maps to (cos yaw, -sin yaw) in (x, z). */
  yaw: number;
  /** Size along local x and local z. */
  width: number;
  depth: number;
}

export type Point = [number, number];

/** The four corners, going around the rectangle. */
export function rectCorners(r: Rect): [Point, Point, Point, Point] {
  const ax: Point = [Math.cos(r.yaw), -Math.sin(r.yaw)];
  const az: Point = [Math.sin(r.yaw), Math.cos(r.yaw)];
  const hw = r.width / 2;
  const hd = r.depth / 2;
  const corner = (sx: number, sz: number): Point => [
    r.x + ax[0] * hw * sx + az[0] * hd * sz,
    r.z + ax[1] * hw * sx + az[1] * hd * sz,
  ];
  return [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)];
}

/** Corners and edge midpoints: enough points to test a rectangle against a road centre line. */
export function rectOutline(r: Rect): Point[] {
  const corners = rectCorners(r);
  const mids = corners.map((p, i): Point => {
    const q = corners[(i + 1) % 4]!;
    return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  });
  return [...corners, ...mids];
}

function project(corners: Point[], axis: Point): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const [x, z] of corners) {
    const d = x * axis[0] + z * axis[1];
    min = Math.min(min, d);
    max = Math.max(max, d);
  }
  return [min, max];
}

/** True when the rectangles overlap or come closer than `margin` metres (separating-axis test). */
export function rectsOverlap(a: Rect, b: Rect, margin = 0): boolean {
  if (
    Math.hypot(a.x - b.x, a.z - b.z) >
    Math.hypot(a.width, a.depth) / 2 + Math.hypot(b.width, b.depth) / 2 + margin
  ) {
    return false;
  }
  const ca = rectCorners(a);
  const cb = rectCorners(b);
  const axes: Point[] = [a, b].flatMap((r): Point[] => [
    [Math.cos(r.yaw), -Math.sin(r.yaw)],
    [Math.sin(r.yaw), Math.cos(r.yaw)],
  ]);
  return axes.every((axis) => {
    const [minA, maxA] = project(ca, axis);
    const [minB, maxB] = project(cb, axis);
    return maxA + margin > minB && maxB + margin > minA;
  });
}
