import { describe, expect, it } from 'vitest';
import { homography, matrix3dFor, quadWidth, type Quad } from './homography';

/** Applies a homography to a point, with the perspective divide. */
function apply(h: number[], x: number, y: number): [number, number] {
  const w = h[6]! * x + h[7]! * y + 1;
  return [(h[0]! * x + h[1]! * y + h[2]!) / w, (h[3]! * x + h[4]! * y + h[5]!) / w];
}

const corners: [number, number][] = [
  [0, 0],
  [200, 0],
  [200, 100],
  [0, 100],
];

describe('homography', () => {
  it('maps a rectangle onto itself as the identity', () => {
    const h = homography(200, 100, [0, 0, 200, 0, 200, 100, 0, 100])!;
    for (const [x, y] of [...corners, [50, 25] as [number, number]]) {
      const [u, v] = apply(h, x, y);
      expect(u).toBeCloseTo(x, 6);
      expect(v).toBeCloseTo(y, 6);
    }
  });

  it('maps the four corners onto an arbitrary quad, and the middle inside it', () => {
    const quad: Quad = [30, 40, 330, 70, 300, 260, 10, 210];
    const h = homography(200, 100, quad)!;
    corners.forEach(([x, y], i) => {
      const [u, v] = apply(h, x, y);
      expect(u).toBeCloseTo(quad[i * 2]!, 6);
      expect(v).toBeCloseTo(quad[i * 2 + 1]!, 6);
    });
    const [mu, mv] = apply(h, 100, 50);
    expect(mu).toBeGreaterThan(10);
    expect(mu).toBeLessThan(330);
    expect(mv).toBeGreaterThan(40);
    expect(mv).toBeLessThan(260);
  });

  it('shrinks toward the far edge for a perspective quad', () => {
    // The right edge is shorter than the left, as on a wall that recedes to the right.
    const h = homography(100, 100, [0, 0, 100, 20, 100, 80, 0, 100])!;
    const [, topRight] = apply(h, 100, 0);
    const [, bottomRight] = apply(h, 100, 100);
    expect(bottomRight - topRight).toBeCloseTo(60, 6);
    const [, mid] = apply(h, 50, 50);
    expect(mid).toBeCloseTo(50, 6);
  });

  it('returns null for degenerate corners', () => {
    expect(homography(100, 100, [0, 0, 0, 0, 0, 0, 0, 0])).toBeNull();
  });
});

describe('matrix3dFor', () => {
  it('writes a column-major CSS matrix3d with the perspective terms in the last row', () => {
    const css = matrix3dFor(200, 100, [10, 20, 210, 20, 210, 120, 10, 120])!;
    expect(css.startsWith('matrix3d(')).toBe(true);
    const v = css.slice(9, -1).split(',').map(Number);
    expect(v).toHaveLength(16);
    // A pure translation by (10, 20): the 4th column holds the translation.
    expect(v[0]).toBeCloseTo(1, 6);
    expect(v[5]).toBeCloseTo(1, 6);
    expect(v[12]).toBeCloseTo(10, 6);
    expect(v[13]).toBeCloseTo(20, 6);
    expect(v[15]).toBe(1);
    expect(v[10]).toBe(1);
  });

  it('returns null when there is no valid transform', () => {
    expect(matrix3dFor(100, 100, [0, 0, 0, 0, 0, 0, 0, 0])).toBeNull();
  });
});

describe('quadWidth', () => {
  it('is the length of the top edge', () => {
    expect(quadWidth([0, 0, 30, 40, 0, 0, 0, 0])).toBe(50);
  });
});
