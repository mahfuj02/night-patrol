import { describe, expect, it } from 'vitest';
import { stations } from '@/content/stations';
import {
  FORKS,
  forksBaseGeometry,
  forksHallGeometry,
  forksLightsGeometry,
  forksRoofGeometry,
  lightXs,
  ridgeTop,
} from './forksModel';
import { forksPlacement } from './placement';

const box = (g: ReturnType<typeof forksBaseGeometry>) => {
  g.computeBoundingBox();
  return g.boundingBox!;
};
const frontZ = -FORKS.base.depth / 2;

describe('forks market model', () => {
  it('is a long low brick hall with a taller glazed hall behind its middle under a gable', () => {
    const base = box(forksBaseGeometry());
    const hall = box(forksHallGeometry());
    const roof = box(forksRoofGeometry());
    expect(hall.max.y).toBeGreaterThan(base.max.y);
    expect(hall.max.z).toBeGreaterThan(base.max.z - 0.01);
    expect(roof.min.y).toBeCloseTo(FORKS.hall.height, 5);
    expect(roof.max.y).toBeCloseTo(ridgeTop, 5);
    expect(base.max.x - base.min.x).toBeGreaterThan(hall.max.x - hall.min.x);
  });

  it('gives the base metre uvs and white vertex colours for the brick wall shader', () => {
    const g = forksBaseGeometry();
    expect(g.getAttribute('uv').count).toBe(g.getAttribute('position').count);
    expect(g.getAttribute('color').count).toBe(g.getAttribute('position').count);
  });

  it('stays inside the reserved ground', () => {
    const { min, max } = forksPlacement.reserved;
    for (const g of [forksBaseGeometry(), forksHallGeometry(), forksRoofGeometry()]) {
      const b = box(g);
      expect(b.min.x).toBeGreaterThanOrEqual(min);
      expect(b.max.x).toBeLessThanOrEqual(max);
      expect(b.max.z).toBeLessThanOrEqual(forksPlacement.depth / 2 + 1);
    }
  });

  it('strings the lights evenly along the front eave, centred, on the road side', () => {
    const xs = lightXs();
    expect(xs).toHaveLength(FORKS.lights.count);
    expect(xs[0]! + xs[xs.length - 1]!).toBeCloseTo(0, 6);
    const lights = box(forksLightsGeometry());
    expect(lights.min.z).toBeLessThan(frontZ);
    expect(Math.abs(lights.min.x)).toBeLessThan(FORKS.base.width / 2);
  });

  it('is the Contact station on the right, on the lit front wall', () => {
    const station = stations.find((s) => s.section === 'contact')!;
    expect(forksPlacement.side).toBe(1);
    expect(station.bay.turn).toBe('right');
    expect(station.wall.rect.z).toBe(frontZ);
    expect(station.wall.rect.y + station.wall.rect.height).toBeLessThanOrEqual(FORKS.base.height);
  });
});
