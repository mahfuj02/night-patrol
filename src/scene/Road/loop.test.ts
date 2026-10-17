import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { loopMetres, route } from '@/content/route';
import { stops } from '@/content/stops';
import { driveOffset } from '@/lib/lanes';
import { headingVector } from '@/lib/parking';
import { patrolLoop, STOP_VISITS } from '@/lib/patrolLoop';
import { forksArc, loopPoseAt, routeAt, startArc } from './loop';
import { ROUNDABOUT, TURNAROUND } from './roundabout';
import { routeModel } from './route';

describe('the loop numbers in the content', () => {
  it('match the real road and roundabouts, so the car meets them where they are', () => {
    expect(route.lengthMetres).toBeCloseTo(routeModel.length, 1);
    expect(loopMetres.forksArc).toBeCloseTo(forksArc.length, 1);
    expect(loopMetres.startArc).toBeCloseTo(startArc.length, 1);
    expect(loopMetres.forksRun).toBe(ROUNDABOUT.approach);
    expect(loopMetres.startRun).toBe(TURNAROUND.approach);
  });
});

describe('lanes for each direction', () => {
  it('puts the car in the right-hand lane going forward and in the other lane going back', () => {
    for (const u of [0.05, 0.3, 0.55, 0.8]) {
      const axis = routeModel.curve.getPointAt(u);
      const t = routeModel.curve.getTangentAt(u);
      const forward = routeModel.lanePointAt(u, new Vector3(), 1);
      const back = routeModel.lanePointAt(u, new Vector3(), -1);
      const offset = driveOffset(routeModel.widthAt(u));
      const across = (p: Vector3) => (p.x - axis.x) * -t.z + (p.z - axis.z) * t.x;
      expect(across(forward)).toBeCloseTo(offset, 6);
      expect(across(back)).toBeCloseTo(-offset, 6);
    }
  });
});

describe('where the car is round the loop', () => {
  const STEP = 0.25;

  it('is one closed path: no jump anywhere, including across the seam, in position or heading', () => {
    let previous = loopPoseAt(0);
    for (let s = STEP; s <= patrolLoop.length + STEP; s += STEP) {
      const pose = loopPoseAt(s);
      expect(Math.hypot(pose.x - previous.x, pose.z - previous.z), `${s} m`).toBeLessThan(
        STEP * 1.7,
      );
      let dh = pose.heading - previous.heading;
      while (dh > Math.PI) dh -= 2 * Math.PI;
      while (dh < -Math.PI) dh += 2 * Math.PI;
      expect(Math.abs(dh), `${s} m`).toBeLessThan(0.15);
      previous = pose;
    }
  });

  it('is the same place one lap on', () => {
    for (const s of [0, 100, 500, 1500, 2000]) {
      const a = loopPoseAt(s);
      const b = loopPoseAt(s + patrolLoop.length);
      expect(b.x).toBeCloseTo(a.x, 6);
      expect(b.z).toBeCloseTo(a.z, 6);
    }
  });

  it('drives each stop in its own lane: on the right going out, and on the left of the route coming back', () => {
    for (const visit of STOP_VISITS) {
      const stop = stops[visit.stop]!;
      const pose = loopPoseAt(visit.s);
      const axis = routeModel.curve.getPointAt(stop.t);
      const tangent = routeModel.curve.getTangentAt(stop.t);
      // Right of the route's own direction: positive.
      const across = (pose.x - axis.x) * -tangent.z + (pose.z - axis.z) * tangent.x;
      expect(Math.sign(across), `${stop.id} ${visit.direction}`).toBe(visit.direction);
      const [hx, hz] = headingVector(pose.heading);
      expect((hx * tangent.x + hz * tangent.z) * visit.direction).toBeGreaterThan(0.95);
    }
  });

  it('heads along the route, and reports the route position and direction', () => {
    const start = routeAt(patrolLoop.outS(500));
    expect(start.direction).toBe(1);
    expect(start.t).toBeCloseTo(500 / patrolLoop.spec.road, 9);
    const back = routeAt(patrolLoop.backS(500));
    expect(back.direction).toBe(-1);
    expect(back.t).toBeCloseTo(500 / patrolLoop.spec.road, 9);
  });

  it('writes into the object it is given and returns it', () => {
    const out = { x: 0, z: 0, heading: 0 };
    expect(loopPoseAt(300, out)).toBe(out);
    expect(out.x).not.toBe(0);
  });

  it('goes round both roundabouts: the far side of each ring is reached', () => {
    const { forks, start } = {
      forks: patrolLoop.pieces[1]!,
      start: patrolLoop.pieces[3]!,
    };
    const reach = (from: number, to: number, at: { x: number; z: number }) => {
      let far = 0;
      for (let s = from; s <= to; s += 0.5) {
        const p = loopPoseAt(s);
        far = Math.max(far, Math.hypot(p.x - at.x, p.z - at.z));
      }
      return far;
    };
    const forksEnd = routeModel.curve.getPointAt(1);
    const startEnd = routeModel.curve.getPointAt(0);
    expect(reach(forks.from, forks.to, forksEnd)).toBeGreaterThan(30);
    expect(reach(start.from, start.to, startEnd)).toBeGreaterThan(18);
  });
});
