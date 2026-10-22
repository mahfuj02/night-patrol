import { loopMagnet, type Loop } from './loopRoute';

/**
 * How hard the car speeds up and slows down on the road, in metres per second squared. At low speed
 * these are the whole story (gentle, like a car); the faster it goes the harder it may accelerate and
 * brake (a limit of speed over `ACCEL_TAU` and `BRAKE_TAU` seconds), so a long jump across the map still
 * takes a few seconds, and is smooth: there is never a step in the speed.
 */
export const ACCEL = 9;
export const DECEL = 11;
export const ACCEL_TAU = 2.5;
export const BRAKE_TAU = 2;
/** The car's cruising speed on the road for a short way to go, and its top speed for a long one (m/s). */
export const CRUISE_SPEED = 18;
export const TOP_ROAD_SPEED = 140;
/** The distance (m) over which the top speed rises from the cruising speed: a far jump goes faster. */
const LONG_WAY = 500;
/** How fast the car goes round a roundabout, in metres per second. */
export const ARC_SPEED = 15;
/** The car speeds up over this many metres into a roundabout and slows down over the same coming out. */
export const EASE_METRES = 12;
/** It never slows below this share of the roundabout speed, so the pass does not stall at the ends. */
export const MIN_SPEED = 0.3;
/** The fastest speed reported, in metres per second: a cut (reduced motion) is not a speed. */
export const MAX_SPEED = 150;
/** A step past the end of a roundabout pass lands just inside the next piece, clear of rounding. */
const PAST = 1e-6;
/** Closer than this (m) and slower than `SETTLE_SPEED` (m/s), the car has arrived and rests. */
const SETTLE_DISTANCE = 0.02;
const SETTLE_SPEED = 0.15;

/** How hard the car may accelerate and brake at speed `v`. */
export const accelAt = (speed: number) => Math.max(ACCEL, speed / ACCEL_TAU);
export const decelAt = (speed: number) => Math.max(DECEL, speed / BRAKE_TAU);

/** The speed below which the car brakes at the plain `DECEL`. */
const GENTLE = DECEL * BRAKE_TAU;

/** How far the car needs to stop from speed `v`, in metres. */
export const stoppingDistance = (speed: number) =>
  speed <= GENTLE
    ? (speed * speed) / (2 * DECEL)
    : (GENTLE * GENTLE) / (2 * DECEL) + (speed - GENTLE) * BRAKE_TAU;

/**
 * The speed the car wants with `distance` metres to go: up to a cruising speed (more for a long way),
 * and never faster than it can stop in the distance left. This is what makes it ease off before a stop.
 */
export function wantedSpeed(distance: number): number {
  if (distance <= 0) return 0;
  const top = Math.min(
    TOP_ROAD_SPEED,
    CRUISE_SPEED + (TOP_ROAD_SPEED - CRUISE_SPEED) * Math.min(1, distance / LONG_WAY),
  );
  // Close in, brake at the plain rate; further out, brake in proportion to the speed (exponentially).
  return Math.min(top, Math.max(Math.sqrt(2 * DECEL * distance), distance / BRAKE_TAU));
}

export interface StepInput {
  /** Where the car is, in metres driven round the loop (unwrapped). */
  s: number;
  /** How fast it is going now, in metres per second. */
  speed: number;
  /** Where the visitor wants it (unwrapped). */
  target: number;
  /** Seconds since the last step (the caller clamps long frames). */
  dt: number;
  reducedMotion: boolean;
  /** A station manoeuvre owns the car, so it may be eased backwards too. */
  owned: boolean;
  /** The places the magnet holds the car at. */
  magnets: readonly { s: number }[];
}

export interface StepResult {
  s: number;
  /** Metres per second, carried to the next step. */
  speed: number;
  /** True when the car is on a roundabout, where it drives itself. */
  onArc: boolean;
}

/**
 * One step of the car round the loop. On the road its speed moves toward the speed it wants with a
 * limit on how fast it may speed up and slow down, so it always accelerates and brakes smoothly (it
 * never lurches when the request jumps), pulled to a stop by the magnet, and never goes backwards. A
 * roundabout is driven, not skipped: the approach stops at its mouth, and on it the car goes round at a
 * steady pace with an ease in and out. Under reduced motion there is no easing (the view cuts to the
 * destination, and across each roundabout). Pure, so the scene and the tests share it.
 */
export function stepLoop(loop: Loop, input: StepInput): StepResult {
  const { s, target, dt, reducedMotion, owned, magnets } = input;
  const { piece, d } = loop.where(s);
  const onArc = piece.kind === 'forks' || piece.kind === 'start';

  if (onArc) {
    const length = piece.to - piece.from;
    if (reducedMotion) return { s: s - d + length + PAST, speed: 0, onArc };
    const ease = Math.min(1, (d + 1) / EASE_METRES, (length - d + 1) / EASE_METRES);
    const advance = dt * ARC_SPEED * Math.max(MIN_SPEED, ease);
    const next = d + advance >= length - PAST ? s - d + length + PAST : s + advance;
    return { s: next, speed: dt > 0 ? Math.min(MAX_SPEED, (next - s) / dt) : 0, onArc };
  }

  const desired = loopMagnet(loop, target, magnets);
  if (reducedMotion) {
    const next = owned ? desired : Math.max(s, desired);
    const gate = loop.gate(s, next);
    return { s: gate ?? next, speed: 0, onArc };
  }

  // Speed first, then position: the car can only speed up and slow down so fast.
  const distance = desired - s;
  let speed = Math.max(0, input.speed);
  if (distance < 0 && owned) {
    // A station manoeuvre may need the car a little behind: just put it there.
    return { s: desired, speed: 0, onArc };
  }
  const wanted = wantedSpeed(distance);
  speed += Math.max(-decelAt(speed) * dt, Math.min(accelAt(speed) * dt, wanted - speed));
  if (distance < SETTLE_DISTANCE && speed < SETTLE_SPEED) {
    const rest = Math.max(s, desired);
    const gate = loop.gate(s, rest);
    return { s: gate ?? rest, speed: 0, onArc };
  }
  // Never past where it is going: close in on the target without overshooting it.
  let next = Math.min(s + speed * dt, Math.max(s, desired));
  const gate = loop.gate(s, next);
  if (gate !== null) {
    next = gate;
    speed = Math.min(speed, ARC_SPEED);
  }
  return { s: next, speed: Math.min(MAX_SPEED, speed), onArc };
}
