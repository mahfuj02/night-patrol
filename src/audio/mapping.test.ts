import { describe, expect, it } from 'vitest';
import {
  TOP_SPEED,
  WIPER_AT,
  WIPER_PERIOD,
  engineFrequency,
  engineGain,
  nextWiper,
  speedShare,
  tyreCutoff,
  tyreGain,
} from './mapping';

describe('audio mapping', () => {
  it('clamps the speed share to 0..1 and survives nonsense', () => {
    expect(speedShare(-5)).toBe(0);
    expect(speedShare(TOP_SPEED / 2)).toBeCloseTo(0.5, 9);
    expect(speedShare(TOP_SPEED * 10)).toBe(1);
    expect(speedShare(NaN)).toBe(0);
    expect(speedShare(Infinity)).toBe(0);
  });

  it('idles quietly and rises with speed', () => {
    expect(engineGain(0)).toBeGreaterThan(0);
    expect(engineGain(0)).toBeLessThan(engineGain(TOP_SPEED));
    expect(engineFrequency(0)).toBeLessThan(engineFrequency(TOP_SPEED));
    expect(engineGain(1e6)).toBeLessThan(0.121);
  });

  it('has no tyre noise at rest and more with speed, brighter too', () => {
    expect(tyreGain(0)).toBe(0);
    expect(tyreGain(10)).toBeGreaterThan(0);
    expect(tyreGain(20)).toBeGreaterThan(tyreGain(10));
    expect(tyreCutoff(TOP_SPEED)).toBeGreaterThan(tyreCutoff(0));
  });

  it('times the wiper swish to the cabin animation, every period', () => {
    expect(nextWiper(0)).toBeCloseTo(WIPER_AT, 9);
    expect(nextWiper(WIPER_AT)).toBeCloseTo(0, 9);
    expect(nextWiper(WIPER_AT + 0.1)).toBeCloseTo(WIPER_PERIOD - 0.1, 9);
    expect(nextWiper(WIPER_PERIOD + 1)).toBeCloseTo(WIPER_AT - 1, 9);
  });
});
