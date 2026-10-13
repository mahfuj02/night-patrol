import { describe, expect, it } from 'vitest';
import { rectCorners, rectOutline, rectsOverlap, type Rect } from './footprint';

const box = (x: number, z: number, yaw = 0, width = 4, depth = 2): Rect => ({
  x,
  z,
  yaw,
  width,
  depth,
});

describe('rectCorners', () => {
  it('returns the corners of an unrotated rectangle', () => {
    const corners = rectCorners(box(10, 5)).map(([x, z]) => [x, z].map((v) => Math.round(v)));
    expect(corners).toEqual([
      [8, 4],
      [12, 4],
      [12, 6],
      [8, 6],
    ]);
  });

  it('turns a quarter turn so local x points along -z', () => {
    const [a, b] = rectCorners(box(0, 0, Math.PI / 2));
    expect(a[0]).toBeCloseTo(-1, 6);
    expect(a[1]).toBeCloseTo(2, 6);
    expect(b[0]).toBeCloseTo(-1, 6);
    expect(b[1]).toBeCloseTo(-2, 6);
  });
});

describe('rectOutline', () => {
  it('adds the edge midpoints to the corners', () => {
    expect(rectOutline(box(0, 0))).toHaveLength(8);
  });
});

describe('rectsOverlap', () => {
  it('detects overlap and separation', () => {
    expect(rectsOverlap(box(0, 0), box(3, 0))).toBe(true);
    expect(rectsOverlap(box(0, 0), box(10, 0))).toBe(false);
  });

  it('treats a margin as extra clearance', () => {
    expect(rectsOverlap(box(0, 0), box(4.5, 0))).toBe(false);
    expect(rectsOverlap(box(0, 0), box(4.5, 0), 1)).toBe(true);
  });

  it('handles rotated rectangles that only touch diagonally apart', () => {
    const a = box(0, 0, Math.PI / 4, 6, 1);
    expect(rectsOverlap(a, box(0, 0, -Math.PI / 4, 6, 1))).toBe(true);
    expect(rectsOverlap(a, box(4.5, -4.5, Math.PI / 4, 6, 1))).toBe(false);
  });
});
