import { create } from 'zustand';
import { route } from '@/content/route';
import { stations } from '@/content/stations';
import { stops } from '@/content/stops';
import { clamp01, isAtStop, nearestStopIndex, stepToStop } from '@/lib/route';
import {
  INITIAL_STATION,
  offsetT,
  reduceStation,
  type StationAction,
  type StationState,
} from '@/lib/station';

export const STOP_TS: readonly number[] = stops.map((stop) => stop.t);

/**
 * The farthest the car can be driven: the last stop. The road runs a little past it (the lead-in to
 * the roundabout at the end of the shift), but only the end-of-shift loop drives there.
 */
export const LAST_STOP_T = STOP_TS[STOP_TS.length - 1] ?? 1;

/** Where each station's car stops at its red light, as `t`. */
export const STATION_LIGHT_TS: readonly number[] = stations.map((station) => {
  const stop = stops.find((s) => s.id === station.stopId);
  return offsetT(stop?.t ?? 0, station.light.offset, route.lengthMetres);
});

interface Point {
  t: number;
  kind: 'stop' | 'light';
  /** The stop index, or the station index. */
  ref: number;
}

/** Every place the magnet holds the car: the stops and the station lights, in route order. */
const POINTS: readonly Point[] = [
  ...STOP_TS.map((t, ref): Point => ({ t, kind: 'stop', ref })),
  ...STATION_LIGHT_TS.map((t, ref): Point => ({ t, kind: 'light', ref })),
].sort((a, b) => a.t - b.t);

/** The magnet positions (`t`), used by the scene to ease the car to a stop at each of them. */
export const MAGNET_TS: readonly number[] = POINTS.map((p) => p.t);

interface DriveState {
  /** Where the visitor wants to be along the route, 0..1. The scene eases toward it. */
  target: number;
  /** Index of the stop nearest to `target`. */
  stopIndex: number;
  /** True when `target` is close enough to `stopIndex` for the stop to count as reached. */
  atStop: boolean;
  /** The station whose red light the car is stopped at, or null. */
  atLight: number | null;
  /** The station the visitor can open right now (at its light, or at its stop), or null. */
  openable: number | null;
  /** A station the visitor chose from the map: opened as soon as the car has arrived at it. */
  pendingOpen: number | null;
  /** The station arrival state: idle, turning in, parked or backing out. */
  station: StationState;
  /** False when the wall is too small on screen to read, so the content opens in the sheet too. */
  wallLegible: boolean;
  /**
   * The end of the shift: the car `looping` the roundabout past The Forks, then `fading-out` (the
   * view goes dark), then the car is put back at the first stop and the view `fading-in`, then
   * `idle`. `resetCount` goes up at the cut so the scene snaps its progress instead of easing back
   * along the whole route.
   */
  shift: 'idle' | 'looping' | 'fading-out' | 'fading-in';
  resetCount: number;
  nudge: (delta: number) => void;
  next: () => void;
  prev: () => void;
  goToStop: (index: number) => void;
  /** Drives to a station and opens it once there. */
  goToStation: (index: number) => void;
  openStation: () => void;
  closeStation: () => void;
  finishManeuver: () => void;
  setWallLegible: (legible: boolean) => void;
  /** At the last stop with the car out of its station: loop the roundabout, fade out and start again. */
  startNewPatrol: () => void;
  /** The lap is done (or skipped): fade out. */
  finishLoop: () => void;
  /** The view is dark: cut back to the first stop and fade in. */
  completeFadeOut: () => void;
  /** The view is back: the reset is over. */
  finishReset: () => void;
}

function derive(target: number) {
  const t = Math.min(clamp01(target), LAST_STOP_T);
  const stopIndex = nearestStopIndex(t, STOP_TS);
  const magnetIndex = nearestStopIndex(t, MAGNET_TS);
  const point = isAtStop(t, MAGNET_TS) ? POINTS[magnetIndex] : undefined;
  const atStop = point?.kind === 'stop';
  const atLight = point?.kind === 'light' ? point.ref : null;
  const stopId = stops[stopIndex]?.id;
  const stationAtStop = atStop ? stations.findIndex((s) => s.stopId === stopId) : -1;
  return {
    target: t,
    stopIndex,
    atStop,
    atLight,
    openable: atLight ?? (stationAtStop >= 0 ? stationAtStop : null),
  };
}

