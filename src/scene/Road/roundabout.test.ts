import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { headingVector } from '@/lib/parking';
import {
  BANK_TUBE,
  OUTER_RADIUS,
  ROUNDABOUT,
  TURNAROUND,
  arcPath,
  arcSeconds,
  bankGeometry,
  outerRadius,
  ringPoint,
  ringStrips,
  roundaboutLayout,
  type RingEnd,
} from './roundabout';
import { routeModel } from './route';

const ENDS: RingEnd[] = ['forks', 'start'];

describe.each(ENDS)('the %s roundabout', (ringEnd) => {
  const layout = roundaboutLayout(routeModel, ringEnd);
  const { spec, forward, left, roadEnd, centre } = layout;
  const outer = outerRadius(spec);
  const sign = ringEnd === 'forks' ? 1 : -1;

  /** Where a world point is relative to the road's axis at its end: along (forward) and across (left). */
  const alongAxis = (x: number, z: number) =>
    (x - roadEnd.x) * forward.x + (z - roadEnd.z) * forward.z;
  const acrossAxis = (x: number, z: number) => (x - roadEnd.x) * left.x + (z - roadEnd.z) * left.z;
  const distanceFromCentre = (x: number, z: number) => Math.hypot(x - centre.x, z - centre.z);

  describe('layout', () => {
    it('faces away from the road: forward is the way the car drives into it', () => {
      const tangent = routeModel.curve.getTangentAt(ringEnd === 'forks' ? 1 : 0).setY(0);
      expect(forward.dot(tangent.normalize())).toBeCloseTo(sign, 6);
    });

    it('centres the ring on the road axis, straight ahead of the end of the road', () => {
      const toCentre = centre.clone().sub(roadEnd);
      expect(acrossAxis(centre.x, centre.z)).toBeCloseTo(0, 6);
      expect(toCentre.length()).toBeCloseTo(outer, 6);
      expect(toCentre.clone().normalize().dot(forward)).toBeCloseTo(1, 6);
    });

    it('starts the ring exactly where the road ends: the outer edge touches the end of the road', () => {
      expect(distanceFromCentre(roadEnd.x, roadEnd.z)).toBeCloseTo(outer, 6);
    });

    it("puts the mouth of the ring (theta = 0) on the road, and the first half turn on the car's right", () => {
      expect(ringPoint(layout, outer, 0).distanceTo(roadEnd)).toBeCloseTo(0, 6);
      const quarter = ringPoint(layout, spec.centreline, Math.PI / 2);
      expect(acrossAxis(quarter.x, quarter.z)).toBeLessThan(0);
    });

    it('keeps the island inside the ring', () => {
      expect(spec.island).toBeLessThan(spec.centreline - spec.width / 2 + 0.01);
    });
  });

  describe('the pass', () => {
    const path = arcPath(routeModel, ringEnd);
    const STEP = 0.25;
    const samples: { d: number; x: number; z: number; heading: number }[] = [];
    for (let d = 0; d <= path.length + 1e-9; d += STEP) samples.push({ d, ...path.pose(d) });
    const inSegment = (kind: string) => {
      const s = path.segments.find((x) => x.kind === kind)!;
      return samples.filter((p) => p.d >= s.from && p.d <= s.to);
    };

    it('is the entry, the ring and the exit, in that order, end to end', () => {
      expect(path.segments.map((s) => s.kind)).toEqual(['entry', 'ring', 'exit']);
      for (let i = 1; i < path.segments.length; i++) {
        expect(path.segments[i]!.from).toBeCloseTo(path.segments[i - 1]!.to, 9);
      }
      expect(path.segments[path.segments.length - 1]!.to).toBeCloseTo(path.length, 9);
    });

    it('starts in the car lane `approach` metres in from the end of the road, facing the ring', () => {
      const start = samples[0]!;
      expect(alongAxis(start.x, start.z)).toBeCloseTo(-spec.approach, 0);
      // On the car's right-hand side of the axis, inside the road.
      expect(acrossAxis(start.x, start.z)).toBeCloseTo(-layout.laneOffset, 1);
      const [hx, hz] = headingVector(start.heading);
      expect(hx * forward.x + hz * forward.z).toBeCloseTo(1, 1);
    });

    it('bears right onto the ring, joining it tangentially at the join angle', () => {
      const last = path.pose(path.segments.find((x) => x.kind === 'entry')!.to);
      const join = ringPoint(layout, spec.centreline, spec.joinAngle);
      expect(last.x).toBeCloseTo(join.x, 1);
      expect(last.z).toBeCloseTo(join.z, 1);
      const radial = new Vector3(last.x - centre.x, 0, last.z - centre.z).normalize();
      const [hx, hz] = headingVector(last.heading);
      expect(Math.abs(hx * radial.x + hz * radial.z)).toBeLessThan(0.03);
      expect(acrossAxis(last.x, last.z)).toBeLessThan(-1.5);
    });

    it('stays on the ring (and inside it) all the way round', () => {
      for (const p of inSegment('ring')) {
        expect(distanceFromCentre(p.x, p.z)).toBeCloseTo(spec.centreline, 4);
      }
      for (const p of [...inSegment('entry'), ...inSegment('ring'), ...inSegment('exit')]) {
        if (alongAxis(p.x, p.z) > 0.1) {
          const r = distanceFromCentre(p.x, p.z);
          expect(r).toBeGreaterThan(spec.island);
          expect(r).toBeLessThan(outer + 0.01);
        }
      }
    });

    it('goes right round: the far side is reached, with the island on the left', () => {
      const ring = inSegment('ring');
      const far = Math.max(...ring.map((p) => Math.hypot(p.x - roadEnd.x, p.z - roadEnd.z)));
      expect(far).toBeGreaterThan(2 * outer - 6);
      const quarter = ring[Math.floor(ring.length / 4)]!;
      const [hx, hz] = headingVector(quarter.heading);
      const toCentre = new Vector3(centre.x - quarter.x, 0, centre.z - quarter.z).normalize();
      expect(hz * toCentre.x - hx * toCentre.z).toBeGreaterThan(0.99);
    });

    it('leaves into the other lane, heading back along the road, at the same place it came in', () => {
      const end = samples[samples.length - 1]!;
      expect(alongAxis(end.x, end.z)).toBeCloseTo(-spec.approach, 0);
      expect(acrossAxis(end.x, end.z)).toBeCloseTo(layout.laneOffset, 1);
      const [hx, hz] = headingVector(end.heading);
      expect(hx * forward.x + hz * forward.z).toBeCloseTo(-1, 1);
      expect(path.to.x).toBeCloseTo(path.pose(path.length).x, 6);
      expect(path.from.x).toBeCloseTo(path.pose(0).x, 6);
    });

    it('starts and ends on the road lanes the loop expects', () => {
      const arrive = routeModel.lanePointAt(path.u, new Vector3(), sign as 1 | -1);
      const depart = routeModel.lanePointAt(path.u, new Vector3(), -sign as 1 | -1);
      expect(path.from.x).toBeCloseTo(arrive.x, 6);
      expect(path.from.z).toBeCloseTo(arrive.z, 6);
      expect(path.to.x).toBeCloseTo(depart.x, 6);
      expect(path.to.z).toBeCloseTo(depart.z, 6);
    });

    it('moves smoothly: no jumps in position or heading anywhere in the pass', () => {
      for (let i = 1; i < samples.length; i++) {
        const a = samples[i - 1]!;
        const b = samples[i]!;
        expect(Math.hypot(b.x - a.x, b.z - a.z)).toBeLessThan(STEP * 1.6);
        let dh = b.heading - a.heading;
        while (dh > Math.PI) dh -= 2 * Math.PI;
        while (dh < -Math.PI) dh += 2 * Math.PI;
        expect(Math.abs(dh)).toBeLessThan(0.15);
      }
    });

    it('turns the right way on the ring: the heading goes up by step over radius each step', () => {
      const ring = inSegment('ring');
      for (let i = 1; i < ring.length; i++) {
        let dh = ring[i]!.heading - ring[i - 1]!.heading;
        while (dh > Math.PI) dh -= 2 * Math.PI;
        while (dh < -Math.PI) dh += 2 * Math.PI;
        expect(dh).toBeCloseTo(STEP / spec.centreline, 3);
      }
    });

    it('clamps outside the pass', () => {
      expect(path.pose(-10)).toEqual(path.pose(0));
      expect(path.pose(path.length + 50)).toEqual(path.pose(path.length));
    });

    it('takes a few seconds at the roundabout speed', () => {
      const seconds = arcSeconds(path, ringEnd);
      expect(seconds).toBeGreaterThan(ringEnd === 'forks' ? 6 : 3.5);
      expect(seconds).toBeLessThan(ringEnd === 'forks' ? 10 : 7);
    });
  });

  describe('ring strips', () => {
    const strips = ringStrips(routeModel, ringEnd);

    it('make the ring from straight strips, each centred on the ring and as wide as the ring', () => {
      expect(strips).toHaveLength(spec.segments);
      for (const strip of strips) {
        expect(strip.width).toBe(spec.width);
        const mid = strip.origin.clone().addScaledVector(strip.dir, strip.length / 2);
        expect(distanceFromCentre(mid.x, mid.z)).toBeCloseTo(spec.centreline, 6);
        expect(strip.dir.length()).toBeCloseTo(1, 6);
      }
    });

    it('overlap their neighbours so there are no gaps', () => {
      const share = (2 * Math.PI * spec.centreline) / spec.segments;
      expect(strips[0]!.length).toBeGreaterThan(share);
    });
  });

  describe('outer bank', () => {
    const bank = bankGeometry(routeModel, ringEnd);
    const position = bank.getAttribute('position');

    it('runs round the outside of the ring at its radius', () => {
      for (let i = 0; i < position.count; i += 7) {
        const r = distanceFromCentre(position.getX(i), position.getZ(i));
        expect(Math.abs(r - (outer + BANK_TUBE))).toBeLessThanOrEqual(BANK_TUBE + 0.01);
      }
    });

    it('leaves the mouth of the road open, so the road runs in without a wall of snow', () => {
      for (let i = 0; i < position.count; i++) {
        const near =
          Math.hypot(position.getX(i) - roadEnd.x, position.getZ(i) - roadEnd.z) <
          spec.width / 2 - 0.5;
        expect(near).toBe(false);
      }
    });

    it('is there on the far side of the ring', () => {
      const far = ringPoint(layout, outer + BANK_TUBE, Math.PI);
      const closest = Math.min(
        ...Array.from({ length: position.count }, (_, i) =>
          Math.hypot(position.getX(i) - far.x, position.getZ(i) - far.z),
        ),
      );
      expect(closest).toBeLessThan(BANK_TUBE + 0.5);
    });
  });
});

describe('the two roundabouts together', () => {
  it('keeps the Forks ring as it was', () => {
    expect(OUTER_RADIUS).toBe(22);
    expect(ROUNDABOUT.centreline).toBe(17);
  });

  it('makes the turnaround smaller than the Forks ring', () => {
    expect(TURNAROUND.centreline).toBeLessThan(ROUNDABOUT.centreline);
    expect(outerRadius(TURNAROUND)).toBeLessThan(OUTER_RADIUS);
  });

  it('puts the turnaround behind the start of the road, facing away from it', () => {
    const layout = roundaboutLayout(routeModel, 'start');
    const first = routeModel.curve.getPointAt(0);
    const second = routeModel.curve.getPointAt(10 / routeModel.length);
    expect(layout.centre.distanceTo(second)).toBeGreaterThan(layout.centre.distanceTo(first));
  });
});
