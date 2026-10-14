import { describe, expect, it } from 'vitest';
import { signage } from '@/content/signage';
import { stations } from '@/content/stations';
import {
  OFFICE,
  glassTop,
  monitorXs,
  officeDetailGeometry,
  officeFrameGeometry,
  officeGlassGeometry,
  officeMonitorsGeometry,
  officeSignGeometry,
  slabTop,
} from './officeModel';
import { officePlacement } from './placement';

const box = (g: ReturnType<typeof officeGlassGeometry>) => {
  g.computeBoundingBox();
  return g.boundingBox!;
};
const frontZ = -OFFICE.depth / 2;

describe('office model', () => {
  it('is a three-storey glass block under a pale roof slab', () => {
    expect(box(officeGlassGeometry()).max.y).toBeCloseTo(glassTop, 5);
    const slab = box(officeFrameGeometry());
    expect(slab.max.y).toBeCloseTo(slabTop, 5);
    expect(slab.min.z).toBeLessThan(frontZ);
  });

  it('stays inside the reserved ground, on the right of the route', () => {
    const { min, max } = officePlacement.reserved;
    for (const g of [officeGlassGeometry(), officeFrameGeometry(), officeDetailGeometry()]) {
      const b = box(g);
      expect(b.min.x).toBeGreaterThanOrEqual(min);
      expect(b.max.x).toBeLessThanOrEqual(max);
    }
    expect(officePlacement.side).toBe(1);
    expect(stations.find((s) => s.section === 'experience')!.bay.turn).toBe('right');
  });

  it('puts the sign on the glass above the lit wall the station uses, facing the road', () => {
    const sign = box(officeSignGeometry());
    expect(sign.max.z).toBeLessThan(frontZ);
    const rect = stations.find((s) => s.section === 'experience')!.wall.rect;
    expect(rect.z).toBe(frontZ);
    expect(sign.min.y).toBeGreaterThan(rect.y + rect.height);
    expect(sign.max.y).toBeLessThan(glassTop);
    expect(signage.officeSign).toBe('LIILAB · Sylhet, Bangladesh');
  });

  it('lines the monitors up in two rows on the front, centred, behind the sign', () => {
    const xs = monitorXs();
    expect(xs).toHaveLength(OFFICE.monitors.count);
    expect(xs[0]! + xs[xs.length - 1]!).toBeCloseTo(0, 6);
    const monitors = box(officeMonitorsGeometry());
    expect(monitors.min.z).toBeLessThan(frontZ);
    expect(monitors.max.y).toBeLessThan(OFFICE.sign.bottom + OFFICE.sign.height);
    expect(Math.abs(monitors.min.x)).toBeLessThan(OFFICE.width / 2);
  });
});
