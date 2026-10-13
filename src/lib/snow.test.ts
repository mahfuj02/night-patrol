import { describe, expect, it } from 'vitest';
import {
  MID_LAYER_MAX,
  NEAR_LAYER_MAX,
  REDUCED_MOTION_SNOW,
  SNOW_LAYERS,
  SNOW_PARTICLES,
  createSnowAttributes,
  lampWindow,
  snowCount,
} from './snow';

describe('snowCount', () => {
  it('scales with the quality tier', () => {
    expect(snowCount('high', false)).toBe(SNOW_PARTICLES.high);
    expect(snowCount('medium', false)).toBe(SNOW_PARTICLES.medium);
    expect(snowCount('low', false)).toBe(SNOW_PARTICLES.low);
    expect(SNOW_PARTICLES.high).toBeGreaterThan(SNOW_PARTICLES.medium);
    expect(SNOW_PARTICLES.medium).toBeGreaterThan(SNOW_PARTICLES.low);
  });

  it('uses fewer flakes under reduced motion', () => {
    expect(snowCount('high', true)).toBe(Math.floor(14000 * REDUCED_MOTION_SNOW.countFactor));
    expect(snowCount('low', true)).toBeLessThan(snowCount('low', false));
  });

  it('slows the fall and removes gusts under reduced motion', () => {
    expect(REDUCED_MOTION_SNOW.speedFactor).toBeLessThan(1);
    expect(REDUCED_MOTION_SNOW.gustFactor).toBe(0);
  });
});

describe('layers', () => {
  it('cover every flake', () => {
    expect(SNOW_LAYERS.near + SNOW_LAYERS.mid + SNOW_LAYERS.far).toBeCloseTo(1, 10);
    expect(NEAR_LAYER_MAX).toBeLessThan(MID_LAYER_MAX);
    expect(MID_LAYER_MAX).toBeLessThan(1);
  });
});

describe('createSnowAttributes', () => {
  const { seeds, misc } = createSnowAttributes(20000, 7);

  it('makes four values per flake, all in [0, 1)', () => {
    expect(seeds).toHaveLength(80000);
    expect(misc).toHaveLength(80000);
    for (const value of [...seeds.slice(0, 4000), ...misc.slice(0, 4000)]) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('is deterministic and varies with the seed', () => {
    const again = createSnowAttributes(20000, 7);
    expect(again.seeds.slice(0, 40)).toEqual(seeds.slice(0, 40));
    expect(createSnowAttributes(20000, 8).seeds.slice(0, 40)).not.toEqual(seeds.slice(0, 40));
  });

  it('splits flakes into depth layers close to the target shares', () => {
    let near = 0;
    let mid = 0;
    for (let i = 3; i < misc.length; i += 4) {
      const layer = misc[i]!;
      if (layer < NEAR_LAYER_MAX) near++;
      else if (layer < MID_LAYER_MAX) mid++;
    }
    const total = misc.length / 4;
    expect(near / total).toBeCloseTo(SNOW_LAYERS.near, 1);
    expect(mid / total).toBeCloseTo(SNOW_LAYERS.mid, 1);
  });

  it('thins evenly: a density cut keeps about that share of flakes', () => {
    let kept = 0;
    for (let i = 0; i < misc.length; i += 4) if (misc[i]! < 0.25) kept++;
    expect(kept / (misc.length / 4)).toBeCloseTo(0.25, 1);
  });
});

describe('lampWindow', () => {
  const us = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6];

  it('takes lamps behind and ahead of the car', () => {
    expect(lampWindow(us, 0.35, 2, 3)).toEqual([1, 6]);
  });

  it('clamps at both ends', () => {
    expect(lampWindow(us, 0, 2, 3)).toEqual([0, 3]);
    expect(lampWindow(us, 0.99, 2, 3)).toEqual([4, 6]);
    expect(lampWindow([], 0.5, 2, 3)).toEqual([0, 0]);
  });
});
