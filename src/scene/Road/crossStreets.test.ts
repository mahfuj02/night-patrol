import { describe, expect, it } from 'vitest';
import { route } from '@/content';
import { crossings } from './crossings';
import { buildArmRibbons, buildArmRidges } from './armGeometry';
import { routeModel } from './route';

describe('crossings', () => {
  it('has one crossing for every intersection with a street, with two arms each', () => {
    expect(crossings.map((c) => c.id)).toEqual(route.intersections!.map((x) => x.id));
    for (const crossing of crossings) expect(crossing.arms).toHaveLength(2);
  });

  it('is centred on its gap', () => {
    for (const crossing of crossings) {
      const gap = routeModel.intersections.find((x) => x.id === crossing.id)!;
      expect(crossing.u).toBeCloseTo((gap.from + gap.to) / 2, 10);
      expect(routeModel.inIntersection(crossing.u)).toBe(true);
      const point = routeModel.curve.getPointAt(crossing.u);
      expect(crossing.centre.distanceTo(point)).toBeLessThan(1e-9);
    }
  });

  it('runs square to the route, away from it on both sides', () => {
    for (const crossing of crossings) {
      const [left, right] = crossing.arms;
      expect(left.dir.dot(crossing.tangent)).toBeCloseTo(0, 9);
      expect(right.dir.dot(left.dir)).toBeCloseTo(-1, 9);
      // The right-hand arm leaves on the right of travel.
      expect(right.dir.dot(crossing.right)).toBeCloseTo(1, 9);
    }
  });

  it('starts each arm at the edge of the main road and runs for the street length', () => {
    for (const crossing of crossings) {
      for (const arm of crossing.arms) {
        expect(arm.origin.distanceTo(crossing.centre)).toBeCloseTo(crossing.mainHalf - 0.3, 6);
        const end = arm.model.curve.getPointAt(1);
        expect(end.distanceTo(crossing.centre)).toBeCloseTo(crossing.street.length, 6);
        expect(arm.model.length).toBeCloseTo(arm.length, 6);
      }
    }
  });

  it('keeps every street inside its gap, so buildings and trees stay clear', () => {
    for (const spec of route.intersections!) {
      expect(spec.halfLength).toBeGreaterThanOrEqual(spec.street!.width / 2 + 3);
    }
  });

  it('shares the zone of its crossing and has its own junction gap', () => {
    for (const crossing of crossings) {
      for (const arm of crossing.arms) {
        expect(arm.model.zoneU).toBe(crossing.u);
        expect(arm.model.inIntersection(0)).toBe(true);
        expect(arm.model.inIntersection(0.5)).toBe(false);
      }
    }
  });

  it('does not build a crossing for an intersection without a street', () => {
    const plain = route.intersections!.map((x) => ({ ...x, street: undefined }));
    expect(plain.length).toBeGreaterThan(0);
  });
});

describe('arm geometry', () => {
  const arms = crossings.flatMap((c) => c.arms);

  it('builds one flat, upward-facing ribbon geometry for all arms', () => {
    const geometry = buildArmRibbons(arms, 0.025);
    const position = geometry.getAttribute('position');
    expect(position.count).toBe(arms.length * 25 * 2);
    for (let i = 0; i < position.count; i++) expect(position.getY(i)).toBeCloseTo(0.025, 6);
    expect(geometry.getAttribute('aRoad').count).toBe(position.count);
    expect(geometry.getIndex()!.count).toBe(arms.length * 24 * 6);
  });

  it('winds triangles to face up', () => {
    const geometry = buildArmRibbons(arms.slice(0, 1), 0);
    const p = geometry.getAttribute('position');
    const i = geometry.getIndex()!;
    const v = (k: number) => [p.getX(i.getX(k)), p.getZ(i.getX(k))];
    const [a, b, c] = [v(0), v(1), v(2)];
    // Counter-clockwise seen from above (+y) means a positive cross product in (x, z) with y up.
    const cross = (b[0]! - a[0]!) * (c[1]! - a[1]!) - (b[1]! - a[1]!) * (c[0]! - a[0]!);
    expect(cross).toBeLessThan(0);
  });

  it('merges the ridges of every arm and keeps them off the junction', () => {
    const geometry = buildArmRidges(arms, { step: 3, profile: 4, seed: 1 });
    expect(geometry.getAttribute('position').count).toBeGreaterThan(0);
    expect(geometry.getAttribute('normal').count).toBe(geometry.getAttribute('position').count);
  });
});
