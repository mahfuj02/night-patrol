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
    // Southeast through downtown
    { x: 480, z: 100, width: 10 },
    { x: 505, z: 140, width: 9, stopId: 'dashcam' },
    { x: 520, z: 185, width: 9, stopId: 'arcade' },
    { x: 550, z: 225, width: 9, stopId: 'inspection-building' },
    { x: 590, z: 260, width: 9, stopId: 'warming-shelter' },
    { x: 640, z: 285, width: 9 },
    { x: 700, z: 310, width: 10, stopId: 'cmhr-esplanade' },
    // Slow, wide final curve into The Forks
    { x: 770, z: 345, width: 10 },
    { x: 830, z: 420, width: 10 },
    { x: 860, z: 500, width: 10, stopId: 'the-forks' },
  ],
  // Side streets cross here, so the plowed ridge and the tree rows are broken.
  // TODO(content): owner to add the other intersections along the route.
  intersections: [{ stopId: 'portage-main', halfLength: 22 }],
};
