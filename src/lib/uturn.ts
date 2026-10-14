import { bezierPoint, bezierTangent, headingVector, vectorHeading, type Pose } from './parking';

/**
 * The U-turn: when the car has to go back the way it came (Prev, a map jump back, scrolling back),
 * it never drives backwards. It swings across the road in a smooth U and carries on facing forward
 * in the other lane (Canada drives on the right, so each direction has its own right-hand lane).
 * Pure maths on the ground plane, sharing its Bezier helpers with the parking path.
 */

/** 1 drives along the route toward The Forks; -1 drives back toward the start. */
export type Direction = 1 | -1;

/** How long the U-turn takes, in seconds (a cut under reduced motion). */
export const UTURN_SECONDS = 1.8;
/** How far the car carries on in its old direction while it swings across, in metres. */
export const UTURN_RUN = 10;
/** How far the Bezier handles reach, which sets how wide the U is, in metres. */
export const UTURN_HANDLE = 6;
/** The car turns round only once the requested spot is more than this far behind it, in metres. */
export const TURN_TRIGGER_METRES = 5;

/**
 * Whether the car should turn round: the requested progress is behind it, against its direction of
 * travel, by more than the trigger distance. A small step back (a magnet settling) is not a reason
 * to turn: the car just holds still (see `followDirection`).
 */
export function needsTurn(
  direction: Direction,
  progressT: number,
  desiredT: number,
  routeLength: number,
  trigger = TURN_TRIGGER_METRES,
): boolean {
  const behind = direction === 1 ? progressT - desiredT : desiredT - progressT;
  return behind * routeLength > trigger;
}

/** Moves toward `eased` but never against the direction of travel: the car does not reverse. */
export function followDirection(direction: Direction, current: number, eased: number): number {
  return direction === 1 ? Math.max(current, eased) : Math.min(current, eased);
}

/** Where along the route the car comes out of the U-turn: a little further in its old direction. */
export function uTurnEnd(
  startT: number,
  direction: Direction,
  routeLength: number,
  run = UTURN_RUN,
): number {
  return Math.min(1, Math.max(0, startT + (direction * run) / routeLength));
}

export interface UTurnPath {
  /** Length of the path in metres, measured along the curve. */
  length: number;
  /** The pose at `s` from 0 (the start) to 1 (out of the turn). */
  pose: (s: number) => Pose;
}

/**
 * The path of the U-turn: a smooth hairpin from `start` (heading one way in one lane) to `end`
 * (heading the opposite way in the other lane). Both Bezier handles reach ahead in the start's
 * direction, so the car swings out past the end and curls back into the other lane, never sliding
 * sideways. The curve leaves along the start heading and arrives along the end heading.
 */
export function uTurnPath(start: Pose, end: Pose, handle = UTURN_HANDLE): UTurnPath {
  const a: [number, number] = [start.x, start.z];
  const d: [number, number] = [end.x, end.z];
  const [sx, sz] = headingVector(start.heading);
  const [ex, ez] = headingVector(end.heading);
  const b: [number, number] = [a[0] + sx * handle, a[1] + sz * handle];
  // The curve arrives along the end heading, so the last handle points back along it.
  const c: [number, number] = [d[0] - ex * handle, d[1] - ez * handle];

  let length = 0;
  let previous = a;
  for (let i = 1; i <= 32; i++) {
    const next = bezierPoint(a, b, c, d, i / 32);
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
