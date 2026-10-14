import type { Route } from './schema';

/**
 * Control points for the patrol route, in scene units (x east, z south).
 * Tweak freely: the curve passes through every point, and stop `t` values are checked against
 * it by `pnpm test` (see src/scene/Road/route.test.ts).
 *
 * Geography (loosely): tight bends through the Exchange District, a wide straight run into
 * Portage & Main, a curve southeast through downtown, then a slow wide curve into The Forks.
 * TODO(content): owner to review the shape against real Winnipeg geography.
 */
export const route: Route = {
  lengthMetres: 1092.2,
  points: [
    // Exchange District: narrow streets, tight bends
    { x: 0, z: 0, width: 6, stopId: 'ignition' },
    { x: 30, z: -6, width: 6, stopId: 'dispatch' },
    { x: 55, z: -25, width: 6 },
    { x: 75, z: -45, width: 6, stopId: 'rrc-campus' },
    { x: 105, z: -50, width: 6 },
    { x: 125, z: -30, width: 6, stopId: 'exchange-warehouses' },
    { x: 140, z: -5, width: 6 },
    { x: 170, z: 5, width: 7, stopId: 'city-services' },
    // Wide straight into Portage & Main
    { x: 200, z: 25, width: 12 },
    { x: 330, z: 50, width: 12 },
    { x: 440, z: 70, width: 14, stopId: 'portage-main' },
    // Southeast through downtown and on to The Forks. Re-cut so the road is straight where the
    // Library (~600 m), Skills (~700 m) and Experience (~940 m) stations will stand, with the
    // bends between them; station-sites.test.ts keeps those stretches straight.
    { x: 459.6, z: 73.9, width: 12 },
    { x: 478.9, z: 79, width: 12 },
    { x: 497.1, z: 87.3, width: 10 },
    { x: 513.4, z: 98.9, width: 10 },
    { x: 529.1, z: 111.3, width: 10 },
    // The Library station stop, 600 m along the route, on the first straight after Portage & Main.
    { x: 535.2, z: 116.1, width: 10, stopId: 'millennium-library' },
    { x: 544.8, z: 123.7, width: 10 },
    { x: 560.5, z: 136.1, width: 10 },
    { x: 576.7, z: 147.7, width: 10 },
    { x: 594.2, z: 157.5, width: 10 },
    { x: 612.1, z: 166.4, width: 10 },
    // The Skills station stop, 700 m along the route, on the second straight.
    { x: 619.1, z: 169.8, width: 10, stopId: 'skills-station' },
    { x: 630, z: 175.2, width: 10 },
    { x: 647.9, z: 184.1, width: 10 },
    { x: 665.8, z: 193.2, width: 9 },
    { x: 682.1, z: 204.7, width: 9 },
    { x: 696, z: 219, width: 9 },
    { x: 707.2, z: 235.5, width: 9, stopId: 'dashcam' },
    { x: 717, z: 253, width: 9 },
    { x: 728, z: 269.7, width: 9 },
    { x: 740.1, z: 285.6, width: 9 },
    { x: 753.2, z: 300.7, width: 10 },
    { x: 767.4, z: 314.8, width: 10 },
    { x: 782.2, z: 328.2, width: 10 },
    { x: 797, z: 341.7, width: 10 },
    { x: 811.8, z: 355.2, width: 10 },
    { x: 826.6, z: 368.6, width: 10 },
    { x: 841.1, z: 382.4, width: 10 },
    { x: 854.4, z: 397.3, width: 10 },
    { x: 866.1, z: 413.5, width: 10 },
    { x: 876.3, z: 430.7, width: 10 },
    { x: 884.6, z: 448.9, width: 10, stopId: 'the-forks' },
  ],
  // Side streets cross here, so the plowed ridge and the tree rows are broken. Each is measured
  // in metres from a stop, so it can sit between stops. Stops stay mid-block, except Portage &
  // Main, which is the intersection. Residential gaps are 8 m each side; the street names (Princess
  // St) arrive with the signs. `street` is the cross street (always square for now) and `control`
  // is what stands at the corners: traffic lights downtown, stop signs in the neighbourhood.
  // TODO(content): owner to review the positions along the route.
  intersections: [
    {
      id: 'princess-st',
      stopId: 'rrc-campus',
      offset: 16,
      halfLength: 10,
      street: { width: 8, length: 120 },
      control: 'signals',
    },
    {
      id: 'portage-main',
      stopId: 'portage-main',
      halfLength: 22,
      street: { width: 12, length: 140 },
      control: 'signals',
    },
    {
      id: 'residential-a',
      stopId: 'dashcam',
      offset: -28,
      halfLength: 8,
      street: { width: 7, length: 110 },
      control: 'stop',
    },
    {
      id: 'residential-b',
      stopId: 'dashcam',
      offset: 40,
      halfLength: 8,
      street: { width: 7, length: 110 },
      control: 'stop',
    },
    {
      id: 'residential-c',
      stopId: 'dashcam',
      offset: 62,
      halfLength: 8,
      street: { width: 7, length: 110 },
      control: 'stop',
    },
  ],
};
