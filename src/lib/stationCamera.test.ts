import { describe, expect, it } from 'vitest';
import { MIN_WALL_SCALE, WALL_DESIGN_WIDTH, fitDistance, isWallLegible } from './stationCamera';

describe('fitDistance', () => {
  it('is set by the height on a wide screen and by the width on a tall one', () => {
    const wide = fitDistance(6, 4.5, 45, 16 / 9);
    const tall = fitDistance(6, 4.5, 45, 9 / 19);
    const byHeight = (4.5 * 1.12) / 2 / Math.tan((45 * Math.PI) / 360);
    expect(wide).toBeCloseTo(byHeight, 6);
    expect(tall).toBeGreaterThan(wide * 2);
  });

  it('puts the whole rectangle in view at that distance', () => {
    for (const aspect of [16 / 9, 4 / 3, 9 / 19]) {
      const d = fitDistance(9, 4.5, 45, aspect, 1);
      const halfV = Math.tan((45 * Math.PI) / 360);
      expect(d * halfV).toBeGreaterThanOrEqual(4.5 / 2 - 1e-9);
      expect(d * halfV * aspect).toBeGreaterThanOrEqual(9 / 2 - 1e-9);
    }
  });

  it('moves further away for a narrower field of view', () => {
    expect(fitDistance(9, 4.5, 30, 16 / 9)).toBeGreaterThan(fitDistance(9, 4.5, 45, 16 / 9));
  });
});

describe('isWallLegible', () => {
  it('needs the wall at a readable scale, and not wider than the screen', () => {
    expect(isWallLegible(WALL_DESIGN_WIDTH * 1.2, WALL_DESIGN_WIDTH, 1920)).toBe(true);
    expect(isWallLegible(WALL_DESIGN_WIDTH * MIN_WALL_SCALE, WALL_DESIGN_WIDTH, 1280)).toBe(true);
    // A phone: the wall fills the width but is tiny next to the design size.
    expect(isWallLegible(350, WALL_DESIGN_WIDTH, 390)).toBe(false);
    // A wall wider than the screen is cropped.
    expect(isWallLegible(900, WALL_DESIGN_WIDTH, 800)).toBe(false);
    expect(isWallLegible(100, 0, 800)).toBe(false);
    expect(isWallLegible(100, 720, 0)).toBe(false);
  });
});
