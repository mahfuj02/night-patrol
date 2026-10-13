import type { TransitZone } from './schema';

/**
 * The zones the transit-map menu colours the route line by, in route order. Each zone starts at a
 * stop and runs until the next zone starts; the line colour is a token in `transit` in
 * src/lib/palette.ts. The straight between City services and Portage & Main takes downtown's colour.
 */
export const transitZones: TransitZone[] = [
  { id: 'exchange', label: 'Exchange District', fromStopId: 'ignition' },
  { id: 'downtown', label: 'Downtown', fromStopId: 'portage-main' },
  { id: 'residential', label: 'Residential', fromStopId: 'warming-shelter' },
  { id: 'avenue', label: 'The avenue', fromStopId: 'cmhr-esplanade' },
  { id: 'forks', label: 'The Forks', fromStopId: 'the-forks' },
];
