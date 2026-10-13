import type { Experience, Project, Station, Stop } from '@/content/schema';
import { formatDateRange } from './dates';

/** What a station wall or project details shows for an experience or education entry. */
export interface ExperienceView {
  kind: 'experience';
  title: string;
  org: string;
  /** Formatted date range, or an empty string. */
  dates: string;
  /** First date as written, for the `dateTime` attribute. */
  isoDate?: string;
  summary?: string;
  bullets: string[];
}

/** What project details show for a project. */
export interface ProjectView {
  kind: 'project';
  title: string;
  tagline: string;
  problem: string;
  built: string;
  stack: string[];
  links: Project['links'];
}

export type CheckpointView = ExperienceView | ProjectView;

export interface ResolvedCheckpoint {
  stopId: string;
  main: CheckpointView;
  /** A short line from another entry, shown under the main content. */
  teaser?: { title: string; org?: string };
}

export interface CheckpointSources {
  experience: readonly Experience[];
  projects: readonly Project[];
}

function viewOf(ref: string, sources: CheckpointSources): CheckpointView | undefined {
  const entry = sources.experience.find((e) => e.id === ref);
  if (entry) {
    return {
      kind: 'experience',
      title: entry.title,
      org: entry.org,
      dates: formatDateRange(entry.start, entry.end),
      ...(entry.start ? { isoDate: entry.start } : {}),
      ...(entry.summary ? { summary: entry.summary } : {}),
      bullets: entry.bullets,
    };
  }
  const project = sources.projects.find((p) => p.id === ref);
  if (project) {
    return {
      kind: 'project',
      title: project.name,
      tagline: project.tagline,
      problem: project.problem,
      built: project.built,
      stack: project.stack,
      links: project.links,
    };
  }
  return undefined;
}

/**
 * The content behind a stop's `contentRef` (an experience entry or a project), with an optional
 * teaser from another entry, or null when it points at content that does not exist (the content
 * integrity check catches that at build time). Drive-by stops show a lit sign, not this content;
 * stations and the route map's project list show it.
 */
export function resolveCheckpoint(
  stop: Pick<Stop, 'id' | 'contentRef'> | undefined,
  sources: CheckpointSources,
  teaserRef?: string,
): ResolvedCheckpoint | null {
  if (!stop?.contentRef) return null;
  const main = viewOf(stop.contentRef, sources);
  if (!main) return null;
  const teaser = teaserRef ? viewOf(teaserRef, sources) : undefined;
  return {
    stopId: stop.id,
    main,
    ...(teaser
      ? {
          teaser: {
            title: teaser.title,
            ...(teaser.kind === 'experience' ? { org: teaser.org } : {}),
          },
        }
      : {}),
  };
}

/**
 * What a station shows on its wall: from the station's
 * `contentRef` and `teaserRef`, so there is one resolver and no second copy of the words.
 */
export function resolveStation(
  station: Pick<Station, 'stopId' | 'contentRef' | 'teaserRef'>,
  sources: CheckpointSources,
): ResolvedCheckpoint | null {
  return resolveCheckpoint(
    { id: station.stopId, contentRef: station.contentRef },
    sources,
    station.teaserRef,
  );
}

/**
 * The details of a project, for the route map's project list: the same content a station wall shows,
 * so every project is readable without driving to it or entering the library.
 */
export function resolveProjectDetails(
  projectId: string,
  sources: CheckpointSources,
): ResolvedCheckpoint | null {
  if (!sources.projects.some((p) => p.id === projectId)) return null;
  return resolveCheckpoint({ id: 'project', contentRef: projectId }, sources);
}
