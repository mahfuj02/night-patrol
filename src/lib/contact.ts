import type { Profile } from '@/content/schema';

/** One way to reach the owner: a label, where it goes and the text to show. */
export interface ContactItem {
  id: 'email' | 'linkedin' | 'github' | 'portfolio';
  href: string;
  text: string;
}

/**
 * The contact links, in the order they are shown on /simple and at the Contact station: email,
 * LinkedIn, GitHub and the main portfolio, from the profile. The resume has its own link
 * (`profile.resumeUrl`). The phone number is never part of this.
 */
export function contactItems(profile: Profile): ContactItem[] {
  return [
    { id: 'email', href: `mailto:${profile.email}`, text: profile.email },
    { id: 'linkedin', href: profile.links.linkedin, text: profile.links.linkedin },
    { id: 'github', href: profile.links.github, text: profile.links.github },
    { id: 'portfolio', href: profile.links.portfolio, text: profile.links.portfolio },
  ];
}
