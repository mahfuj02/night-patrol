import type { Direction } from './uturn';

/**
 * The patrol as ONE CLOSED PATH, not a road with direction flags. The car drives forward along it,
 * for ever: out along the road in its right-hand lane, once round the roundabout at The Forks,
 * back along the road in the other lane, and once round the small turnaround behind Ignition, which
 * puts it back on the outbound lane. Everything is measured in metres of driving, `s`.
 *
 * The four pieces, in order:
 *   `out`   the road, outbound lane, from where the turnaround lets the car out to where the
 *           Forks roundabout takes it in
 *   `forks` into the Forks roundabout, round it, and out onto the return lane
 *   `back`  the road, return lane, the same stretch in reverse
 *   `start` into the turnaround, round it, and out onto the outbound lane
 *
 * Pure numbers, no scene: the scene builds the poses from the same lengths (see
 * `src/scene/Road/loop.ts`). `s` may be any real number: the path wraps, and an unwrapped `s`
 * (total driven) lets targets and positions be compared without worrying about the seam.
 */

export type PieceKind = 'out' | 'forks' | 'back' | 'start';

export interface Piece {
  kind: PieceKind;
  /** Where the piece starts and ends on the wrapped loop, in metres. */
  from: number;
  to: number;
}

/** The lengths the loop is built from, in metres. */
export interface LoopSpec {
  /** The length of the road, start to end. */
  road: number;
  /** How far in from each end of the road the roundabouts take the car in and let it out. */
  startRun: number;
  forksRun: number;
  /** Lengths of the two roundabout passes (in, round, out). */
  startArc: number;
  forksArc: number;
}

/** Metres of driving the planner counts for a U-turn when it weighs it against driving on. */
export const UTURN_COST = 12;

export interface Where {
  piece: Piece;
  /** Metres into the piece. */
  d: number;
}

export interface Loop {
  spec: LoopSpec;
  /** The whole loop's length. */
  length: number;
  pieces: Piece[];
  /** Length of one road piece (`out` and `back` are the same stretch). */
  span: number;
  /** `s` wrapped into [0, length). */
  wrap: (s: number) => number;
  /** Which piece a (wrapped or not) `s` falls in, and how far into it. */
  where: (s: number) => Where;
  /** Metres along the road from its start (0 to `road`), for a car on a road piece or a roundabout. */
  roadMetres: (s: number) => number;
  /** Route progress `t` (0 to 1) for `s`. Roundabout passes ride from the lane end out to the road end and back. */
  routeT: (s: number) => number;
  /** The way the car is heading along the route: 1 outbound, -1 heading back. */
  direction: (s: number) => Direction;
  /** True on a roundabout pass, where the car drives itself and cannot be stopped or turned. */
  onArc: (s: number) => boolean;
  /** `s` of a point `m` metres along the road, driving outbound or heading back. */
  outS: (m: number) => number;
  backS: (m: number) => number;
  /** Where a U-turn from `s` puts the car: the same spot of road in the other lane. Null on a roundabout. */
  mirror: (s: number) => number | null;
  /** Metres to drive forward from `from` to reach `to` (0 up to the loop length). */
  ahead: (from: number, to: number) => number;
}

