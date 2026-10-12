import { describe, expect, it } from 'vitest';
import { drawTwigs, type TwigContext } from './branches';

function recorder() {
  const widths: number[] = [];
  const alphas: number[] = [];
  const points: [number, number][] = [];
  const ctx: TwigContext = {
    lineWidth: 1,
    globalAlpha: 1,
    beginPath: () => {},
    moveTo: (x, y) => points.push([x, y]),
    lineTo: (x, y) => points.push([x, y]),
    stroke: () => {
      widths.push(ctx.lineWidth);
      alphas.push(ctx.globalAlpha);
    },
  };
  return { ctx, widths, alphas, points };
}

describe('drawTwigs', () => {
  it('draws a modest sprig of segments', () => {
    const { ctx } = recorder();
    const segments = drawTwigs(ctx, 256, 1);
    expect(segments).toBeGreaterThan(20);
    expect(segments).toBeLessThan(800);
  });

  it('starts near the bottom centre and fans upward, with no trunk', () => {
    const { ctx, points } = recorder();
    drawTwigs(ctx, 256, 1);
    const [x0, y0] = points[0]!;
    expect(Math.abs(x0 - 128)).toBeLessThan(1);
    expect(y0).toBeGreaterThan(240);
    // Every stem begins at the base, none begins at the very bottom edge as a thick trunk would.
    const topmost = Math.min(...points.map(([, y]) => y));
    expect(topmost).toBeLessThan(80);
  });

  it('draws every segment twice: a wide faint halo under a thin solid core', () => {
    const { ctx, widths, alphas } = recorder();
    const segments = drawTwigs(ctx, 256, 2);
    expect(widths).toHaveLength(segments * 2);
    expect(alphas.filter((a) => a < 1)).toHaveLength(segments);
    expect(alphas.filter((a) => a === 1)).toHaveLength(segments);
    expect(widths[0]).toBeGreaterThan(widths[1]!);
  });

  it('restores full opacity when finished', () => {
    const { ctx } = recorder();
    drawTwigs(ctx, 256, 3);
    expect(ctx.globalAlpha).toBe(1);
  });

  it('is deterministic for a seed and varies between seeds', () => {
    const a = recorder();
    const b = recorder();
    const c = recorder();
    drawTwigs(a.ctx, 256, 5);
    drawTwigs(b.ctx, 256, 5);
    drawTwigs(c.ctx, 256, 6);
    expect(a.points).toEqual(b.points);
    expect(a.points).not.toEqual(c.points);
  });

  it('scales with the canvas size', () => {
    const small = recorder();
    drawTwigs(small.ctx, 128, 1);
    const [x] = small.points[0]!;
    expect(Math.abs(x - 64)).toBeLessThan(1);
  });
});
