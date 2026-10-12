import { describe, expect, it } from 'vitest';
import { formatTemplate } from './template';

describe('formatTemplate', () => {
  it('fills placeholders, including repeats and numbers', () => {
    expect(formatTemplate('Stop {n} of {total}: {title}', { n: 3, total: 12, title: 'A' })).toBe(
      'Stop 3 of 12: A',
    );
    expect(formatTemplate('{n}/{n}', { n: 2 })).toBe('2/2');
  });

  it('leaves unknown placeholders and plain text alone', () => {
    expect(formatTemplate('Hello {who}', {})).toBe('Hello {who}');
    expect(formatTemplate('No placeholders', { a: 1 })).toBe('No placeholders');
  });
});
