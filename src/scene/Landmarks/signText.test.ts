import { describe, expect, it } from 'vitest';
import { projects } from '@/content/projects';
import { sloganLines } from './signText';

describe('sloganLines', () => {
  it('keeps a short slogan on one line', () => {
    expect(sloganLines('Light up the board.')).toEqual(['Light up the board.']);
  });

  it('splits a long slogan at the sentence break', () => {
    expect(sloganLines('Your career starts here. Practice interviews with AI.')).toEqual([
      'Your career starts here.',
      'Practice interviews with AI.',
    ]);
  });

  it('splits at the middle word when there is no sentence break', () => {
    const lines = sloganLines('one two three four five six seven eight nine ten eleven twelve');
    expect(lines).toHaveLength(2);
    expect(lines.join(' ')).toBe('one two three four five six seven eight nine ten eleven twelve');
  });

  it('leaves one long word alone', () => {
    expect(sloganLines('x'.repeat(50))).toEqual(['x'.repeat(50)]);
  });

  it('fits every project slogan on at most two lines of a sensible length', () => {
    for (const { sign } of projects) {
      if (!sign) continue;
      const lines = sloganLines(sign.slogan);
      expect(lines.length).toBeLessThanOrEqual(2);
      for (const line of lines) expect(line.length).toBeLessThanOrEqual(40);
    }
  });
});
