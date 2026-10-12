import { describe, expect, it } from 'vitest';
import {
  MAGNET_RADIUS,
  SWIPE_SENSITIVITY,
  WHEEL_SENSITIVITY,
  applyMagnet,
  clamp01,
  dampT,
  interpolateWidth,
  isAtStop,
  nearestStopIndex,
  stepToStop,
  swipeToDelta,
  wheelToDelta,
} from './route';

const stops = [0, 0.2, 0.5, 1];

describe('clamp01', () => {
  it('clamps and handles NaN', () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
    expect(clamp01(0.4)).toBe(0.4);
    expect(clamp01(Number.NaN)).toBe(0);
  });
});

describe('nearestStopIndex / isAtStop', () => {
  it('finds the closest stop', () => {
    expect(nearestStopIndex(0.04, stops)).toBe(0);
    expect(nearestStopIndex(0.19, stops)).toBe(1);
    expect(nearestStopIndex(0.9, stops)).toBe(3);
  });

  it('returns 0 for an empty list', () => {
    expect(nearestStopIndex(0.5, [])).toBe(0);
    expect(isAtStop(0.5, [])).toBe(false);
  });

  it('is at a stop only inside the radius', () => {
    expect(isAtStop(0.2, stops)).toBe(true);
    expect(isAtStop(0.2 + MAGNET_RADIUS, stops)).toBe(true);
    expect(isAtStop(0.2 + MAGNET_RADIUS * 1.5, stops)).toBe(false);
  });
});

describe('stepToStop', () => {
  it('moves to the next stop', () => {
    expect(stepToStop(0, 1, stops)).toBe(0.2);
    expect(stepToStop(0.3, 1, stops)).toBe(0.5);
  });

  it('moves to the previous stop', () => {
    expect(stepToStop(0.5, -1, stops)).toBe(0.2);
    expect(stepToStop(0.3, -1, stops)).toBe(0.2);
  });

  it('clamps at the ends', () => {
    expect(stepToStop(1, 1, stops)).toBe(1);
    expect(stepToStop(0, -1, stops)).toBe(0);
  });

  it('skips a stop the car is already on', () => {
    expect(stepToStop(0.2, 1, stops)).toBe(0.5);
    expect(stepToStop(0.2, -1, stops)).toBe(0);
  });

  it('handles an empty list', () => {
    expect(stepToStop(0.4, 1, [])).toBe(0.4);
  });
});

describe('applyMagnet', () => {
  it('is the identity outside the radius', () => {
    expect(applyMagnet(0.35, stops)).toBe(0.35);
  });

  it('lands exactly on a stop', () => {
    expect(applyMagnet(0.5, stops)).toBe(0.5);
  });

  it('pulls toward the stop inside the radius', () => {
    const t = 0.5 + MAGNET_RADIUS / 2;
    const pulled = applyMagnet(t, stops);
    expect(pulled).toBeGreaterThan(0.5);
    expect(pulled).toBeLessThan(t);
    const below = applyMagnet(0.5 - MAGNET_RADIUS / 2, stops);
    expect(below).toBeLessThan(0.5);
    expect(0.5 - below).toBeCloseTo(pulled - 0.5, 10);
  });

  it('is continuous at the radius and monotonic across it', () => {
    const edge = 0.5 + MAGNET_RADIUS;
    expect(applyMagnet(edge - 1e-9, stops)).toBeCloseTo(edge, 6);
    let previous = -Infinity;
    for (let t = 0.45; t <= 0.55; t += 0.0005) {
      const value = applyMagnet(t, stops);
      expect(value).toBeGreaterThanOrEqual(previous);
      previous = value;
    }
  });

  it('can be disabled', () => {
    const t = 0.5 + MAGNET_RADIUS / 2;
    expect(applyMagnet(t, stops, MAGNET_RADIUS, 0)).toBe(t);
    expect(applyMagnet(t, [], MAGNET_RADIUS)).toBe(t);
    expect(applyMagnet(t, stops, 0)).toBe(t);
  });
});

describe('dampT', () => {
  it('stays put with zero dt and converges with large dt', () => {
    expect(dampT(0, 1, 5, 0)).toBe(0);
    expect(dampT(0, 1, 5, 10)).toBeCloseTo(1, 6);
  });

  it('is frame-rate independent', () => {
    const oneStep = dampT(0, 1, 6, 1 / 30);
    let twoSteps = dampT(0, 1, 6, 1 / 60);
    twoSteps = dampT(twoSteps, 1, 6, 1 / 60);
    expect(twoSteps).toBeCloseTo(oneStep, 10);
  });
});

describe('input conversion', () => {
  it('converts pixel, line and page wheel modes', () => {
    expect(wheelToDelta(100, 0)).toBeCloseTo(100 * WHEEL_SENSITIVITY, 10);
    expect(wheelToDelta(3, 1)).toBeCloseTo(3 * 16 * WHEEL_SENSITIVITY, 10);
    expect(wheelToDelta(1, 2)).toBeCloseTo(800 * WHEEL_SENSITIVITY, 10);
    expect(wheelToDelta(-100, 0)).toBeLessThan(0);
  });

  it('converts swipes', () => {
    expect(swipeToDelta(200)).toBeCloseTo(200 * SWIPE_SENSITIVITY, 10);
    expect(swipeToDelta(-50)).toBeLessThan(0);
  });
});

describe('interpolateWidth', () => {
  const fractions = [0, 0.5, 1];
  const widths = [6, 12, 8];

  it('returns the control widths at the control fractions', () => {
    expect(interpolateWidth(fractions, widths, 0)).toBe(6);
    expect(interpolateWidth(fractions, widths, 0.5)).toBe(12);
    expect(interpolateWidth(fractions, widths, 1)).toBe(8);
  });

  it('interpolates smoothly between them', () => {
    expect(interpolateWidth(fractions, widths, 0.25)).toBeCloseTo(9, 10);
    expect(interpolateWidth(fractions, widths, 0.75)).toBeCloseTo(10, 10);
  });

  it('clamps outside the range and handles degenerate input', () => {
    expect(interpolateWidth(fractions, widths, -1)).toBe(6);
    expect(interpolateWidth(fractions, widths, 2)).toBe(8);
    expect(interpolateWidth([], [], 0.5)).toBe(0);
    expect(interpolateWidth([0.5, 0.5, 1], [1, 2, 3], 0.5)).toBe(1);
  });
});
