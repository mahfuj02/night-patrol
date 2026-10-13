import type { Checkpoint, Experience, Project, Stop } from '@/content/schema';
import { formatDateRange } from './dates';

/** What the checkpoint panel shows for an experience or education entry. */
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

/** What the checkpoint panel shows for a project. */
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
  checkpoints: readonly Checkpoint[];
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
 * The checkpoint panel content for a stop, or null when the stop has no checkpoint (or points at
 * content that does not exist; the content integrity check catches that at build time).
 */
export function resolveCheckpoint(
  stop: Pick<Stop, 'id' | 'contentRef'> | undefined,
  sources: CheckpointSources,
): ResolvedCheckpoint | null {
  if (!stop?.contentRef) return null;
  const checkpoint = sources.checkpoints.find((c) => c.stopId === stop.id);
  if (!checkpoint) return null;
  const main = viewOf(stop.contentRef, sources);
  if (!main) return null;
  const teaser = checkpoint.teaserRef ? viewOf(checkpoint.teaserRef, sources) : undefined;
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
