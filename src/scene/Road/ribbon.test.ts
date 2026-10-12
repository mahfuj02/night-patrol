import { describe, expect, it } from 'vitest';
import { buildRibbon } from './ribbon';
import { routeModel } from './route';

describe('buildRibbon', () => {
  const samples = 200;
  const road = buildRibbon(routeModel, {
    samples,
    extent: (w) => [-w / 2, w / 2],
    y: 0.02,
  });

  it('builds two vertices per sample and two triangles per quad', () => {
    expect(road.getAttribute('position').count).toBe((samples + 1) * 2);
    expect(road.getIndex()!.count).toBe(samples * 6);
  });

  it('lies flat at the requested height', () => {
    const position = road.getAttribute('position');
    for (let i = 0; i < position.count; i++) expect(position.getY(i)).toBeCloseTo(0.02, 6);
  });

  it('faces up', () => {
    const index = road.getIndex()!;
    const position = road.getAttribute('position');
    for (let t = 0; t < index.count; t += 3) {
      const [a, b, c] = [index.getX(t), index.getX(t + 1), index.getX(t + 2)] as const;
      const abx = position.getX(b) - position.getX(a);
      const abz = position.getZ(b) - position.getZ(a);
      const acx = position.getX(c) - position.getX(a);
      const acz = position.getZ(c) - position.getZ(a);
      // y component of (ab x ac); positive means the face points up
      expect(abz * acx - abx * acz).toBeGreaterThan(0);
    }
  });

  it('is as wide as the road at its start', () => {
    const position = road.getAttribute('position');
    const width = Math.hypot(
      position.getX(0) - position.getX(1),
      position.getZ(0) - position.getZ(1),
    );
    expect(width).toBeCloseTo(routeModel.widths[0]!, 4);
  });

  it('skips quads to make dashes', () => {
    const dashed = buildRibbon(routeModel, {
      samples,
      extent: () => [-0.1, 0.1],
      y: 0.03,
      dash: { on: 2, off: 2 },
    });
    expect(dashed.getIndex()!.count).toBe((samples / 2) * 6);
  });
});
