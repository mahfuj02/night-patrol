/** Route progress `t` runs 0..1 along the path. Pure helpers; no three.js here. */

/** How close (in `t`) the car must be to a stop for the magnet to act and the stop to count as "reached". */
export const MAGNET_RADIUS = 0.025;

/** Progress change per CSS pixel of wheel delta. One 100px wheel notch moves 3.5% of the route. */
export const WHEEL_SENSITIVITY = 0.00035;
/** Progress change per pixel of upward swipe. */
export const SWIPE_SENSITIVITY = 0.0006;
/** Progress change per arrow key press (and key repeat). */
export const KEY_NUDGE = 0.012;

const STEP_EPSILON = 1e-3;

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** Index of the stop whose `t` is closest to the given progress. */
export function nearestStopIndex(t: number, stopTs: readonly number[]): number {
  let best = 0;
  let bestDistance = Infinity;
  stopTs.forEach((stopT, i) => {
    const distance = Math.abs(stopT - t);
    if (distance < bestDistance) {
      best = i;
      bestDistance = distance;
    }
  });
  return best;
}

/**
 * Magnet radius for one stop, capped at half the gap to its neighbours so that the zones of
 * two close stops never overlap (which would make the magnet jump between them).
 */
export function effectiveRadius(
  index: number,
  stopTs: readonly number[],
  radius = MAGNET_RADIUS,
): number {
  const stopT = stopTs[index];
  if (stopT === undefined) return radius;
  let result = radius;
  const before = stopTs[index - 1];
  const after = stopTs[index + 1];
  if (before !== undefined) result = Math.min(result, (stopT - before) / 2);
  if (after !== undefined) result = Math.min(result, (after - stopT) / 2);
  return result;
}

/** True when progress is within the (effective) magnet radius of the nearest stop. */
export function isAtStop(t: number, stopTs: readonly number[], radius = MAGNET_RADIUS): boolean {
  const index = nearestStopIndex(t, stopTs);
  const stopT = stopTs[index];
  return stopT !== undefined && Math.abs(stopT - t) <= effectiveRadius(index, stopTs, radius);
}

/** `t` of the next (dir 1) or previous (dir -1) stop, clamped to the first and last stop. */
export function stepToStop(t: number, dir: 1 | -1, stopTs: readonly number[]): number {
  if (stopTs.length === 0) return clamp01(t);
  if (dir === 1) {
    const next = stopTs.find((stopT) => stopT > t + STEP_EPSILON);
    return next ?? stopTs[stopTs.length - 1]!;
  }
  for (let i = stopTs.length - 1; i >= 0; i--) {
    const stopT = stopTs[i]!;
    if (stopT < t - STEP_EPSILON) return stopT;
  }
  return stopTs[0]!;
}

/**
 * Eases progress toward the nearest stop. Inside the radius the mapping flattens near the stop
 * (so the car settles there) and meets the identity at the radius, so it stays continuous and
 * monotonic. `strength` 0 disables the effect; 1 gives a quadratic ease.
 */
export function applyMagnet(
  t: number,
  stopTs: readonly number[],
  radius = MAGNET_RADIUS,
  strength = 1,
): number {
  if (stopTs.length === 0 || strength <= 0 || radius <= 0) return t;
  const index = nearestStopIndex(t, stopTs);
  const stopT = stopTs[index]!;
  const zone = effectiveRadius(index, stopTs, radius);
  const distance = t - stopT;
  const u = Math.abs(distance) / zone;
  if (u >= 1) return t;
  return stopT + Math.sign(distance) * zone * Math.pow(u, 1 + strength);
}

/** Frame-rate independent exponential smoothing (same shape as THREE.MathUtils.damp). */
export function dampT(current: number, target: number, lambda: number, dt: number): number {
  return target + (current - target) * Math.exp(-lambda * dt);
}

const LINE_HEIGHT_PX = 16;
const PAGE_HEIGHT_PX = 800;

/** Converts a wheel event delta into a change in progress, for pixel, line and page modes. */
export function wheelToDelta(deltaY: number, deltaMode: number): number {
  const pixels =
    deltaMode === 1 ? deltaY * LINE_HEIGHT_PX : deltaMode === 2 ? deltaY * PAGE_HEIGHT_PX : deltaY;
  return pixels * WHEEL_SENSITIVITY;
}

/** Converts an upward swipe distance (positive = finger moved up) into a change in progress. */
export function swipeToDelta(upwardPixels: number): number {
  return upwardPixels * SWIPE_SENSITIVITY;
}

/**
 * Road width at progress `u`, smoothly interpolating between per-point widths.
 * `fractions` are the (increasing) progress values of the control points.
 */
export function interpolateWidth(
  fractions: readonly number[],
  widths: readonly number[],
  u: number,
): number {
  const last = fractions.length - 1;
  if (last < 0) return 0;
  if (u <= fractions[0]!) return widths[0]!;
  if (u >= fractions[last]!) return widths[last]!;
  let i = 0;
  while (i < last - 1 && u > fractions[i + 1]!) i++;
  const span = fractions[i + 1]! - fractions[i]!;
  const k = span === 0 ? 0 : (u - fractions[i]!) / span;
  const eased = k * k * (3 - 2 * k);
  return widths[i]! + (widths[i + 1]! - widths[i]!) * eased;
}
