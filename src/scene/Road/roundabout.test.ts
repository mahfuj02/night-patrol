import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { headingVector } from '@/lib/parking';
import {
  BANK_TUBE,
  OUTER_RADIUS,
  ROUNDABOUT,
  bankGeometry,
  loopPath,
  loopSeconds,
  ringPoint,
  ringStrips,
  roundaboutLayout,
} from './roundabout';
import { routeModel } from './route';

const layout = roundaboutLayout(routeModel);
const stopU = routeModel.stopFractions.get('the-forks')!;
const { forward, left, end, centre } = layout;

/** Where a world point is relative to the road's axis at its end: along (forward) and across (left). */
const alongAxis = (x: number, z: number) => (x - end.x) * forward.x + (z - end.z) * forward.z;
const acrossAxis = (x: number, z: number) => (x - end.x) * left.x + (z - end.z) * left.z;
const distanceFromCentre = (x: number, z: number) => Math.hypot(x - centre.x, z - centre.z);

describe('roundabout layout', () => {
  it('centres the ring on the road axis, straight ahead of the end of the road', () => {
    const toCentre = centre.clone().sub(end);
    expect(acrossAxis(centre.x, centre.z)).toBeCloseTo(0, 6);
    expect(toCentre.length()).toBeCloseTo(OUTER_RADIUS, 6);
    expect(toCentre.clone().normalize().dot(forward)).toBeCloseTo(1, 6);
  });

  it('starts the ring exactly where the road ends: the outer edge touches the end of the road', () => {
    expect(distanceFromCentre(end.x, end.z)).toBeCloseTo(OUTER_RADIUS, 6);
    // The road arrives square to the ring: its direction is along the line through the centre.
    expect(forward.dot(centre.clone().sub(end).normalize())).toBeCloseTo(1, 6);
  });

  it("puts the mouth of the ring (theta = 0) on the road, and the first half turn on the car's right", () => {
    const mouth = ringPoint(layout, OUTER_RADIUS, 0);
    expect(mouth.distanceTo(end)).toBeCloseTo(0, 6);
    const quarter = ringPoint(layout, ROUNDABOUT.centreline, Math.PI / 2);
    expect(acrossAxis(quarter.x, quarter.z)).toBeLessThan(0);
  });

  it('sits well beyond the last stop, so the ring never overlaps the stop or its station', () => {
    const stop = routeModel.curve.getPointAt(stopU);
    expect(alongAxis(stop.x, stop.z)).toBeLessThan(-20);
    // The whole ring is ahead of the end of the road.
    const nearest = distanceFromCentre(end.x, end.z) - OUTER_RADIUS;
    expect(nearest).toBeCloseTo(0, 6);
  });

  it('keeps the island inside the ring', () => {
    expect(ROUNDABOUT.island).toBeLessThan(ROUNDABOUT.centreline - ROUNDABOUT.width / 2 + 0.01);
  });
});

