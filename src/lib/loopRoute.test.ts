import { describe, expect, it } from 'vitest';
import {
  MAGNET_METRES,
  UTURN_COST,
  createLoop,
  loopMagnet,
  magnetPoints,
  magnetZone,
  nearestPoint,
  nextVisit,
  planJump,
  signedGap,
  stationLightPoints,
  stopVisits,
  type StopPlace,
} from './loopRoute';

const loop = createLoop({ road: 1000, startRun: 10, forksRun: 14, startArc: 100, forksArc: 150 });
// Road span 976; length 976 + 150 + 976 + 100 = 2202.
const places: StopPlace[] = [
  { metres: 30, onReturn: false }, // start
  { metres: 100, onReturn: true },
  { metres: 500, onReturn: true },
  { metres: 900, onReturn: false }, // the end
];

describe('the loop', () => {
  it('is four pieces, one after the other, and closes on itself', () => {
    expect(loop.span).toBe(976);
    expect(loop.pieces.map((p) => p.kind)).toEqual(['out', 'forks', 'back', 'start']);
    expect(loop.pieces[0]!.from).toBe(0);
    for (let i = 1; i < loop.pieces.length; i++) {
      expect(loop.pieces[i]!.from).toBe(loop.pieces[i - 1]!.to);
    }
    expect(loop.pieces[3]!.to).toBe(loop.length);
    expect(loop.length).toBe(2202);
  });

  it('refuses roundabouts that overlap', () => {
    expect(() => createLoop({ ...loop.spec, road: 20 })).toThrow();
  });

  it('wraps any distance, including negative ones', () => {
    expect(loop.wrap(loop.length + 5)).toBe(5);
    expect(loop.wrap(-5)).toBe(loop.length - 5);
    expect(loop.wrap(3 * loop.length + 7)).toBe(7);
  });

  it('knows where on the road the car is, on every piece', () => {
    expect(loop.roadMetres(0)).toBe(10);
    expect(loop.roadMetres(976)).toBe(986);
    expect(loop.roadMetres(976 + 75)).toBeCloseTo(1000, 6); // mid-pass: the end of the road
    expect(loop.roadMetres(976 + 150)).toBeCloseTo(986, 6);
    expect(loop.roadMetres(976 + 150 + 976)).toBe(10);
    expect(loop.roadMetres(loop.length - 50)).toBeCloseTo(0, 6);
    expect(loop.routeT(0)).toBeCloseTo(0.01, 9);
  });

  it('is continuous round the whole loop', () => {
    let previous = loop.roadMetres(0);
    for (let s = 0.5; s <= loop.length + 0.5; s += 0.5) {
      const here = loop.roadMetres(s);
      expect(Math.abs(here - previous)).toBeLessThan(1.2);
      previous = here;
    }
  });

  it('heads outbound on the way out, and back on the way back, turning on the roundabouts', () => {
    expect(loop.direction(100)).toBe(1);
    expect(loop.direction(976 + 10)).toBe(1);
    expect(loop.direction(976 + 140)).toBe(-1);
    expect(loop.direction(976 + 150 + 100)).toBe(-1);
    expect(loop.direction(loop.length - 90)).toBe(-1);
    expect(loop.direction(loop.length - 10)).toBe(1);
  });

  it('only the roundabout passes are arcs', () => {
    expect(loop.onArc(100)).toBe(false);
    expect(loop.onArc(976 + 1)).toBe(true);
    expect(loop.onArc(976 + 150 + 500)).toBe(false);
    expect(loop.onArc(loop.length - 1)).toBe(true);
  });

  it('puts a point of road at the same place on both lanes', () => {
    for (const m of [30, 100, 500, 900]) {
      expect(loop.roadMetres(loop.outS(m))).toBeCloseTo(m, 9);
      expect(loop.roadMetres(loop.backS(m))).toBeCloseTo(m, 9);
      expect(loop.direction(loop.outS(m))).toBe(1);
      expect(loop.direction(loop.backS(m))).toBe(-1);
    }
  });

  it('turning round swaps the lane at the same spot of road, and swapping twice is a no-op', () => {
    for (const s of [1, 300, 975, 976 + 150 + 1, 976 + 150 + 400, 976 + 150 + 975]) {
      const m = loop.mirror(s)!;
      expect(m).not.toBeNull();
      expect(loop.roadMetres(m)).toBeCloseTo(loop.roadMetres(s), 9);
      expect(loop.direction(m)).toBe(-loop.direction(s));
      expect(loop.mirror(m)).toBeCloseTo(s, 9);
    }
  });

  it('lands a U-turn a little further on in the old direction, in the other lane', () => {
    const out = loop.landing(loop.outS(300), 10)!;
    expect(loop.direction(out)).toBe(-1);
    expect(loop.roadMetres(out)).toBeCloseTo(310, 9);
    const back = loop.landing(loop.backS(300), 10)!;
    expect(loop.direction(back)).toBe(1);
    expect(loop.roadMetres(back)).toBeCloseTo(290, 9);
  });

  it('keeps the landing on the road piece it turns onto, near the ends', () => {
    const nearEnd = loop.landing(loop.outS(980), 10)!;
    expect(loop.where(nearEnd).piece.kind).toBe('back');
    expect(loop.roadMetres(nearEnd)).toBeLessThanOrEqual(986 + 1e-9);
    expect(loop.landing(976 + 10, 10)).toBeNull();
  });

  it('cannot turn round on a roundabout', () => {
    expect(loop.mirror(976 + 10)).toBeNull();
    expect(loop.mirror(loop.length - 10)).toBeNull();
  });

  it('finds the next roundabout pass between two distances, on any lap', () => {
    expect(loop.gate(0, 500)).toBeNull();
    expect(loop.gate(900, 1100)).toBe(976);
    expect(loop.gate(976, 1100)).toBeNull(); // already in it
    expect(loop.gate(975.5, 976)).toBe(976);
    expect(loop.gate(1200, 2300)).toBe(976 + 150 + 976);
    expect(loop.gate(2000, loop.length + 10)).toBe(976 + 150 + 976);
    expect(loop.gate(loop.length - 5, loop.length + 5)).toBeNull();
    expect(loop.gate(loop.length + 900, loop.length + 1100)).toBe(loop.length + 976);
    // The turnaround's pass starts at 2102; the seam after it is not a gate.
    expect(loop.gate(2000, 2150)).toBe(2102);
  });

  it('measures the way ahead round the seam', () => {
    expect(loop.ahead(10, 30)).toBe(20);
    expect(loop.ahead(30, 10)).toBe(loop.length - 20);
    expect(loop.ahead(loop.length - 5, 5)).toBe(10);
    expect(loop.ahead(7, 7)).toBe(0);
  });
});

