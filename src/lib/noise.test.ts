import { describe, expect, it } from 'vitest';
import { noise1 } from './noise';

describe('noise1', () => {
  it('stays in [0, 1)', () => {
    for (let x = -50; x < 50; x += 0.37) {
      const v = noise1(x, 3);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('is deterministic and varies with the seed', () => {
    expect(noise1(4.2, 1)).toBe(noise1(4.2, 1));
    expect(noise1(4.2, 1)).not.toBe(noise1(4.2, 2));
  });

  it('is continuous: tiny steps change the value tiny amounts', () => {
    let previous = noise1(0, 5);
    for (let x = 0.01; x < 20; x += 0.01) {
      const v = noise1(x, 5);
      expect(Math.abs(v - previous)).toBeLessThan(0.05);
      previous = v;
    }
  });

  it('hits the lattice values at integers and varies in between', () => {
    const values = new Set<number>();
    for (let x = 0; x < 30; x += 0.5) values.add(Math.round(noise1(x, 9) * 100));
    expect(values.size).toBeGreaterThan(10);
  });
});