export const useDriveStore = create<DriveState>((set, get) => {
  /** Applies a movement unless the car is in a station: then it backs out first (or is ignored). */
  const move = (dir: 1 | -1 | 0, go: () => void, jump?: number, open?: number) => {
    // Nothing drives the car while the end of the shift plays (the loop, the fade and the reset).
    if (get().shift !== 'idle') return;
    const { station } = get();
    if (station.phase === 'idle') return go();
    if (station.phase === 'parked' && (dir !== 0 || jump !== undefined)) {
      const pending =
        open !== undefined
          ? { kind: 'station' as const, index: open }
          : jump !== undefined
            ? { kind: 'go' as const, index: jump }
            : { kind: 'dir' as const, dir: dir as 1 | -1 };
      set({ station: reduceStation(station, { type: 'close', pending }) });
    }
    // While turning in or backing out, movement is ignored.
  };

  const dispatch = (action: StationAction) =>
    set((state) => ({ station: reduceStation(state.station, action) }));

  return {
    ...derive(0),
    station: INITIAL_STATION,
    pendingOpen: null,
    wallLegible: true,
    shift: 'idle',
    resetCount: 0,
    nudge: (delta) =>
      move(delta > 0 ? 1 : delta < 0 ? -1 : 0, () =>
        set({ ...derive(get().target + delta), pendingOpen: null }),
      ),
    next: () =>
      move(1, () =>
        set({
          ...derive(stepToStop(get().target, 1, STOP_TS)),
          pendingOpen: null,
        }),
      ),
    prev: () =>
      move(-1, () =>
        set({
          ...derive(stepToStop(get().target, -1, STOP_TS)),
          pendingOpen: null,
        }),
      ),
    goToStop: (index) =>
      move(
        0,
        () => {
          const stopT = STOP_TS[index];
          if (stopT !== undefined) {
            set({ ...derive(stopT), pendingOpen: null });
          }
        },
        index,
      ),
    goToStation: (index) => {
      const station = stations[index];
      const stopIndex = stops.findIndex((s) => s.id === station?.stopId);
      const stopT = STOP_TS[stopIndex];
      if (!station || stopT === undefined) return;
      move(0, () => set({ ...derive(stopT), pendingOpen: index }), stopIndex, index);
    },
    openStation: () => {
      const { openable, station, shift } = get();
      if (openable !== null && station.phase === 'idle' && shift === 'idle') {
        set({ pendingOpen: null });
        dispatch({ type: 'open', index: openable });
      }
    },
    closeStation: () => dispatch({ type: 'close' }),
    finishManeuver: () => {
      const before = get().station;
      dispatch({ type: 'maneuver-done' });
      const after = get().station;
      if (before.phase === 'backing-out' && after.phase === 'idle') {
        const { pending } = after;
        set({ station: { ...after, pending: { kind: 'none' } }, wallLegible: true });
        if (pending.kind === 'dir') (pending.dir === 1 ? get().next : get().prev)();
        else if (pending.kind === 'go') get().goToStop(pending.index);
        else if (pending.kind === 'station') get().goToStation(pending.index);
      }
    },
    setWallLegible: (legible) => {
      if (get().wallLegible !== legible) set({ wallLegible: legible });
    },
    startNewPatrol: () => {
      const { shift, atStop, stopIndex, station } = get();
      if (shift !== 'idle' || station.phase !== 'idle') return;
      if (!atStop || stopIndex !== stops.length - 1) return;
      set({ shift: 'looping', pendingOpen: null });
    },
    finishLoop: () => {
      if (get().shift === 'looping') set({ shift: 'fading-out' });
    },
    completeFadeOut: () => {
      if (get().shift !== 'fading-out') return;
      set({
        ...derive(0),
        station: INITIAL_STATION,
        pendingOpen: null,
        wallLegible: true,
        shift: 'fading-in',
        resetCount: get().resetCount + 1,
      });
    },
    finishReset: () => {
      if (get().shift === 'fading-in') set({ shift: 'idle' });
    },
  };
});
