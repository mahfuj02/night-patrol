import type { Signage } from './schema';

/** Lettering on street furniture. Stop signs read "STOP" and nothing else (no logos, no names). */
export const signage: Signage = {
  stop: 'STOP',
  // The rooftop letters on the RRC campus: words only, no college logo, banner or crest.
  rrcRooftop: 'RRC Polytechnic',
  // Faded painted ghost signs on the Exchange District warehouses. Generic trades of the old
  // district only: no real company names, logos or trademarks.
  ghostSigns: {
    dryGoods: 'DRY GOODS',
    wholesale: 'WHOLESALE',
    warehouse: 'WAREHOUSE',
    grainExchangeSupply: 'GRAIN EXCHANGE SUPPLY',
  },
  // Second line of the EventFlow marquee. The first line is the project name from projects.ts.
  marqueeSubtitle: 'Tickets · Hosts · Payments',
  // The City services building: plain words in our own type, no city logo or crest.
  cityRooftop: 'City Services',
  // The board over its door: the project name comes from projects.ts; these are the three stages
  // a request moves through.
  requestBoard: { heading: 'Service requests', statuses: ['Received', 'In progress', 'Resolved'] },
};
