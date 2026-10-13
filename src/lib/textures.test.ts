import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { QUALITY_TIERS } from './quality';
import { repeatFor, textureFiles, textureSets, type TextureSetId } from './textures';

const ids = Object.keys(textureSets) as TextureSetId[];
const onDisk = (url: string) => join('public', url);

describe('textureFiles', () => {
  it('loads colour, normal and roughness on high and medium (snow has no normal)', () => {
    for (const tier of ['high', 'medium'] as const) {
      expect(textureFiles('road', tier)).toEqual({
        color: '/textures/asphalt_snow/asphalt_snow_color_1024.webp',
        normal: '/textures/asphalt_snow/asphalt_snow_normal_1024.webp',
        rough: '/textures/asphalt_snow/asphalt_snow_rough_1024.webp',
      });
      expect(textureFiles('snow', tier).normal).toBeUndefined();
      expect(textureFiles('snow', tier).rough).toBe('/textures/snow_02/snow_02_rough_1024.webp');
    }
  });

  it('uses 512 maps for brick on every tier', () => {
    expect(textureFiles('brick', 'high').color).toContain('_512.webp');
    expect(textureFiles('brick', 'low')).toEqual({
      color: '/textures/factory_brick/factory_brick_color_512.webp',
    });
  });

  it('loads a single 512 colour map on low, never normal or roughness', () => {
    for (const id of ids) {
      const files = textureFiles(id, 'low');
      expect(Object.keys(files)).toEqual(['color']);
      expect(files.color).toMatch(/_color_512\.webp$/);
    }
  });

  it('only references files that exist in public/', () => {
    for (const id of ids) {
      for (const tier of QUALITY_TIERS) {
        for (const url of Object.values(textureFiles(id, tier))) {
          expect(existsSync(onDisk(url)), url).toBe(true);
        }
      }
    }
  });

  it('keeps the shipped texture weight inside the budget', () => {
    const bytes = (tier: (typeof QUALITY_TIERS)[number]) => {
      const urls = new Set(ids.flatMap((id) => Object.values(textureFiles(id, tier))));
      return [...urls].reduce((sum, url) => sum + statSync(onDisk(url)).size, 0);
    };
    expect(bytes('high')).toBeLessThan(3 * 1024 * 1024);
    expect(bytes('medium')).toBeLessThan(3 * 1024 * 1024);
    expect(bytes('low')).toBeLessThan(0.5 * 1024 * 1024);
  });
});

describe('repeatFor', () => {
  it('divides a surface length by the real-world tile size', () => {
    expect(repeatFor('road', 14)).toBe(7);
    expect(repeatFor('brick', 6)).toBe(4);
  });
});
