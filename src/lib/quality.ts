export const QUALITY_TIERS = ['high', 'medium', 'low'] as const;
export type QualityTier = (typeof QUALITY_TIERS)[number];

export function isQualityTier(value: unknown): value is QualityTier {
  return typeof value === 'string' && (QUALITY_TIERS as readonly string[]).includes(value);
}

/** Device pixel ratio range [min, max] handed to the renderer for a tier. */
export function dprForTier(tier: QualityTier): [number, number] {
  switch (tier) {
    case 'high':
      return [1, 2];
    case 'medium':
      return [1, 1.5];
    case 'low':
      return [1, 1];
  }
}

export function lowerTier(tier: QualityTier): QualityTier {
  const i = QUALITY_TIERS.indexOf(tier);
  return QUALITY_TIERS[Math.min(i + 1, QUALITY_TIERS.length - 1)]!;
}

export function raiseTier(tier: QualityTier): QualityTier {
  const i = QUALITY_TIERS.indexOf(tier);
  return QUALITY_TIERS[Math.max(i - 1, 0)]!;
}

/**
 * Reads `?quality=high|medium|low` from a URL query string. Pins the tier and turns off adaptive
 * quality, so tiers can be compared (and measured) on a given machine. Null when absent or invalid.
 */
export function parseQualityParam(search: string): QualityTier | null {
  const value = new URLSearchParams(search).get('quality');
  return isQualityTier(value) ? value : null;
}

export interface EffectsSettings {
  /** False means no post-processing at all (the low tier renders straight to the screen). */
  enabled: boolean;
  bloom: boolean;
  vignette: boolean;
  /** Film grain. Off under reduced motion: it is constantly shifting noise. */
  grain: boolean;
  /** MSAA samples for the composer. Needed for smooth alpha-to-coverage edges on the trees. */
  multisampling: number;
}

/** Post-processing for a quality tier: bloom, vignette and grain on high and medium, none on low. */
export function effectsForTier(tier: QualityTier, reducedMotion: boolean): EffectsSettings {
  if (tier === 'low') {
    return { enabled: false, bloom: false, vignette: false, grain: false, multisampling: 0 };
  }
  return {
    enabled: true,
    bloom: true,
    vignette: true,
    grain: !reducedMotion,
    multisampling: tier === 'high' ? 4 : 2,
  };
}

/** The film grain's strength on a dark night scene, and at the full sunrise (it is a lot in a bright one). */
export const GRAIN_NIGHT = 0.22;
export const GRAIN_SUNRISE = 0.05;

/**
 * Film grain strength for a sunrise amount from 0 (night) to 1 (full sunrise). Grain shows most on
 * bright, flat snow, so it eases down as the sunrise comes up and the sky and snow brighten.
 */
export function grainOpacity(sunrise: number): number {
  const k = Math.min(1, Math.max(0, sunrise));
  return GRAIN_NIGHT + (GRAIN_SUNRISE - GRAIN_NIGHT) * k;
}
