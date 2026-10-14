import { describe, expect, it } from 'vitest';
import { gaugePercent, needleAngle, parseIntroParam } from './intro';

describe('parseIntroParam', () => {
  it('shows the loading screen unless ?intro=off is given', () => {
    expect(parseIntroParam('')).toBe(true);
    expect(parseIntroParam('?quality=low')).toBe(true);
    expect(parseIntroParam('?intro=on')).toBe(true);
    expect(parseIntroParam('?intro=off')).toBe(false);
    expect(parseIntroParam('?quality=low&intro=off')).toBe(false);
  });
});

describe('gaugePercent', () => {
  it('rounds, clamps to 0..100 and never goes backwards', () => {
    expect(gaugePercent(41.6)).toBe(42);
    expect(gaugePercent(-5)).toBe(0);
    expect(gaugePercent(180)).toBe(100);
    expect(gaugePercent(30, 55)).toBe(55);
    expect(gaugePercent(60, 55)).toBe(60);
  });
});

describe('needleAngle', () => {
  it('sweeps from -90 at empty to 90 at full', () => {
    expect(needleAngle(0)).toBe(-90);
    expect(needleAngle(50)).toBe(0);
    expect(needleAngle(100)).toBe(90);
    expect(needleAngle(250)).toBe(90);
    expect(needleAngle(-10)).toBe(-90);
  });
});
