import type { BuildingStretch } from './schema';

/**
 * Which buildings line the road, by stretch. Each stretch runs from one stop to another (plus an
 * optional offset in metres along the road) and fills both sides with lots of its style. Stretches
 * must stay in route order and must not overlap; `pnpm test` checks that.
 *
 * `setback` is the gap in metres between the road edge and the building front. It has to clear the
 * plowed ridge and the tree row (about 6 m), so houses sit behind the elms. Lot, depth and height
 * ranges are in metres. `lit` scales the share of windows lit from the zone's `windows` values in
 * atmosphere.ts (houses show only a few). The stretch from the warming shelter to Esplanade Riel is
 * a residential neighbourhood: warm windows only at the shelter (rule 9: no figures).
 * TODO(content): owner to tune sizes and densities by eye.
 */
export const buildingStretches: BuildingStretch[] = [
  {
    // Exchange District: brick warehouses and low-rises along narrow streets.
    id: 'exchange-warehouses',
    style: 'warehouse',
    from: 'ignition',
    to: 'city-services',
    setback: 7.5,
    lotWidth: [14, 26],
    depth: [14, 22],
    height: [10, 24],
    lit: 0.6,
    density: 0.92,
  },
  {
    // The wide straight into Portage & Main: mid-rises.
    id: 'portage-straight',
    style: 'tower',
    from: 'city-services',
    to: 'portage-main',
    setback: 9,
    lotWidth: [18, 34],
    depth: [18, 28],
    height: [16, 42],
    lit: 0.7,
    density: 0.85,
  },
  {
    // Portage & Main and downtown: varied towers.
    id: 'downtown-towers',
    style: 'tower',
    from: 'portage-main',
    to: 'warming-shelter',
    toOffset: -70,
    setback: 9,
    lotWidth: [20, 38],
    depth: [20, 32],
    height: [30, 95],
    lit: 0.75,
    density: 0.9,
  },
  {
    // Warming shelter to Esplanade Riel: houses and garages behind the elm tunnel.
    id: 'residential',
    style: 'house',
    from: 'warming-shelter',
    fromOffset: -70,
    to: 'cmhr-esplanade',
    toOffset: 60,
    setback: 12,
    lotWidth: [9, 13],
    depth: [8, 11],
    height: [5.5, 7.5],
    lit: 0.45,
    density: 0.85,
    garage: 0.5,
  },
];
