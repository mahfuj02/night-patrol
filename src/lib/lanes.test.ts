import { describe, expect, it } from 'vitest';
import {
  MAX_DRIVE_OFFSET,
  MIN_DRIVE_OFFSET,
  OUTER_LANE_SPACING,
  RUT_HALF_GAP,
  driveOffset,
  laneCentres,
  rutOffsets,
} from './lanes';

describe('driveOffset', () => {
  it('is the middle of the right half, clamped', () => {
    expect(driveOffset(6)).toBe(1.5);
    expect(driveOffset(7)).toBe(1.75);
    expect(driveOffset(4)).toBe(MIN_DRIVE_OFFSET);
    expect(driveOffset(9)).toBe(MAX_DRIVE_OFFSET);
    expect(driveOffset(14)).toBe(MAX_DRIVE_OFFSET);
  });

  it('is continuous in the road width, so the car never jumps sideways', () => {
    let previous = driveOffset(4);
    for (let w = 4.01; w <= 16; w += 0.01) {
      const offset = driveOffset(w);
      expect(Math.abs(offset - previous)).toBeLessThan(0.0051);
      previous = offset;
    }
  });

  it('keeps the car inside its half of every road on the route', () => {
    for (const width of [6, 7, 9, 10, 12, 14]) {
      expect(driveOffset(width)).toBeLessThan(width / 2 - 1);
      expect(driveOffset(width)).toBeGreaterThan(0.5);
    }
  });
});

describe('laneCentres', () => {
  it('has the driving and oncoming lanes on a narrow road', () => {
    expect(laneCentres(6)).toEqual([-1.5, 1.5]);
  });

  it('adds outer lanes only where there is room', () => {
    expect(laneCentres(9)).toHaveLength(2);
    const wide = laneCentres(14);
    expect(wide).toHaveLength(4);
    expect(wide[3]).toBeCloseTo(MAX_DRIVE_OFFSET + OUTER_LANE_SPACING, 10);
  });

  it('is symmetric about the centre line and sorted', () => {
    for (const width of [6, 10, 14, 20]) {
      const centres = laneCentres(width);
      expect(centres).toEqual([...centres].sort((a, b) => a - b));
      expect(centres.map((c) => -c).sort((a, b) => a - b)).toEqual(centres);
    }
  });

  it('includes the car lane', () => {
    for (const width of [6, 7, 9, 12, 14]) {
      expect(laneCentres(width)).toContain(driveOffset(width));
    }
  });
});

describe('rutOffsets', () => {
  it('puts a rut either side of the lane centre', () => {
    expect(rutOffsets(1.5)).toEqual([1.5 - RUT_HALF_GAP, 1.5 + RUT_HALF_GAP]);
  });
});
