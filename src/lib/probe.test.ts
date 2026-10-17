import { describe, expect, it } from 'vitest';
import { formatCarPose, parseProbeParam } from './probe';

describe('probe', () => {
  it('is on only for ?probe=on', () => {
    expect(parseProbeParam('')).toBe(false);
    expect(parseProbeParam('?probe=off')).toBe(false);
    expect(parseProbeParam('?quality=low&probe=on')).toBe(true);
  });

  it('writes the pose as x,z,heading with three decimals', () => {
    expect(formatCarPose(1.23456, -7, 0.5)).toBe('1.235,-7.000,0.500');
    expect(formatCarPose(0, 0, -3.14159).split(',')).toHaveLength(3);
  });
});
