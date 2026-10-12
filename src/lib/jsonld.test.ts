import { describe, expect, it } from 'vitest';
import { buildPersonJsonLd, serializeJsonLd } from './jsonld';

const person = {
  name: 'Md Mahfuj Ahmed',
  displayName: 'Mahfuj',
  role: 'Full Stack Web Developer',
  location: 'Winnipeg, MB',
  links: {
    github: 'https://github.com/mahfuj02',
    linkedin: 'https://www.linkedin.com/in/mahfuj02/',
    portfolio: 'https://mahfuj.dev',
  },
};

describe('buildPersonJsonLd', () => {
  it('builds a schema.org Person with sameAs links', () => {
    const data = buildPersonJsonLd(person, 'https://example.com/simple');
    expect(data['@type']).toBe('Person');
    expect(data.url).toBe('https://example.com/simple');
    expect(data.sameAs).toEqual([
      'https://github.com/mahfuj02',
      'https://www.linkedin.com/in/mahfuj02/',
      'https://mahfuj.dev',
    ]);
  });

  it('does not include contact details', () => {
    const json = JSON.stringify(buildPersonJsonLd(person, 'https://example.com/simple'));
    expect(json).not.toMatch(/telephone|email|mailto/i);
  });
});

describe('serializeJsonLd', () => {
  it('escapes angle brackets so the payload cannot close the script tag', () => {
    expect(serializeJsonLd({ a: '</script><b>' })).not.toContain('<');
  });
});
