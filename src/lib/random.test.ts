import { describe, expect, it } from 'vitest';
import { createRandom, range } from './random';

describe('createRandom', () => {
  it('is deterministic for a seed', () => {
    const a = createRandom(42);
    const b = createRandom(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('differs between seeds', () => {
    expect(createRandom(1)()).not.toBe(createRandom(2)());
  });

  it('stays in [0, 1)', () => {
    const random = createRandom(7);
    for (let i = 0; i < 1000; i++) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('range', () => {
  it('maps into [min, max)', () => {
    const random = createRandom(3);
    for (let i = 0; i < 200; i++) {
      const value = range(random, 2, 5);
      expect(value).toBeGreaterThanOrEqual(2);
      expect(value).toBeLessThan(5);
    }
  });
});
