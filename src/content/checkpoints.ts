import type { Checkpoint } from './schema';

/**
 * Which stops open a checkpoint panel. The panel shows the stop's `contentRef` entry and, when
 * `teaserRef` is set, a short teaser from another entry. Stops that are not listed here show only
 * their radio line. Phase 4 turns on the first stop; Phase 5 adds the rest.
 */
export const checkpoints: Checkpoint[] = [
  {
    stopId: 'rrc-campus',
    // The Sprint-Innovation 2025 win, as a teaser line under the diploma.
    teaserRef: 'sprint-innovation-2025',
  },
];