describe('the whole lap', () => {
  const path = loopPath(routeModel, stopU);
  const STEP = 0.25;
  const samples: { d: number; x: number; z: number; heading: number }[] = [];
  for (let d = 0; d <= path.length + 1e-9; d += STEP) {
    const pose = path.pose(d);
    samples.push({ d, ...pose });
  }
  const inSegment = (kind: string) => {
    const s = path.segments.find((x) => x.kind === kind)!;
    return samples.filter((p) => p.d >= s.from && p.d <= s.to);
  };

  it('is made of the lead-in, the entry, the ring, the exit and the run back, in that order', () => {
    expect(path.segments.map((s) => s.kind)).toEqual(['lead', 'entry', 'ring', 'exit', 'return']);
    for (let i = 1; i < path.segments.length; i++) {
      expect(path.segments[i]!.from).toBeCloseTo(path.segments[i - 1]!.to, 9);
    }
    expect(path.segments[path.segments.length - 1]!.to).toBeCloseTo(path.length, 9);
  });

  it('starts on the road, in the car lane, facing along it', () => {
    const start = samples[0]!;
    const lane = routeModel.lanePointAt(stopU);
    expect(start.x).toBeCloseTo(lane.x, 6);
    expect(start.z).toBeCloseTo(lane.z, 6);
    // Within the road, on the car's right.
    const half = routeModel.widthAt(stopU) / 2;
    const t = routeModel.curve.getTangentAt(stopU);
    const axis = routeModel.curve.getPointAt(stopU);
    expect(Math.hypot(start.x - axis.x, start.z - axis.z)).toBeLessThan(half);
    const [hx, hz] = headingVector(start.heading);
    expect(hx * t.x + hz * t.z).toBeCloseTo(1, 6);
  });

  it('drives the lead-in on the road, in the right-hand lane, up to the approach', () => {
    for (const p of inSegment('lead')) {
      // Along the axis, at the lane offset on the right (negative across), inside the road.
      expect(acrossAxis(p.x, p.z)).toBeLessThan(0.5);
      expect(Math.abs(acrossAxis(p.x, p.z))).toBeLessThan(routeModel.widthAt(1) / 2);
    }
  });

  it('bears right onto the ring, joining it tangentially at the join angle', () => {
    const last = path.pose(path.segments.find((x) => x.kind === 'entry')!.to);
    const join = ringPoint(layout, ROUNDABOUT.centreline, ROUNDABOUT.joinAngle);
    expect(last.x).toBeCloseTo(join.x, 1);
    expect(last.z).toBeCloseTo(join.z, 1);
    // Its heading is the ring's direction there (it joins along the ring, not across it).
    const radial = new Vector3(last.x - centre.x, 0, last.z - centre.z).normalize();
    const [hx, hz] = headingVector(last.heading);
    expect(Math.abs(hx * radial.x + hz * radial.z)).toBeLessThan(0.03);
    // On the way in it moves to the right of the axis.
    expect(acrossAxis(last.x, last.z)).toBeLessThan(-2);
  });

  it('stays on the ring path (and inside the ring) all the way round', () => {
    for (const p of inSegment('ring')) {
      expect(distanceFromCentre(p.x, p.z)).toBeCloseTo(ROUNDABOUT.centreline, 4);
    }
    // And never strays outside the ring or into the island anywhere on the ring or the curves.
    for (const p of [...inSegment('entry'), ...inSegment('ring'), ...inSegment('exit')]) {
      const r = distanceFromCentre(p.x, p.z);
      if (alongAxis(p.x, p.z) > 0.1) {
        expect(r).toBeGreaterThan(ROUNDABOUT.island);
        expect(r).toBeLessThan(OUTER_RADIUS + 0.01);
      }
    }
  });

  it('goes right round: the far side of the ring is reached, with the island on the left', () => {
    const ring = inSegment('ring');
    const far = Math.max(...ring.map((p) => Math.hypot(p.x - end.x, p.z - end.z)));
    expect(far).toBeGreaterThan(2 * OUTER_RADIUS - 6);
    const quarter = ring[Math.floor(ring.length / 4)]!;
    const [hx, hz] = headingVector(quarter.heading);
    const toCentre = new Vector3(centre.x - quarter.x, 0, centre.z - quarter.z).normalize();
    // The left of the heading, (hz, -hx), points at the island.
    expect(hz * toCentre.x - hx * toCentre.z).toBeGreaterThan(0.99);
  });

  it('leaves the ring onto the road, the other lane, heading back toward the city', () => {
    const exit = inSegment('exit');
    const end2 = exit[exit.length - 1]!;
    // At the approach, in the opposite lane: on the left of the original direction of travel.
    expect(acrossAxis(end2.x, end2.z)).toBeCloseTo(layout.laneOffset, 1);
    expect(alongAxis(end2.x, end2.z)).toBeCloseTo(-ROUNDABOUT.approach, 0);
    const [hx, hz] = headingVector(end2.heading);
    expect(hx * forward.x + hz * forward.z).toBeCloseTo(-1, 1);
  });

  it('ends back on the road, in the right-hand lane for the way back, before the fade', () => {
    const last = samples[samples.length - 1]!;
    const half = routeModel.widthAt(1) / 2;
    // On the road: behind the end of the road, close to the axis, inside its width.
    expect(alongAxis(last.x, last.z)).toBeLessThan(-ROUNDABOUT.approach);
    expect(Math.abs(acrossAxis(last.x, last.z))).toBeLessThan(half);
    // In the right-hand lane for a car heading back toward the city.
    expect(acrossAxis(last.x, last.z)).toBeCloseTo(layout.laneOffset, 1);
    const [hx, hz] = headingVector(last.heading);
    expect(hx * forward.x + hz * forward.z).toBeCloseTo(-1, 1);
  });

  it('moves smoothly: no jumps in position or heading anywhere in the loop', () => {
    for (let i = 1; i < samples.length; i++) {
      const a = samples[i - 1]!;
      const b = samples[i]!;
      // The curves are timed by their parameter, not exactly by length, so allow a little give.
      expect(Math.hypot(b.x - a.x, b.z - a.z)).toBeLessThan(STEP * 1.6);
      let dh = b.heading - a.heading;
      while (dh > Math.PI) dh -= 2 * Math.PI;
      while (dh < -Math.PI) dh += 2 * Math.PI;
      expect(Math.abs(dh)).toBeLessThan(0.12);
    }
  });

  it('turns the right way on the ring: the heading goes up by step over radius each step', () => {
    const ring = inSegment('ring');
    for (let i = 1; i < ring.length; i++) {
      let dh = ring[i]!.heading - ring[i - 1]!.heading;
      while (dh > Math.PI) dh -= 2 * Math.PI;
      while (dh < -Math.PI) dh += 2 * Math.PI;
      expect(dh).toBeCloseTo(STEP / ROUNDABOUT.centreline, 3);
    }
  });

  it('clamps outside the loop', () => {
    expect(path.pose(-10)).toEqual(path.pose(0));
    expect(path.pose(path.length + 50)).toEqual(path.pose(path.length));
  });

  it('takes about ten seconds at the roundabout speed', () => {
    const seconds = loopSeconds(path);
    expect(seconds).toBeGreaterThan(6);
    expect(seconds).toBeLessThan(14);
  });

  it('starts from any point on the road and still joins the same ring', () => {
    const later = loopPath(routeModel, 1 - 20 / routeModel.length);
    const join = later.segments.find((s) => s.kind === 'ring')!;
    const p = later.pose(join.from);
    expect(distanceFromCentre(p.x, p.z)).toBeCloseTo(ROUNDABOUT.centreline, 1);
    expect(later.length).toBeLessThan(path.length);
  });
});

