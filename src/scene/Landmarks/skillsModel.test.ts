import { describe, expect, it } from 'vitest';
import { stations } from '@/content/stations';
import { skillsPlacement } from './placement';
import {
  SKILLS,
  mastTop,
  roofTop,
  skillsAccentGeometry,
  skillsDetailGeometry,
  skillsGlassGeometry,
} from './skillsModel';

const box = (g: ReturnType<typeof skillsGlassGeometry>) => {
  g.computeBoundingBox();
  return g.boundingBox!;
};
const frontZ = -SKILLS.depth / 2;

describe('skills building model', () => {
  it('is a tall glass block with a mast above the roof', () => {
    const glass = box(skillsGlassGeometry());
    expect(glass.max.y).toBeCloseTo(roofTop, 5);
    expect(glass.max.x - glass.min.x).toBeCloseTo(SKILLS.width, 5);
    expect(mastTop).toBeGreaterThan(roofTop);
    expect(box(skillsDetailGeometry()).max.y).toBeCloseTo(roofTop + SKILLS.mast.height, 5);
  });

  it('stays inside the reserved ground', () => {
    const { min, max } = skillsPlacement.reserved;
    for (const g of [skillsGlassGeometry(), skillsDetailGeometry(), skillsAccentGeometry()]) {
      const b = box(g);
      expect(b.min.x).toBeGreaterThanOrEqual(min);
      expect(b.max.x).toBeLessThanOrEqual(max);
      expect(b.max.z).toBeLessThanOrEqual(skillsPlacement.depth / 2 + 1);
    }
  });

  it('stands on the right of the route, the other side from the library', () => {
    expect(skillsPlacement.side).toBe(1);
    expect(stations.find((s) => s.section === 'skills')!.bay.turn).toBe('right');
  });

  it('puts the accent light on the front of the glass, above the lit wall the station uses', () => {
    const accent = box(skillsAccentGeometry());
    expect(accent.min.z).toBeLessThan(frontZ);
    const rect = stations.find((s) => s.section === 'skills')!.wall.rect;
    expect(rect.z).toBe(frontZ);
    expect(rect.y + rect.height).toBeLessThanOrEqual(roofTop - 2);
  });
});
