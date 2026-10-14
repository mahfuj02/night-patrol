import { describe, expect, it } from 'vitest';
import { projects } from '@/content/projects';
import { stations } from '@/content/stations';
import { stops } from '@/content/stops';
import { transitZones } from '@/content/transit';
import { contrastRatio, relativeLuminance } from './contrast';
import { palette, transit } from './palette';
import { buildTransit, markerPosition, projectEntries, segmentZone, zoneOfStop } from './transit';

const entries = buildTransit(stops, stations, transitZones);
const byId = (id: string) => entries.find((e) => e.id === id)!;

describe('buildTransit', () => {
  it('has an entry for every stop, in route order', () => {
    expect(entries).toHaveLength(stops.length);
    expect(entries.map((e) => e.t)).toEqual([...entries.map((e) => e.t)].sort((a, b) => a - b));
    expect(entries.map((e) => e.stopIndex)).toEqual(entries.map((_, i) => i));
  });

  it('draws a stop that hosts a station as that station', () => {
    const rrc = byId('rrc-campus');
    expect(rrc.kind).toBe('station');
    expect(rrc.section).toBe('education');
    expect(rrc.stationIndex).toBe(0);
    expect(entries.filter((e) => e.kind === 'station')).toHaveLength(stations.length);
    expect(byId('dispatch').kind).toBe('stop');
    expect(byId('dispatch').stationIndex).toBeNull();
  });

  it('colours each stop by its zone', () => {
    expect(byId('ignition').zone).toBe('exchange');
    expect(byId('city-services').zone).toBe('exchange');
    expect(byId('portage-main').zone).toBe('downtown');
    expect(byId('dashcam').zone).toBe('residential');
    expect(byId('liilab-office').zone).toBe('avenue');
    expect(byId('the-forks').zone).toBe('forks');
  });

  it('colours the straight into Portage and Main with downtown, the zone being driven toward', () => {
    const i = entries.findIndex((e) => e.id === 'city-services');
    expect(segmentZone(entries, i)).toBe('downtown');
    expect(segmentZone(entries, 0)).toBe('exchange');
    expect(segmentZone(entries, entries.length - 1)).toBe('forks');
  });

  it('puts a stop in the first zone when there are no zones', () => {
    expect(zoneOfStop(stops[3]!, stops, [])).toBe('exchange');
  });
});

describe('markerPosition', () => {
  it('is the entry index at each entry, clamped at both ends', () => {
    entries.forEach((entry, i) => expect(markerPosition(entry.t, entries)).toBeCloseTo(i, 10));
    expect(markerPosition(-1, entries)).toBe(0);
    expect(markerPosition(2, entries)).toBe(entries.length - 1);
    expect(markerPosition(0.5, [])).toBe(0);
  });

  it('moves smoothly and monotonically between entries', () => {
    let previous = -1;
    for (let t = 0; t <= 1; t += 0.005) {
      const position = markerPosition(t, entries);
      expect(position).toBeGreaterThanOrEqual(previous);
      previous = position;
    }
    const mid = (entries[2]!.t + entries[3]!.t) / 2;
    expect(markerPosition(mid, entries)).toBeCloseTo(2.5, 10);
  });
});

describe('projectEntries', () => {
  const list = projectEntries(projects, stops);

  it('lists every project, with the stop it can be driven to', () => {
    expect(list).toHaveLength(projects.length);
    expect(list.find((p) => p.id === 'eventflow')!.stopIndex).toBe(
      stops.findIndex((s) => s.id === 'exchange-warehouses'),
    );
  });

  it('gives projects with no route stop no stop to drive to', () => {
    for (const id of ['game-hub', 'av-device-controller', 'connexions-spectrum']) {
      expect(list.find((p) => p.id === id)!.stopIndex).toBeNull();
    }
  });
});

describe('transit colours', () => {
  it('are readable on night-2 as a line (3:1) and carry a night tag text (4.5:1)', () => {
    for (const colour of Object.values(transit)) {
      expect(contrastRatio(colour, palette.night2)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(colour, palette.night)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('computes the WCAG ratio', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#777777')).toBe(1);
    expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1, 6);
    expect(relativeLuminance('#000000')).toBe(0);
  });
});
