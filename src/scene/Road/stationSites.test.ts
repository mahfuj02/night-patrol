import { describe, expect, it } from 'vitest';
import { routeModel } from './route';

/**
 * Where the stations that come after Portage & Main will stand, in metres along the route. The
 * road is kept straight here so each one gets a bay, a red light before it and a reserved footprint
 * (docs/navigation-redesign.md, "Station positions"). The stops themselves arrive with their station
 * PRs; this test keeps the road ready for them, so re-cutting the route cannot bend a site by accident.
 */
const STATION_SITES = [
  { id: 'millennium-library', at: 600 },
  { id: 'skills-station', at: 700 },
  { id: 'liilab-office', at: 940 },
] as const;

/** How far each side of the stop the road must stay straight: the reserved footprint and the bay. */
const HALF_LENGTH = 25;
/** The red light stands this far before the stop, so the road before the site must be clear too. */
const LIGHT = 23;
/** The most the road may turn over any 30 m of a site, in degrees. */
const MAX_BEND = 3.5;

const L = routeModel.length;
const heading = (metres: number) => {
  const t = routeModel.curve.getTangentAt(metres / L);
  return Math.atan2(t.z, t.x);
};
/** Turn over 30 m centred on `metres`, in degrees. */
const bend = (metres: number) => {
  let d = heading(metres + 15) - heading(metres - 15);
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return Math.abs(d * (180 / Math.PI));
};

describe('station sites', () => {
  it.each(STATION_SITES.map((s) => [s.id, s.at] as const))(
    'keeps the road straight for %s at about %i m',
    (_id, at) => {
      for (let m = at - HALF_LENGTH; m <= at + HALF_LENGTH; m += 5) {
        expect(bend(m), `${m} m`).toBeLessThanOrEqual(MAX_BEND);
      }
    },
  );

  it('keeps the sites after the Portage & Main intersection, in order, with room for each red light', () => {
    const portage = routeModel.intersections.find((x) => x.id === 'portage-main')!;
    expect(STATION_SITES[0].at - HALF_LENGTH - LIGHT).toBeGreaterThan(portage.to * L);
    for (let i = 1; i < STATION_SITES.length; i++) {
      const gap = STATION_SITES[i]!.at - STATION_SITES[i - 1]!.at;
      expect(gap).toBeGreaterThanOrEqual(2 * HALF_LENGTH + LIGHT);
    }
  });

  it('keeps every site clear of the cross streets and of the stops that stay', () => {
    for (const site of STATION_SITES) {
      for (const crossing of routeModel.intersections) {
        const from = crossing.from * L;
        const to = crossing.to * L;
        const clear = site.at + HALF_LENGTH < from || site.at - HALF_LENGTH - LIGHT > to;
        expect(clear, `${site.id} vs ${crossing.id}`).toBe(true);
      }
      for (const [stopId, fraction] of routeModel.stopFractions) {
        // A site's own stop (the Library's, once it exists) stands at the site.
        if (stopId === site.id) continue;
        expect(Math.abs(fraction * L - site.at), `${site.id} vs ${stopId}`).toBeGreaterThan(
          HALF_LENGTH + 10,
        );
      }
    }
  });

  it('keeps the dashcam stop between the Skills and LIILAB sites', () => {
    const dashcam = routeModel.stopFractions.get('dashcam')! * L;
    expect(dashcam).toBeGreaterThan(STATION_SITES[1].at + HALF_LENGTH);
    expect(dashcam).toBeLessThan(STATION_SITES[2].at - HALF_LENGTH - LIGHT);
  });
});
