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
