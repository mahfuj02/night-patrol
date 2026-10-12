export interface PersonInput {
  name: string;
  displayName: string;
  role: string;
  location: string;
  links: { github: string; linkedin: string; portfolio: string };
}

/** schema.org Person for the /simple page. Never includes a phone number or email. */
export function buildPersonJsonLd(person: PersonInput, pageUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    alternateName: person.displayName,
    jobTitle: person.role,
    url: pageUrl,
    address: { '@type': 'PostalAddress', addressLocality: person.location },
    sameAs: [person.links.github, person.links.linkedin, person.links.portfolio],
  };
}

/** Serialises JSON-LD safely for inlining in a script tag. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
