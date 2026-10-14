import { describe, expect, it } from 'vitest';
import { profile } from '@/content/profile';
import { contactItems } from './contact';

describe('contactItems', () => {
  it('lists email, LinkedIn, GitHub and the portfolio, in that order', () => {
    expect(contactItems(profile).map((i) => i.id)).toEqual([
      'email',
      'linkedin',
      'github',
      'portfolio',
    ]);
  });

  it('links the email as mailto and the rest to the profile links', () => {
    const [email, linkedin, github, portfolio] = contactItems(profile);
    expect(email!.href).toBe('mailto:ahmedmahfujsy@gmail.com');
    expect(email!.text).toBe('ahmedmahfujsy@gmail.com');
    expect(linkedin!.href).toBe(profile.links.linkedin);
    expect(github!.href).toBe(profile.links.github);
    expect(portfolio!.href).toBe('https://mahfuj.dev');
  });

  it('never includes a phone number', () => {
    expect(JSON.stringify(contactItems(profile))).not.toMatch(/\+?\d[\d\s().-]{8,}\d/);
  });
});
