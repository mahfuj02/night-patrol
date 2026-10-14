import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { headingVector } from '@/lib/parking';
import { ROUNDABOUT, loopPath, loopSeconds, ringStrips, roundaboutLayout } from './roundabout';
import { routeModel } from './route';

const layout = roundaboutLayout(routeModel);
const stopU = routeModel.stopFractions.get('the-forks')!;

describe('roundabout layout', () => {
  it('puts the island centre on the left of the end of the route, one ring radius away', () => {
    expect(layout.centre.distanceTo(layout.end)).toBeCloseTo(ROUNDABOUT.centreline, 6);
    // The end of the road lies on the ring's centre line, which is tangent to the road there.
    expect(layout.forward.dot(layout.centre.clone().sub(layout.end))).toBeCloseTo(0, 6);
    expect(layout.left.dot(layout.centre.clone().sub(layout.end))).toBeGreaterThan(0);
  });

  it('sits well beyond the last stop, so the ring never overlaps the stop or its station', () => {
    const stop = routeModel.curve.getPointAt(stopU);
    const behind = stop.clone().sub(layout.end).dot(layout.forward);
    // The ring reaches back this far behind the end of the road.
    const reach = ROUNDABOUT.centreline + ROUNDABOUT.width / 2;
    expect(-behind).toBeGreaterThan(reach + 8);
  });

  it('keeps the car lane inside the ring, between the island and the outer edge', () => {
    expect(layout.laneRadius).toBeGreaterThan(ROUNDABOUT.island);
    expect(layout.laneRadius).toBeLessThan(ROUNDABOUT.centreline + ROUNDABOUT.width / 2);
  });

  it('keeps the island inside the ring (a gap of snow bank between)', () => {
    expect(ROUNDABOUT.island).toBeLessThan(ROUNDABOUT.centreline - ROUNDABOUT.width / 2 + 0.01);
  });
});

describe('loop path', () => {
  const path = loopPath(routeModel, stopU);
  const centre2d = (x: number, z: number) => Math.hypot(x - layout.centre.x, z - layout.centre.z);

  it('starts at the car lane where the car is, facing along the road', () => {
    const start = path.pose(0);
    const lane = routeModel.lanePointAt(stopU);
    expect(start.x).toBeCloseTo(lane.x, 6);
    expect(start.z).toBeCloseTo(lane.z, 6);
    const t = routeModel.curve.getTangentAt(stopU);
    const [hx, hz] = headingVector(start.heading);
    expect(hx * t.x + hz * t.z).toBeCloseTo(1, 6);
  });

  it('runs the lead-in along the road to its end, then enters the ring on the car lane', () => {
    expect(path.leadIn).toBeCloseTo((1 - stopU) * routeModel.length, 6);
    expect(path.leadIn).toBeGreaterThan(30);
    const entry = path.pose(path.leadIn);
    const lane = routeModel.lanePointAt(1);
    expect(entry.x).toBeCloseTo(lane.x, 4);
    expect(entry.z).toBeCloseTo(lane.z, 4);
    expect(centre2d(entry.x, entry.z)).toBeCloseTo(layout.laneRadius, 4);
  });

  it('keeps to the car lane radius all the way round the ring', () => {
    for (let i = 0; i <= 40; i++) {
      const d = path.leadIn + (i / 40) * (path.length - path.leadIn);
      const pose = path.pose(d);
      expect(centre2d(pose.x, pose.z)).toBeCloseTo(layout.laneRadius, 4);
    }
  });

  it('goes round with the island on its left (counter-clockwise from above)', () => {
    const quarter = path.leadIn + (path.length - path.leadIn) / 4;
    const pose = path.pose(quarter);
    const [hx, hz] = headingVector(pose.heading);
    const toCentre = new Vector3(layout.centre.x - pose.x, 0, layout.centre.z - pose.z).normalize();
    // Left of the heading (hz, -hx) points at the island.
    expect(hz * toCentre.x - hx * toCentre.z).toBeGreaterThan(0.99);
  });

  it('turns smoothly: the heading changes at a steady rate round the ring', () => {
    const step = 0.5;
    let previous = path.pose(path.leadIn + 1).heading;
    for (let d = path.leadIn + 1 + step; d < path.length - 1; d += step) {
      const heading = path.pose(d).heading;
      let delta = heading - previous;
      while (delta > Math.PI) delta -= 2 * Math.PI;
      while (delta < -Math.PI) delta += 2 * Math.PI;
      // The car turns left: the heading goes up by step / radius each step.
      expect(delta).toBeCloseTo(step / layout.laneRadius, 3);
      previous = heading;
    }
  });

  it('comes back to where it entered, facing the same way, after one lap', () => {
    const entry = path.pose(path.leadIn);
    const end = path.pose(path.length);
    expect(end.x).toBeCloseTo(entry.x, 4);
    expect(end.z).toBeCloseTo(entry.z, 4);
    const [ex, ez] = headingVector(entry.heading);
    const [fx, fz] = headingVector(end.heading);
    expect(ex * fx + ez * fz).toBeCloseTo(1, 4);
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

  it('has no lead-in from the end of the road', () => {
    const fromEnd = loopPath(routeModel, 1);
    expect(fromEnd.leadIn).toBe(0);
    expect(fromEnd.length).toBeCloseTo(2 * Math.PI * layout.laneRadius, 6);
  });
});

describe('ring strips', () => {
  const strips = ringStrips(routeModel);

  it('make the ring from straight strips, each centred on the ring and as wide as the road', () => {
    expect(strips).toHaveLength(ROUNDABOUT.segments);
    for (const strip of strips) {
      expect(strip.width).toBe(ROUNDABOUT.width);
      const mid = strip.origin.clone().addScaledVector(strip.dir, strip.length / 2);
      expect(Math.hypot(mid.x - layout.centre.x, mid.z - layout.centre.z)).toBeCloseTo(
        ROUNDABOUT.centreline,
        6,
      );
      expect(strip.dir.length()).toBeCloseTo(1, 6);
    }
  });

  it('overlap their neighbours so there are no gaps', () => {
    const share = (2 * Math.PI * ROUNDABOUT.centreline) / ROUNDABOUT.segments;
    expect(strips[0]!.length).toBeGreaterThan(share);
  });
});
