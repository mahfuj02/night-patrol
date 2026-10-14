import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { driveOffset } from '@/lib/lanes';
import { headingVector } from '@/lib/parking';
import { routeModel } from './Road/route';
import { carPoseAt, travel } from './travel';

describe('lanes for each direction', () => {
  it('puts the car in the right-hand lane going forward and in the other lane going back', () => {
    for (const u of [0.05, 0.3, 0.55, 0.8]) {
      const axis = routeModel.curve.getPointAt(u);
      const t = routeModel.curve.getTangentAt(u);
      const forward = routeModel.lanePointAt(u, new Vector3(), 1);
      const back = routeModel.lanePointAt(u, new Vector3(), -1);
      const offset = driveOffset(routeModel.widthAt(u));
      // Across the road: positive to the right of the way the route runs.
      const across = (p: Vector3) => (p.x - axis.x) * -t.z + (p.z - axis.z) * t.x;
      expect(across(forward)).toBeCloseTo(offset, 6);
      expect(across(back)).toBeCloseTo(-offset, 6);
      // Mirror images across the axis, the same distance from it.
      expect(forward.clone().add(back).multiplyScalar(0.5).distanceTo(axis)).toBeCloseTo(0, 6);
    }
  });

  it('defaults to the forward lane, as before', () => {
    const a = routeModel.lanePointAt(0.4);
    const b = routeModel.lanePointAt(0.4, new Vector3(), 1);
    expect(a.distanceTo(b)).toBe(0);
  });
});

describe('carPoseAt', () => {
  it('faces along the route going forward and back along it going back', () => {
    for (const u of [0.1, 0.45, 0.9]) {
      const t = routeModel.curve.getTangentAt(u);
      const forward = carPoseAt(u, 1);
      const back = carPoseAt(u, -1);
      const [fx, fz] = headingVector(forward.heading);
      const [bx, bz] = headingVector(back.heading);
      expect(fx * t.x + fz * t.z).toBeCloseTo(1, 6);
      expect(bx * t.x + bz * t.z).toBeCloseTo(-1, 6);
    }
  });

  it('is on the right of its own direction of travel, in both', () => {
    const u = 0.5;
    for (const direction of [1, -1] as const) {
      const pose = carPoseAt(u, direction);
      const axis = routeModel.curve.getPointAt(u);
      const [hx, hz] = headingVector(pose.heading);
      // To the right of a heading (hx, hz) is (-hz, hx).
      const right = (pose.x - axis.x) * -hz + (pose.z - axis.z) * hx;
      expect(right).toBeGreaterThan(1);
    }
  });

  it('writes into the object it is given and returns it', () => {
    const out = { x: 0, z: 0, heading: 0 };
    expect(carPoseAt(0.2, 1, out)).toBe(out);
    expect(out.x).not.toBe(0);
  });

  it('starts facing forward, with no U-turn under way', () => {
    expect(travel.direction).toBe(1);
    expect(travel.turn).toBeNull();
  });
});
