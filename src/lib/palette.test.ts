import { describe, expect, it } from 'vitest';
import { palette, world } from './palette';

describe('palette', () => {
  it('uses 6-digit hex values', () => {
    for (const value of Object.values(palette)) {
      expect(value).toMatch(/^#[0-9A-F]{6}$/);
    }
  });
});

describe('world palette', () => {
  it('uses 6-digit hex values', () => {
    for (const value of Object.values(world)) {
      expect(value).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('reuses the UI palette for shared colours', () => {
    expect(world.night).toBe(palette.night);
    expect(world.sodium).toBe(palette.street);
    expect(world.brick).toBe(palette.brick);
    expect(world.snow).toBe(palette.snow);
  });

  it('has every token documented in the art guide', async () => {
    const { readFile } = await import('node:fs/promises');
    const guide = await readFile('docs/art-reference.md', 'utf8');
    const camelToKebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
    // The guide names a few tokens differently or folds them into a neighbour; list the exceptions.
    const undocumented = new Set([
      'forksMagentaDeep',
      'forksMagentaCore',
      'sodium',
      'brick',
      'snow',
      'night',
    ]);
    for (const token of Object.keys(world)) {
      if (undocumented.has(token)) continue;
      expect(guide, token).toContain(`\`${camelToKebab(token)}\``);
    }
  });
});
