import { describe, expect, it } from 'vitest';
import { dprForTier, isQualityTier, lowerTier, raiseTier } from './quality';

describe('quality tiers', () => {
  it('validates tier values', () => {
    expect(isQualityTier('high')).toBe(true);
    expect(isQualityTier('ultra')).toBe(false);
    expect(isQualityTier(null)).toBe(false);
  });

  it('lowers and raises within bounds', () => {
    expect(lowerTier('high')).toBe('medium');
    expect(lowerTier('medium')).toBe('low');
    expect(lowerTier('low')).toBe('low');
    expect(raiseTier('low')).toBe('medium');
    expect(raiseTier('medium')).toBe('high');
    expect(raiseTier('high')).toBe('high');
  });

  it('lowers the pixel ratio ceiling as quality drops', () => {
    expect(dprForTier('high')[1]).toBeGreaterThan(dprForTier('medium')[1]);
    expect(dprForTier('medium')[1]).toBeGreaterThan(dprForTier('low')[1]);
    expect(dprForTier('low')).toEqual([1, 1]);
  });
});
