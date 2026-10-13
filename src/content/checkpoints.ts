import type { Checkpoint } from './schema';

/**
 * Which stops open a checkpoint panel (the drive-by stops). The panel shows the stop's `contentRef`
 * entry and, when `teaserRef` is set, a short teaser from another entry. Stops that are not listed
 * here show only their radio line. A stop that is also a station (see stations.ts) opens its content
 * on the wall instead, so it is not listed here. Phase 5 adds the rest one by one.
 */
export const checkpoints: Checkpoint[] = [
  // The EventFlow project, from projects.ts: tagline, problem, what was built, stack and links.
  { stopId: 'exchange-warehouses' },
  // The CivicTrack project.
  { stopId: 'city-services' },
];
