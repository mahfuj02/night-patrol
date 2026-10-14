import { describe, expect, it } from 'vitest';
import {
  GRAIN_NIGHT,
  GRAIN_SUNRISE,
  dprForTier,
  effectsForTier,
  grainOpacity,
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

describe('grainOpacity', () => {
  it('is the night strength in the dark and the sunrise strength at full sunrise, easing between', () => {
    expect(grainOpacity(0)).toBe(GRAIN_NIGHT);
    expect(grainOpacity(1)).toBeCloseTo(GRAIN_SUNRISE, 10);
    expect(grainOpacity(0.5)).toBeCloseTo((GRAIN_NIGHT + GRAIN_SUNRISE) / 2, 10);
  });

  it('never exceeds the night strength, and clamps outside 0 to 1', () => {
    expect(GRAIN_SUNRISE).toBeLessThan(GRAIN_NIGHT);
    expect(grainOpacity(-3)).toBe(GRAIN_NIGHT);
    expect(grainOpacity(9)).toBeCloseTo(GRAIN_SUNRISE, 10);
    for (let k = 0; k <= 1; k += 0.1) expect(grainOpacity(k)).toBeLessThanOrEqual(GRAIN_NIGHT);
  });

  it('is weaker than it was (0.35) at every sunrise amount', () => {
    expect(GRAIN_NIGHT).toBeLessThan(0.35);
  });
});
