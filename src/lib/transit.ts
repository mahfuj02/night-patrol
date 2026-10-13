import type { Project, Section, Station, Stop, TransitZone } from '@/content/schema';
import type { TransitZoneId } from './palette';

/** One place on the transit line: a stop, or a stop that is also a section station. */
export interface TransitEntry {
  id: string;
  kind: 'stop' | 'station';
  title: string;
  /** Position along the route, 0 to 1. */
  t: number;
  zone: TransitZoneId;
  stopIndex: number;
  /** For a station: its index in `stations`, and its section. */
  stationIndex: number | null;
  section: Section | null;
}

/** The zone a stop is in: the last zone that starts at or before it. */
export function zoneOfStop(
  stop: Stop,
  stops: readonly Stop[],
  zones: readonly TransitZone[],
): TransitZoneId {
  let zone: TransitZoneId = zones[0]?.id ?? 'exchange';
  for (const candidate of zones) {
    const start = stops.find((s) => s.id === candidate.fromStopId);
    if (start && start.order <= stop.order) zone = candidate.id;
  }
  return zone;
}

/**
 * The entries of the transit line, in route order. Every stop is one; a stop that hosts a station is
 * drawn (and works) as that station. Pure, so the menu and its tests share it.
 */
export function buildTransit(
  stops: readonly Stop[],
  stations: readonly Station[],
  zones: readonly TransitZone[],
): TransitEntry[] {
  return [...stops]
    .sort((a, b) => a.order - b.order)
    .map((stop, index) => {
      const stationIndex = stations.findIndex((s) => s.stopId === stop.id);
      const station = stationIndex >= 0 ? stations[stationIndex] : undefined;
      return {
        id: stop.id,
        kind: station ? 'station' : 'stop',
        title: stop.title,
        t: stop.t,
        zone: zoneOfStop(stop, stops, zones),
        stopIndex: index,
        stationIndex: station ? stationIndex : null,
        section: station ? station.section : null,
      };
    });
}

/**
 * Where "you are here" is on the line, as a fractional index into the entries (0 at the first, `n - 1`
 * at the last), by linear interpolation between the entries on either side of `t`.
 */
export function markerPosition(t: number, entries: readonly TransitEntry[]): number {
  if (entries.length === 0) return 0;
  if (t <= entries[0]!.t) return 0;
  const last = entries.length - 1;
  if (t >= entries[last]!.t) return last;
  for (let i = 0; i < last; i++) {
    const from = entries[i]!;
    const to = entries[i + 1]!;
    if (t >= from.t && t <= to.t) {
      return i + (to.t === from.t ? 0 : (t - from.t) / (to.t - from.t));
    }
  }
  return last;
}

/** The colour of the line between entry `i` and the next: the zone of the entry being driven toward. */
export function segmentZone(entries: readonly TransitEntry[], i: number): TransitZoneId {
  return (entries[i + 1] ?? entries[i])?.zone ?? 'exchange';
}

/** A project in the menu list, and the stop it can be driven to. */
export interface ProjectEntry {
  id: string;
  name: string;
  /** Index into `stops`, when the project has a route stop. */
  stopIndex: number | null;
}

export function projectEntries(
  projects: readonly Project[],
  stops: readonly Stop[],
): ProjectEntry[] {
  const ordered = [...stops].sort((a, b) => a.order - b.order);
  return projects.map((project) => {
    const index = project.stopId ? ordered.findIndex((s) => s.id === project.stopId) : -1;
    return { id: project.id, name: project.name, stopIndex: index >= 0 ? index : null };
  });
}
