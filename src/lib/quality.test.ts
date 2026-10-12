import { describe, expect, it } from 'vitest';
import {
  dprForTier,
  effectsForTier,
  isQualityTier,
  lowerTier,
  parseQualityParam,
  raiseTier,
} from './quality';

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

describe('parseQualityParam', () => {
  it('reads a valid tier from the query string', () => {
    expect(parseQualityParam('?quality=low')).toBe('low');
    expect(parseQualityParam('?a=1&quality=medium')).toBe('medium');
  });

  it('ignores missing or invalid values', () => {
    expect(parseQualityParam('')).toBeNull();
    expect(parseQualityParam('?quality=ultra')).toBeNull();
    expect(parseQualityParam('?other=high')).toBeNull();
  });
});

describe('effectsForTier', () => {
  it('turns post-processing off on the low tier', () => {
    expect(effectsForTier('low', false)).toEqual({
      enabled: false,
      bloom: false,
      vignette: false,
      grain: false,
      multisampling: 0,
    });
    expect(effectsForTier('low', true).enabled).toBe(false);
  });

  it('uses bloom, vignette and grain on high and medium, with more MSAA on high', () => {
    const high = effectsForTier('high', false);
    const medium = effectsForTier('medium', false);
    expect(high).toMatchObject({ enabled: true, bloom: true, vignette: true, grain: true });
    expect(medium).toMatchObject({ enabled: true, bloom: true, vignette: true, grain: true });
    expect(high.multisampling).toBeGreaterThan(medium.multisampling);
  });

  it('drops the grain, and only the grain, under reduced motion', () => {
    for (const tier of ['high', 'medium'] as const) {
      const calm = effectsForTier(tier, true);
      expect(calm.grain).toBe(false);
      expect(calm.bloom).toBe(true);
      expect(calm.vignette).toBe(true);
    }
  });
});
