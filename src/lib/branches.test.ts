import { describe, expect, it } from 'vitest';
import { drawBranches, type BranchContext } from './branches';

function recorder() {
  const widths: number[] = [];
  const points: [number, number][] = [];
  const ctx: BranchContext = {
    lineWidth: 1,
    beginPath: () => {},
    moveTo: (x, y) => points.push([x, y]),
    lineTo: (x, y) => points.push([x, y]),
    stroke: () => widths.push(ctx.lineWidth),
  };
  return { ctx, widths, points };
}

describe('drawBranches', () => {
  it('draws a few hundred segments for a full tree', () => {
    const { ctx } = recorder();
    const segments = drawBranches(ctx, 512, 1);
    expect(segments).toBeGreaterThan(150);
    expect(segments).toBeLessThan(4000);
  });

  it('starts at the bottom centre with the thickest stroke and tapers', () => {
    const { ctx, widths, points } = recorder();
    drawBranches(ctx, 512, 1);
    expect(points[0]).toEqual([256, 512]);
    expect(widths[0]).toBeGreaterThan(10);
    expect(Math.min(...widths)).toBe(1);
    expect(widths[0]).toBe(Math.max(...widths));
  });

  it('stays roughly inside the canvas', () => {
    const { ctx, points } = recorder();
    drawBranches(ctx, 512, 3);
    for (const [x, y] of points) {
      expect(x).toBeGreaterThan(-200);
      expect(x).toBeLessThan(712);
      expect(y).toBeGreaterThan(-200);
      expect(y).toBeLessThanOrEqual(512);
    }
  });

  it('spreads wide, like a vase, not just straight up', () => {
    const { ctx, points } = recorder();
    drawBranches(ctx, 512, 2);
    const xs = points.map(([x]) => x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(300);
  });

  it('is deterministic for a seed and varies between seeds', () => {
    const a = recorder();
    const b = recorder();
    const c = recorder();
    drawBranches(a.ctx, 512, 5);
    drawBranches(b.ctx, 512, 5);
    drawBranches(c.ctx, 512, 6);
    expect(a.points).toEqual(b.points);
    expect(a.points).not.toEqual(c.points);
  });

  it('scales with the canvas size', () => {
    const small = recorder();
    drawBranches(small.ctx, 256, 1);
    expect(small.points[0]).toEqual([128, 256]);
  });
});
