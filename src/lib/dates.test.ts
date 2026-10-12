import { describe, expect, it } from 'vitest';
import { formatDateRange, formatPartialDate } from './dates';

describe('formatPartialDate', () => {
  it('formats year only', () => expect(formatPartialDate('2025')).toBe('2025'));
  it('formats year and month', () => expect(formatPartialDate('2021-02')).toBe('Feb 2021'));
  it('falls back to the year for an unknown month', () => {
    expect(formatPartialDate('2021-99')).toBe('2021');
  });
  it('returns an empty value unchanged', () => expect(formatPartialDate('')).toBe(''));
});

describe('formatDateRange', () => {
  it('formats a full range', () => {
    expect(formatDateRange('2021-02', '2022-10')).toBe('Feb 2021 \u2013 Oct 2022');
  });
  it('formats start only', () => expect(formatDateRange('2025')).toBe('2025'));
  it('formats end only', () => expect(formatDateRange(undefined, '2025-08')).toBe('Aug 2025'));
  it('returns empty with no dates', () => expect(formatDateRange()).toBe(''));
});
