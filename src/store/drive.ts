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
  nudge: (delta: number) => void;
  next: () => void;
  prev: () => void;
  goToStop: (index: number) => void;
}

function derive(target: number) {
  const t = clamp01(target);
  return { target: t, stopIndex: nearestStopIndex(t, STOP_TS), atStop: isAtStop(t, STOP_TS) };
}

export const useDriveStore = create<DriveState>((set, get) => ({
  ...derive(0),
  nudge: (delta) => set(derive(get().target + delta)),
  next: () => set(derive(stepToStop(get().target, 1, STOP_TS))),
  prev: () => set(derive(stepToStop(get().target, -1, STOP_TS))),
  goToStop: (index) => {
    const stopT = STOP_TS[index];
    if (stopT !== undefined) set(derive(stopT));
  },
}));
