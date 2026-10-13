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
};