describe('ring strips', () => {
  const strips = ringStrips(routeModel);

  it('make the ring from straight strips, each centred on the ring and as wide as the road', () => {
    expect(strips).toHaveLength(ROUNDABOUT.segments);
    for (const strip of strips) {
      expect(strip.width).toBe(ROUNDABOUT.width);
      const mid = strip.origin.clone().addScaledVector(strip.dir, strip.length / 2);
      expect(distanceFromCentre(mid.x, mid.z)).toBeCloseTo(ROUNDABOUT.centreline, 6);
      expect(strip.dir.length()).toBeCloseTo(1, 6);
    }
  });

  it('overlap their neighbours so there are no gaps', () => {
    const share = (2 * Math.PI * ROUNDABOUT.centreline) / ROUNDABOUT.segments;
    expect(strips[0]!.length).toBeGreaterThan(share);
  });
});

describe('outer bank', () => {
  const bank = bankGeometry(routeModel);
  const position = bank.getAttribute('position');

  it('runs round the outside of the ring at its radius', () => {
    for (let i = 0; i < position.count; i += 7) {
      const r = distanceFromCentre(position.getX(i), position.getZ(i));
      expect(Math.abs(r - (OUTER_RADIUS + BANK_TUBE))).toBeLessThanOrEqual(BANK_TUBE + 0.01);
    }
  });

  it('leaves the mouth of the road open, so the road runs in without a wall of snow', () => {
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const z = position.getZ(i);
      const near = Math.hypot(x - end.x, z - end.z) < ROUNDABOUT.width / 2 - 0.5;
      expect(near).toBe(false);
    }
  });

  it('is there on the far side of the ring', () => {
    const far = ringPoint(layout, OUTER_RADIUS + BANK_TUBE, Math.PI);
    const closest = Math.min(
      ...Array.from({ length: position.count }, (_, i) =>
        Math.hypot(position.getX(i) - far.x, position.getZ(i) - far.z),
      ),
    );
    expect(closest).toBeLessThan(1.5);
  });
});
