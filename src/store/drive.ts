import { create } from 'zustand';
import { stops } from '@/content/stops';
import { clamp01, isAtStop, nearestStopIndex, stepToStop } from '@/lib/route';

export const STOP_TS: readonly number[] = stops.map((stop) => stop.t);

interface DriveState {
  /** Where the visitor wants to be along the route, 0..1. The scene eases toward it. */
  target: number;
  /** Index of the stop nearest to `target`. */
  stopIndex: number;
  /** True when `target` is close enough to `stopIndex` for the stop to count as reached. */
  atStop: boolean;
  /**
   * The stop whose checkpoint panel the visitor closed (Esc or the close button). The panel stays
   * closed while the visitor stays at that stop, and may open again when they come back to it.
   */
  dismissedStop: number | null;
  nudge: (delta: number) => void;
  next: () => void;
  prev: () => void;
  goToStop: (index: number) => void;
  dismissPanel: () => void;
}

function derive(target: number, dismissed: number | null = null) {
  const t = clamp01(target);
  const stopIndex = nearestStopIndex(t, STOP_TS);
  const atStop = isAtStop(t, STOP_TS);
  return {
    target: t,
    stopIndex,
    atStop,
    // A dismissal only lasts while the visitor is still at that stop.
    dismissedStop: atStop && dismissed === stopIndex ? dismissed : null,
  };
}

export const useDriveStore = create<DriveState>((set, get) => ({
  ...derive(0),
  nudge: (delta) => set(derive(get().target + delta, get().dismissedStop)),
  next: () => set(derive(stepToStop(get().target, 1, STOP_TS), get().dismissedStop)),
  prev: () => set(derive(stepToStop(get().target, -1, STOP_TS), get().dismissedStop)),
  goToStop: (index) => {
    const stopT = STOP_TS[index];
    if (stopT !== undefined) set(derive(stopT, get().dismissedStop));
  },
  dismissPanel: () => {
    const { atStop, stopIndex } = get();
    if (atStop) set({ dismissedStop: stopIndex });
  },
}));
