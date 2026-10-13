import { createRandom } from './random';
import type { QualityTier } from './quality';

/** Flakes allocated per quality tier at full density. */
export const SNOW_PARTICLES: Record<QualityTier, number> = {
  high: 14000,
  medium: 7000,
  low: 2500,
};

/** Reduced motion: fewer flakes, slower fall, no gusts. */
export const REDUCED_MOTION_SNOW = { countFactor: 0.4, speedFactor: 0.3, gustFactor: 0 } as const;

/**
 * Share of flakes in each depth layer. Near flakes are large, soft and fast, far flakes are small
 * and slow. The vertex shader reads the layer from the same thresholds (see Snow.tsx).
 */
export const SNOW_LAYERS = { near: 0.06, mid: 0.3, far: 0.64 } as const;
export const NEAR_LAYER_MAX = SNOW_LAYERS.near;
export const MID_LAYER_MAX = SNOW_LAYERS.near + SNOW_LAYERS.mid;

export function snowCount(tier: QualityTier, reducedMotion: boolean): number {
  const full = SNOW_PARTICLES[tier];
  return reducedMotion ? Math.floor(full * REDUCED_MOTION_SNOW.countFactor) : full;
}

export interface SnowAttributes {
  /** x, y, z in 0..1 (position in the snow box) and a per-flake phase. 4 floats per flake. */
  seeds: Float32Array;
  /** density gate, brightness/size, speed variation, layer. All 0..1. 4 floats per flake. */
  misc: Float32Array;
}

/** Seeded per-flake random attributes, so the snow looks identical on every load. */
export function createSnowAttributes(count: number, seed: number): SnowAttributes {
  const random = createRandom(seed);
  const seeds = new Float32Array(count * 4);
  const misc = new Float32Array(count * 4);
  for (let i = 0; i < count * 4; i++) {
    seeds[i] = random();
    misc[i] = random();
  }
  return { seeds, misc };
}

/**
 * Index range [start, end) of the lamps nearest to progress `u`, from a list of lamp positions
 * sorted by `u`: a few behind the car and more ahead.
 */
export function lampWindow(
  sortedUs: readonly number[],
  u: number,
  behind: number,
  ahead: number,
): [number, number] {
  let first = sortedUs.findIndex((value) => value >= u);
  if (first === -1) first = sortedUs.length;
  return [Math.max(0, first - behind), Math.min(sortedUs.length, first + ahead)];
}
