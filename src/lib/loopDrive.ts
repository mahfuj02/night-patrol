import { loopMagnet, type Loop } from './loopRoute';
import { dampT } from './route';

/** How quickly the car catches up with the requested distance (per second). */
export const FOLLOW_RATE = 5;
/** How fast the car goes round a roundabout, in metres per second. */
export const ARC_SPEED = 15;
/** The car speeds up over this many metres into a roundabout and slows down over the same coming out. */
export const EASE_METRES = 12;
/** It never slows below this share of the roundabout speed, so the pass does not stall at the ends. */
export const MIN_SPEED = 0.3;
/** The fastest speed reported, in metres per second: a cut (reduced motion) is not a speed. */
export const MAX_SPEED = 40;
/** A step past the end of a roundabout pass lands just inside the next piece, clear of rounding. */
const PAST = 1e-6;

export interface StepInput {
  /** Where the car is, in metres driven round the loop (unwrapped). */
  s: number;
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
  /** Metres per second, for braking to aim ahead of the car. */
  speed: number;
  /** True when the car is on a roundabout, where it drives itself. */
  onArc: boolean;
}

/**
 * One step of the car round the loop. On the road it eases toward the requested distance, pulled to
 * a stop by the magnet, and never goes backwards: the car only ever drives forward along the loop.
 * A roundabout is driven, not skipped: the approach stops at its mouth, and on it the car goes round
 * at a steady pace with an ease in and out. Under reduced motion there is no easing (the view cuts
 * to the destination, and across each roundabout). Pure, so the scene and the tests share it.
 */
export function stepLoop(loop: Loop, input: StepInput): StepResult {
  const { s, target, dt, reducedMotion, owned, magnets } = input;
  const { piece, d } = loop.where(s);
  const onArc = piece.kind === 'forks' || piece.kind === 'start';
  let next: number;

  if (onArc) {
    const length = piece.to - piece.from;
    if (reducedMotion) {
      next = s - d + length + PAST;
    } else {
      const ease = Math.min(1, (d + 1) / EASE_METRES, (length - d + 1) / EASE_METRES);
      const advance = dt * ARC_SPEED * Math.max(MIN_SPEED, ease);
      next = d + advance >= length - PAST ? s - d + length + PAST : s + advance;
    }
  } else {
    const desired = loopMagnet(loop, target, magnets);
    const eased = reducedMotion ? desired : dampT(s, desired, FOLLOW_RATE, dt);
    // Never backwards (the magnet may pull the request behind the car).
    next = owned ? eased : Math.max(s, eased);
    const gate = loop.gate(s, next);
    if (gate !== null) next = gate;
  }

  const speed = dt > 0 ? Math.min(MAX_SPEED, Math.max(0, (next - s) / dt)) : 0;
  return { s: next, speed, onArc };
}
