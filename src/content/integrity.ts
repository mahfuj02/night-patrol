import { findZoneProblems } from '../lib/atmosphere';
import type {
  AtmosphereZone,
  BuildingStretch,
  CommunityNote,
  Experience,
  Project,
  RadioLine,
  Route,
  Stop,
} from './schema';

export interface ContentBundle {
  atmosphere: AtmosphereZone[];
  buildings: BuildingStretch[];
  route: Route;
  stops: Stop[];
  projects: Project[];
  experience: Experience[];
  communityNotes: CommunityNote[];
  radioLines: RadioLine[];
}

/** Returns human-readable problems; an empty list means the content is consistent. */
export function findContentProblems(c: ContentBundle): string[] {
  const problems: string[] = [];

  const checkDuplicates = (label: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) problems.push(`Duplicate ${label} id: ${id}`);
      seen.add(id);
    }
  };
  checkDuplicates(
    'stop',
    c.stops.map((s) => s.id),
  );
  checkDuplicates(
    'project',
    c.projects.map((p) => p.id),
  );
  checkDuplicates(
    'experience',
    c.experience.map((e) => e.id),
  );
  checkDuplicates(
    'radio',
    c.radioLines.map((r) => r.id),
  );

  const sorted = [...c.stops].sort((a, b) => a.order - b.order);
  sorted.forEach((stop, i) => {
    if (stop.order !== i) {
      problems.push(`Stop order must be contiguous from 0; got ${stop.order} at index ${i}`);
    }
    const prev = sorted[i - 1];
    if (prev && stop.t <= prev.t) problems.push(`Stop t must strictly increase: ${stop.id}`);
  });

  const stopsById = new Map(c.stops.map((s) => [s.id, s]));
  const refIds = new Set([
    ...c.projects.map((p) => p.id),
    ...c.experience.map((e) => e.id),
    ...c.communityNotes.map((n) => n.id),
  ]);
  const radioIds = new Set(c.radioLines.map((r) => r.id));

  for (const stop of c.stops) {
    if (stop.contentRef && !refIds.has(stop.contentRef)) {
      problems.push(`Stop ${stop.id}: unknown contentRef ${stop.contentRef}`);
    }
    if (stop.radioId && !radioIds.has(stop.radioId)) {
      problems.push(`Stop ${stop.id}: unknown radioId ${stop.radioId}`);
    }
  }
  for (const project of c.projects) {
    if (!project.stopId) continue;
    const stop = stopsById.get(project.stopId);
    if (!stop) {
      problems.push(`Project ${project.id}: unknown stopId ${project.stopId}`);
    } else if (stop.contentRef !== project.id) {
      problems.push(`Project ${project.id}: stop ${stop.id} does not reference it back`);
    }
  }
  const pinned = c.route.points.flatMap((p) => (p.stopId ? [p.stopId] : []));
  checkDuplicates('route stop pin', pinned);
  for (const id of pinned) {
    if (!stopsById.has(id)) problems.push(`Route point pins unknown stop ${id}`);
  }
  for (const stop of c.stops) {
    if (!pinned.includes(stop.id)) problems.push(`Stop ${stop.id} has no route point`);
  }
  const pinnedOrder = pinned.flatMap((id) => {
    const stop = stopsById.get(id);
    return stop ? [stop.order] : [];
  });
  if (pinnedOrder.some((order, i) => i > 0 && order <= pinnedOrder[i - 1]!)) {
    problems.push('Route points must pin stops in stop order');
  }
  checkDuplicates(
    'intersection',
    (c.route.intersections ?? []).map((x) => x.id),
  );
  for (const crossing of c.route.intersections ?? []) {
    if (!stopsById.has(crossing.stopId)) {
      problems.push(`Intersection ${crossing.id}: unknown stop ${crossing.stopId}`);
    }
    // The gap has to be wide enough for the street plus the margin buildings keep from it.
    if (crossing.street && crossing.halfLength < crossing.street.width / 2 + 3) {
      problems.push(`Intersection ${crossing.id}: gap is narrower than its cross street`);
    }
    if (crossing.control && crossing.control !== 'none' && !crossing.street) {
      problems.push(`Intersection ${crossing.id}: ${crossing.control} control needs a street`);
    }
  }
  checkDuplicates(
    'building stretch',
    c.buildings.map((b) => b.id),
  );
  for (const stretch of c.buildings) {
    for (const stopId of [stretch.from, stretch.to]) {
      if (!stopsById.has(stopId)) {
        problems.push(`Building stretch ${stretch.id}: unknown stop ${stopId}`);
      }
    }
  }
  problems.push(...findZoneProblems(c.atmosphere, c.stops));
  for (const line of c.radioLines) {
    if (!stopsById.has(line.stopId)) {
      problems.push(`Radio ${line.id}: unknown stopId ${line.stopId}`);
    }
  }
  return problems;
}

export function assertContentIntegrity(c: ContentBundle): void {
  const problems = findContentProblems(c);
  if (problems.length > 0) throw new Error(`Invalid content:\n- ${problems.join('\n- ')}`);
}
