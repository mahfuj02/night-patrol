import { describe, expect, it } from 'vitest';
import { palette } from './palette';

describe('palette', () => {
  it('uses 6-digit hex values', () => {
    for (const value of Object.values(palette)) {
      expect(value).toMatch(/^#[0-9A-F]{6}$/);
    }
  });
});
