import { describe, expect, it } from 'vitest';
import { getSiteUrl } from './site';

describe('getSiteUrl', () => {
  it('prefers NEXT_PUBLIC_SITE_URL and trims trailing slashes', () => {
    expect(
      getSiteUrl({
        NEXT_PUBLIC_SITE_URL: 'https://example.com//',
        VERCEL_PROJECT_PRODUCTION_URL: 'v.app',
      }),
    ).toBe('https://example.com');
  });
  it('uses the Vercel production URL next', () => {
    expect(getSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'night-patrol.vercel.app' })).toBe(
      'https://night-patrol.vercel.app',
    );
  });
  it('falls back to localhost', () => {
    expect(getSiteUrl({})).toBe('http://localhost:3000');
  });
});