export function createLoop(spec: LoopSpec): Loop {
  const span = spec.road - spec.startRun - spec.forksRun;
  if (span <= 0) throw new Error('The roundabouts leave no road between them.');
  const sizes: [PieceKind, number][] = [
    ['out', span],
    ['forks', spec.forksArc],
    ['back', span],
    ['start', spec.startArc],
  ];
  const pieces: Piece[] = [];
  let at = 0;
  for (const [kind, size] of sizes) {
    pieces.push({ kind, from: at, to: at + size });
    at += size;
  }
  const length = at;
  const [out, forks, back, start] = pieces as [Piece, Piece, Piece, Piece];

  const wrap = (s: number) => {
    const w = s % length;
    return w < 0 ? w + length : w;
  };
  const where = (s: number): Where => {
    const w = wrap(s);
    const piece = pieces.find((p) => w < p.to) ?? start;
    return { piece, d: w - piece.from };
  };
  const roadMetres = (s: number) => {
    const { piece, d } = where(s);
    switch (piece.kind) {
      case 'out':
        return spec.startRun + d;
      case 'back':
        return spec.road - spec.forksRun - d;
      case 'forks': {
        // Out to the end of the road at the middle of the pass, and back to the lane end.
        const k = d / spec.forksArc;
        return spec.road - spec.forksRun + spec.forksRun * Math.sin(Math.PI * k);
      }
      case 'start': {
        const k = d / spec.startArc;
        return spec.startRun - spec.startRun * Math.sin(Math.PI * k);
      }
    }
  };
  const direction = (s: number): Direction => {
    const { piece, d } = where(s);
    switch (piece.kind) {
      case 'out':
        return 1;
      case 'back':
        return -1;
      case 'forks':
        return d < spec.forksArc / 2 ? 1 : -1;
      case 'start':
        return d < spec.startArc / 2 ? -1 : 1;
    }
  };

  return {
    spec,
    length,
    pieces,
    span,
    wrap,
    where,
    roadMetres,
    routeT: (s) => roadMetres(s) / spec.road,
    direction,
    onArc: (s) => {
      const kind = where(s).piece.kind;
      return kind === 'forks' || kind === 'start';
    },
    outS: (m) => out.from + (m - spec.startRun),
    backS: (m) => back.from + (spec.road - spec.forksRun - m),
    mirror: (s) => {
      const { piece, d } = where(s);
      if (piece.kind === 'out') return back.from + (span - d);
      if (piece.kind === 'back') return out.from + (span - d);
      return null;
    },
    ahead: (from, to) => wrap(to - from),
  };
}

/** A stop's place on the road, and whether the patrol stops there heading back. */
export interface StopPlace {
  /** Metres from the start of the road. */
  metres: number;
  /** Whether the patrol stops here on the way back (The Forks and Ignition are passed, not visited). */
  onReturn: boolean;
}

export interface Visit {
  stop: number;
  direction: Direction;
  /** Where on the loop, in [0, length). */
  s: number;
}

/** Every visit to every stop in loop order: all stops outbound, and the ones that return, heading back. */
export function stopVisits(loop: Loop, places: readonly StopPlace[]): Visit[] {
  const visits: Visit[] = [];
  places.forEach((place, stop) => {
    visits.push({ stop, direction: 1, s: loop.wrap(loop.outS(place.metres)) });
    if (place.onReturn) {
      visits.push({ stop, direction: -1, s: loop.wrap(loop.backS(place.metres)) });
    }
  });
  return visits.sort((a, b) => a.s - b.s);
}

/** A place the magnet holds the car: a stop, or the red light of a station. */
export interface MagnetPoint {
  s: number;
  kind: 'stop' | 'light';
  /** The stop index, or the station index. */
  ref: number;
  direction: Direction;
}

/** A station's light sits `offset` metres from its stop, along the way the car is going (negative is before it). */
export function stationLightPoints(
  visits: readonly Visit[],
  loop: Loop,
  stations: readonly { stop: number; offset: number }[],
): MagnetPoint[] {
  return stations.flatMap((station, ref) =>
    visits
      .filter((v) => v.stop === station.stop)
      .map((v) => ({
        s: loop.wrap(v.s + station.offset),
        kind: 'light' as const,
        ref,
        direction: v.direction,
      })),
  );
}

/** Every magnet point (stops and lights) in loop order. */
export function magnetPoints(
  visits: readonly Visit[],
  lights: readonly MagnetPoint[],
): MagnetPoint[] {
  return [
    ...visits.map((v): MagnetPoint => ({
      s: v.s,
      kind: 'stop',
      ref: v.stop,
      direction: v.direction,
    })),
    ...lights,
  ].sort((a, b) => a.s - b.s);
}

