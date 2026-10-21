import { describe, expect, it } from 'vitest';
import { headingVector, type Pose } from './parking';
import { uTurnPath } from './uturn';

const norm = (a: number) => {
  let x = a;
  while (x > Math.PI) x -= 2 * Math.PI;
  while (x < -Math.PI) x += 2 * Math.PI;
  return x;
};

describe('uTurnPath', () => {
  // A road running along +z (heading 0): the car in the right-hand lane (x = -2 when heading +z in
  // this frame) turns into the other lane (x = +2) heading back (heading pi), 10 m further on.
  const start: Pose = { x: -2, z: 0, heading: 0 };
  const end: Pose = { x: 2, z: 10, heading: Math.PI };
  const path = uTurnPath(start, end);

  it('starts and ends exactly at the given poses', () => {
    expect(path.pose(0)).toEqual(start);
    expect(path.pose(1)).toEqual(end);
    expect(path.pose(-1)).toEqual(start);
    expect(path.pose(2)).toEqual(end);
  });

  it('leaves along the start heading and arrives along the end heading', () => {
    const [sx, sz] = headingVector(path.pose(0.01).heading);
    expect(sz).toBeGreaterThan(0.99);
    expect(Math.abs(sx)).toBeLessThan(0.1);
    const [ex, ez] = headingVector(path.pose(0.99).heading);
    expect(ez).toBeLessThan(-0.99);
    expect(Math.abs(ex)).toBeLessThan(0.1);
  });

  it('turns through half a turn the same way all along, never back and forth', () => {
    let total = 0;
    let previous = path.pose(0).heading;
    let direction = 0;
    for (let i = 1; i <= 100; i++) {
      const heading = path.pose(i / 100).heading;
      const delta = norm(heading - previous);
      if (Math.abs(delta) > 1e-6) {
        const sign = Math.sign(delta);
        if (direction === 0) direction = sign;
        expect(sign).toBe(direction);
      }
      total += delta;
      previous = heading;
    }
    expect(Math.abs(total)).toBeCloseTo(Math.PI, 1);
  });

  it('swings out past the end before curling back, never sliding sideways', () => {
    let furthest = 0;
    for (let i = 0; i <= 100; i++) furthest = Math.max(furthest, path.pose(i / 100).z);
    expect(furthest).toBeGreaterThan(end.z);
    // The step between samples is small and steady: no jumps.
    for (let i = 1; i <= 100; i++) {
      const a = path.pose((i - 1) / 100);
      const b = path.pose(i / 100);
      expect(Math.hypot(b.x - a.x, b.z - a.z)).toBeLessThan(path.length / 40);
    }
  });

  it('crosses from one lane to the other and stays near the road', () => {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i <= 100; i++) {
      const { x } = path.pose(i / 100);
      min = Math.min(min, x);
      max = Math.max(max, x);
    }
    expect(min).toBeGreaterThanOrEqual(-4);
    expect(max).toBeLessThanOrEqual(8);
    expect(path.pose(0.5).x).toBeGreaterThan(-2);
  });

  it('is longer than the straight line between its ends', () => {
    expect(path.length).toBeGreaterThan(Math.hypot(4, 10));
    expect(path.length).toBeLessThan(40);
  });
});
