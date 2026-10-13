import { describe, expect, it } from 'vitest';
import {
  bayPose,
  bezierPoint,
  bezierTangent,
  easeInOut,
  headingVector,
  parkingPath,
  reversePose,
  vectorHeading,
} from './parking';

const start = { x: 0, z: 0, heading: 0 }; // facing +z
const end = { x: -9, z: 18, heading: -Math.PI / 2 }; // in a bay to the -x side, facing -x

describe('headings', () => {
  it('turns a heading into a direction and back', () => {
    for (const h of [0, 0.7, -1.2, Math.PI / 2, 3]) {
      const [x, z] = headingVector(h);
      expect(vectorHeading(x, z)).toBeCloseTo(Math.atan2(Math.sin(h), Math.cos(h)), 10);
      expect(Math.hypot(x, z)).toBeCloseTo(1, 10);
    }
    expect(headingVector(0)).toEqual([0, 1]);
  });
});

describe('bezier', () => {
  const p: [number, number][] = [
    [0, 0],
    [0, 4],
    [4, 6],
    [8, 8],
  ];
  it('starts and ends on its end points', () => {
    expect(bezierPoint(p[0]!, p[1]!, p[2]!, p[3]!, 0)).toEqual([0, 0]);
    expect(bezierPoint(p[0]!, p[1]!, p[2]!, p[3]!, 1)).toEqual([8, 8]);
  });
  it('has a tangent along the first and last handles at the ends', () => {
    const [sx, sz] = bezierTangent(p[0]!, p[1]!, p[2]!, p[3]!, 0);
    const [ex, ez] = bezierTangent(p[0]!, p[1]!, p[2]!, p[3]!, 1);
    expect([sx, sz]).toEqual([0, 12]);
    expect([ex, ez]).toEqual([12, 6]);
  });
});

describe('easeInOut', () => {
  it('runs 0 to 1 with a flat start and finish, clamped', () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(0.5)).toBe(0.5);
    expect(easeInOut(-1)).toBe(0);
    expect(easeInOut(2)).toBe(1);
    expect(easeInOut(0.1)).toBeLessThan(0.1);
    expect(easeInOut(0.9)).toBeGreaterThan(0.9);
  });
});

describe('parkingPath', () => {
  const path = parkingPath(start, end);

  it('starts at the start pose and ends in the bay, facing the wall', () => {
    expect(path.pose(0)).toEqual(start);
    expect(path.pose(1)).toEqual(end);
    const nearEnd = path.pose(0.999);
    expect(nearEnd.heading).toBeCloseTo(end.heading, 1);
  });

  it('turns smoothly, never doubling back, with the car always facing the way it moves', () => {
    let previous = path.pose(0);
    for (let s = 0.02; s <= 1.0001; s += 0.02) {
      const next = path.pose(s);
      // Always moving toward the bay along z, and toward the bay side along x.
      expect(next.z).toBeGreaterThanOrEqual(previous.z - 1e-9);
      expect(next.x).toBeLessThanOrEqual(previous.x + 1e-9);
      // The heading is the direction of motion between samples, within a small angle.
      const move = Math.atan2(next.x - previous.x, next.z - previous.z);
      const diff = Math.atan2(Math.sin(move - next.heading), Math.cos(move - next.heading));
      expect(Math.abs(diff)).toBeLessThan(0.35);
      previous = next;
    }
  });

  it('is longer than the straight line and shorter than going round the corner', () => {
    const straight = Math.hypot(end.x, end.z);
    expect(path.length).toBeGreaterThan(straight);
    expect(path.length).toBeLessThan(Math.abs(end.x) + end.z);
  });

  it('handles a bay straight ahead and a zero-length hop', () => {
    const ahead = parkingPath(start, { x: 0, z: 10, heading: 0 });
    expect(ahead.pose(0.5).x).toBeCloseTo(0, 6);
    expect(ahead.length).toBeCloseTo(10, 4);
    const none = parkingPath(start, start);
    expect(none.length).toBeLessThan(0.05);
    expect(Number.isFinite(none.pose(0.5).x)).toBe(true);
  });
});

describe('reversePose', () => {
  it('plays the path backwards, ending where driving in began', () => {
    const path = parkingPath(start, end);
    expect(reversePose(path, 0)).toEqual(end);
    expect(reversePose(path, 1)).toEqual(start);
    expect(reversePose(path, 0.5)).toEqual(path.pose(0.5));
  });
});

describe('bayPose', () => {
  it('puts the car a distance from the road point, facing the way it points', () => {
    const pose = bayPose({ x: 10, z: 5 }, { x: 0, z: -3 }, 4);
    expect(pose.x).toBeCloseTo(10, 10);
    expect(pose.z).toBeCloseTo(1, 10);
    expect(Math.abs(pose.heading)).toBeCloseTo(Math.PI, 10);
  });
});