/** Signed shortest way from `a` round the loop to `b`, in (-length/2, length/2]. */
export function signedGap(loop: Loop, a: number, b: number): number {
  const gap = loop.wrap(b - a);
  return gap > loop.length / 2 ? gap - loop.length : gap;
}

/** Index of the point nearest `s` going either way round the loop. */
export function nearestPoint(loop: Loop, s: number, points: readonly { s: number }[]): number {
  let best = -1;
  let bestGap = Infinity;
  points.forEach((p, i) => {
    const gap = Math.abs(signedGap(loop, s, p.s));
    if (gap < bestGap) {
      best = i;
      bestGap = gap;
    }
  });
  return best;
}

/** How close (in metres) the car must be to a point for it to count as there. */
export const MAGNET_METRES = 28;

/** Magnet zone for one point: capped at half the gap to its neighbours so zones never overlap. */
export function magnetZone(
  loop: Loop,
  index: number,
  points: readonly { s: number }[],
  radius = MAGNET_METRES,
): number {
  const point = points[index];
  if (!point || points.length < 2) return radius;
  const before = points[(index - 1 + points.length) % points.length]!;
  const after = points[(index + 1) % points.length]!;
  return Math.min(
    radius,
    loop.ahead(before.s, point.s) / 2 || radius,
    loop.ahead(point.s, after.s) / 2 || radius,
  );
}

/**
 * Eases `s` toward the nearest point: inside its zone the mapping flattens near the point (so the
 * car settles there) and meets the identity at the zone's edge, so it stays continuous and
 * monotonic. Works on an unwrapped `s`: the result is unwrapped the same way.
 */
export function loopMagnet(
  loop: Loop,
  s: number,
  points: readonly { s: number }[],
  radius = MAGNET_METRES,
  strength = 1,
): number {
  if (points.length === 0 || strength <= 0 || radius <= 0) return s;
  const index = nearestPoint(loop, s, points);
  const point = points[index]!;
  const zone = magnetZone(loop, index, points, radius);
  const gap = -signedGap(loop, s, point.s); // s minus the point, signed
  const u = Math.abs(gap) / zone;
  if (u >= 1) return s;
  return s - gap + Math.sign(gap) * zone * Math.pow(u, 1 + strength);
}

/** The first visit strictly ahead of `s` (further than `epsilon`), going forward round the loop. */
export function nextVisit<T extends { s: number }>(
  loop: Loop,
  s: number,
  visits: readonly T[],
  epsilon = 1,
): T | undefined {
  let best: T | undefined;
  let bestAhead = Infinity;
  for (const visit of visits) {
    let ahead = loop.ahead(s, visit.s);
    if (ahead <= epsilon) ahead += loop.length;
    if (ahead < bestAhead) {
      best = visit;
      bestAhead = ahead;
    }
  }
  return best;
}

export interface JumpPlan {
  visit: Visit;
  /** Turn round first (at most once), then drive on. */
  uTurn: boolean;
  /** Metres to drive after any U-turn. */
  distance: number;
}

/**
 * The shortest way to a stop: it has up to two visits (outbound and heading back). Either keep
 * driving forward round the loop to the nearer one, or turn round once (only on a road piece) and
 * drive the short way from the other lane. Driving on wins a tie.
 */
export function planJump(loop: Loop, s: number, visits: readonly Visit[]): JumpPlan | undefined {
  const mirrored = loop.mirror(s);
  let best: { plan: JumpPlan; cost: number } | undefined;
  for (const visit of visits) {
    const drive = loop.ahead(s, visit.s);
    const options = [{ uTurn: false, distance: drive, cost: drive }];
    if (mirrored !== null) {
      const distance = loop.ahead(mirrored, visit.s);
      options.push({ uTurn: true, distance, cost: distance + UTURN_COST });
    }
    for (const option of options) {
      if (!best || option.cost < best.cost) {
        best = {
          plan: { visit, uTurn: option.uTurn, distance: option.distance },
          cost: option.cost,
        };
      }
    }
  }
  return best?.plan;
}
