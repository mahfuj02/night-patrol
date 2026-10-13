import { describe, expect, it } from 'vitest';
import { GLOW_APPROACH, GLOW_HOLD, GLOW_RELEASE, landmarkGlow } from './landmark';

const STOP = 0.081;

describe('landmarkGlow', () => {
  it('is dark far from the stop, before and after', () => {
    expect(landmarkGlow(0, STOP)).toBe(0);
    expect(landmarkGlow(STOP - GLOW_APPROACH, STOP)).toBe(0);
    expect(landmarkGlow(STOP + GLOW_RELEASE, STOP)).toBe(0);
    expect(landmarkGlow(1, STOP)).toBe(0);
  });

  it('is fully lit at the stop and just either side of it', () => {
    expect(landmarkGlow(STOP, STOP)).toBe(1);
    expect(landmarkGlow(STOP - GLOW_HOLD, STOP)).toBe(1);
    expect(landmarkGlow(STOP + GLOW_HOLD, STOP)).toBe(1);
  });

  it('eases up on the approach and down on the way out, smoothly and monotonically', () => {
    let previous = 0;
    for (let t = STOP - GLOW_APPROACH; t <= STOP; t += 0.0005) {
      const glow = landmarkGlow(t, STOP);
      expect(glow).toBeGreaterThanOrEqual(previous - 1e-12);
      expect(glow).toBeGreaterThanOrEqual(0);
      expect(glow).toBeLessThanOrEqual(1);
      previous = glow;
    }
    previous = 1;
    for (let t = STOP; t <= STOP + GLOW_RELEASE + 0.01; t += 0.0005) {
      const glow = landmarkGlow(t, STOP);
      expect(glow).toBeLessThanOrEqual(previous + 1e-12);
      previous = glow;
    }
    expect(landmarkGlow(STOP - GLOW_APPROACH / 2, STOP)).toBeGreaterThan(0.2);
    expect(landmarkGlow(STOP - GLOW_APPROACH / 2, STOP)).toBeLessThan(0.8);
  });

  it('is continuous across the stop', () => {
    expect(
      Math.abs(landmarkGlow(STOP - 1e-6, STOP) - landmarkGlow(STOP + 1e-6, STOP)),
    ).toBeLessThan(1e-3);
  });

  it('under reduced motion is a cut: on at the stop, off elsewhere, nothing in between', () => {
    expect(landmarkGlow(STOP, STOP, true)).toBe(1);
    expect(landmarkGlow(STOP + GLOW_HOLD, STOP, true)).toBe(1);
    for (const t of [0, STOP - GLOW_APPROACH / 2, STOP + GLOW_RELEASE / 2, 1]) {
      expect(landmarkGlow(t, STOP, true)).toBe(0);
    }
  });
});
