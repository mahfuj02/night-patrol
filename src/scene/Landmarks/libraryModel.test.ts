import { describe, expect, it } from 'vitest';
import { stations } from '@/content/stations';
import {
  LIBRARY,
  glassTop,
  libraryDetailGeometry,
  libraryFrameGeometry,
  libraryGlassGeometry,
  libraryLetteringGeometry,
  slabTop,
} from './libraryModel';
import { libraryPlacement } from './placement';

const box = (g: ReturnType<typeof libraryGlassGeometry>) => {
  g.computeBoundingBox();
  return g.boundingBox!;
};
const frontZ = -LIBRARY.depth / 2;

describe('library model', () => {
  it('is a wide glass block under a pale roof slab that stands proud of it', () => {
    const glass = box(libraryGlassGeometry());
    expect(glass.max.y).toBeCloseTo(glassTop, 5);
    expect(glass.max.x - glass.min.x).toBeCloseTo(LIBRARY.width, 5);
    const frame = box(libraryFrameGeometry());
    expect(frame.max.y).toBeCloseTo(slabTop, 5);
    expect(frame.min.z).toBeLessThan(glass.min.z);
    expect(frame.max.x).toBeGreaterThan(glass.max.x);
  });

  it('stays inside the reserved ground', () => {
    const { min, max } = libraryPlacement.reserved;
    for (const g of [libraryGlassGeometry(), libraryFrameGeometry(), libraryDetailGeometry()]) {
      const b = box(g);
      expect(b.min.x).toBeGreaterThanOrEqual(min);
      expect(b.max.x).toBeLessThanOrEqual(max);
      expect(b.max.z).toBeLessThanOrEqual(libraryPlacement.depth / 2 + 1);
    }
  });

  it('puts the lettering on the glass, above the lit wall the station uses, facing the road', () => {
    const letters = box(libraryLetteringGeometry());
    expect(letters.max.z).toBeLessThan(frontZ);
    const rect = stations.find((s) => s.section === 'projects')!.wall.rect;
    expect(letters.min.y).toBeGreaterThan(rect.y + rect.height);
    expect(letters.max.y).toBeLessThan(glassTop);
  });

  it('lights a wall rectangle that lies on the glass front, inside the building width', () => {
    const rect = stations.find((s) => s.section === 'projects')!.wall.rect;
    expect(rect.z).toBe(frontZ);
    expect(Math.abs(rect.x) + rect.width / 2).toBeLessThanOrEqual(LIBRARY.width / 2);
    expect(rect.y + rect.height).toBeLessThanOrEqual(glassTop);
  });

  it('has an entrance canopy that stands out over the road side', () => {
    expect(box(libraryDetailGeometry()).min.z).toBeLessThan(frontZ - LIBRARY.canopy.stand + 1);
  });
});
