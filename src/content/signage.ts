import type { Signage } from './schema';

/** Lettering on street furniture. Stop signs read "STOP" and nothing else (no logos, no names). */
export const signage: Signage = {
  stop: 'STOP',
  // The rooftop letters on the RRC campus: words only, no college logo, banner or crest.
  rrcRooftop: 'RRC Polytechnic',
};