describe('visits', () => {
  const visits = stopVisits(loop, places);

  it('visits every stop outbound and the returning ones again heading back, in loop order', () => {
    expect(visits).toHaveLength(4 + 2);
    expect(visits.map((v) => v.s)).toEqual([...visits.map((v) => v.s)].sort((a, b) => a - b));
    expect(visits.filter((v) => v.direction === 1).map((v) => v.stop)).toEqual([0, 1, 2, 3]);
    expect(visits.filter((v) => v.direction === -1).map((v) => v.stop)).toEqual([2, 1]);
  });

  it('never stops at the end of the road or at the start on the way back', () => {
    expect(visits.some((v) => v.stop === 3 && v.direction === -1)).toBe(false);
    expect(visits.some((v) => v.stop === 0 && v.direction === -1)).toBe(false);
  });

  it('lets the next visit be found going forward, wrapping at the seam', () => {
    const first = nextVisit(loop, 0, visits)!;
    expect(first).toMatchObject({ stop: 0, direction: 1 });
    const afterEnd = nextVisit(loop, loop.outS(900) + 1, visits)!;
    expect(afterEnd).toMatchObject({ stop: 2, direction: -1 });
    const afterLast = nextVisit(loop, loop.backS(100) + 1, visits)!;
    expect(afterLast).toMatchObject({ stop: 0, direction: 1 });
    // At a visit, the next one is the one after it, not itself.
    expect(nextVisit(loop, visits[0]!.s, visits)).not.toBe(visits[0]);
  });

  it('puts a station light before the stop in the direction of travel, both ways', () => {
    const lights = stationLightPoints(visits, loop, [{ stop: 2, offset: -20 }]);
    expect(lights).toHaveLength(2);
    const out = lights.find((l) => l.direction === 1)!;
    const back = lights.find((l) => l.direction === -1)!;
    expect(loop.roadMetres(out.s)).toBeCloseTo(480, 9);
    expect(loop.roadMetres(back.s)).toBeCloseTo(520, 9);
  });
});

describe('the magnet', () => {
  const visits = stopVisits(loop, places);
  const points = magnetPoints(visits, stationLightPoints(visits, loop, [{ stop: 2, offset: -20 }]));

  it('is the identity away from a point and flat at it', () => {
    const p = points.find((q) => q.kind === 'stop' && q.ref === 1 && q.direction === 1)!;
    expect(loopMagnet(loop, p.s + 200, points)).toBeCloseTo(p.s + 200, 9);
    expect(loopMagnet(loop, p.s, points)).toBeCloseTo(p.s, 9);
    expect(loopMagnet(loop, p.s + 3, points)).toBeLessThan(p.s + 3);
    expect(loopMagnet(loop, p.s - 3, points)).toBeGreaterThan(p.s - 3);
  });

  it('is monotonic and continuous over the whole loop, seam included', () => {
    let previous = loopMagnet(loop, 0, points);
    for (let s = 0.25; s < 2 * loop.length; s += 0.25) {
      const here = loopMagnet(loop, s, points);
      expect(here).toBeGreaterThanOrEqual(previous - 1e-9);
      expect(here - previous).toBeLessThan(0.5);
      previous = here;
    }
  });

  it('works on an unwrapped distance', () => {
    const p = points[2]!;
    const a = loopMagnet(loop, p.s + 5, points);
    const b = loopMagnet(loop, p.s + 5 + 3 * loop.length, points);
    expect(b - a).toBeCloseTo(3 * loop.length, 6);
  });

  it('caps a zone at half the gap to the neighbours', () => {
    const near = [{ s: 100 }, { s: 110 }, { s: 500 }];
    expect(magnetZone(loop, 0, near)).toBe(5);
    expect(magnetZone(loop, 2, near)).toBe(MAGNET_METRES);
  });

  it('finds the nearest point either way round the seam', () => {
    const ps = [{ s: 5 }, { s: 1000 }];
    expect(nearestPoint(loop, loop.length - 3, ps)).toBe(0);
    expect(signedGap(loop, loop.length - 3, 5)).toBe(8);
    expect(signedGap(loop, 5, loop.length - 3)).toBe(-8);
  });
});

describe('planning a jump', () => {
  const visits = stopVisits(loop, places);
  const of = (stop: number) => visits.filter((v) => v.stop === stop);

  it('drives straight on to a stop ahead', () => {
    const plan = planJump(loop, loop.outS(100), of(2))!;
    expect(plan.uTurn).toBe(false);
    expect(plan.visit.direction).toBe(1);
    expect(plan.distance).toBeCloseTo(400, 9);
  });

  it('takes the heading-back visit from a roundabout, where it cannot turn round', () => {
    const plan = planJump(loop, 976 + 10, of(2))!;
    expect(plan.uTurn).toBe(false);
    expect(plan.visit.direction).toBe(-1);
  });

  it('turns round once rather than drive nearly all the way round', () => {
    // Just past stop 1 heading out, stop 1's returning visit is almost the whole way back.
    const here = loop.outS(110);
    const plan = planJump(loop, here, of(1))!;
    expect(plan.uTurn).toBe(true);
    // Mirror lands on the other lane at 110 m; the stop's heading-back visit is 10 m ahead.
    expect(plan.distance).toBeCloseTo(10, 9);
    expect(plan.visit.direction).toBe(-1);
  });

  it('never turns round on a roundabout', () => {
    const plan = planJump(loop, 976 + 10, of(1))!;
    expect(plan.uTurn).toBe(false);
  });

  it('counts a U-turn as a cost, so a tie is driven', () => {
    expect(UTURN_COST).toBeGreaterThan(0);
    const here = loop.outS(500);
    const plan = planJump(loop, here, of(2))!;
    expect(plan.uTurn).toBe(false);
    expect(plan.distance).toBe(0);
  });

  it('has nothing to plan without visits', () => {
    expect(planJump(loop, 0, [])).toBeUndefined();
  });
});
