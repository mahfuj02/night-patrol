import { create } from 'zustand';
import { stations } from '@/content/stations';
import { stops } from '@/content/stops';
import { progress } from '@/lib/driveProgress';
import { magnetZone, nearestPoint, nextVisit, planJump, signedGap } from '@/lib/loopRoute';
import { MAGNETS, START_S, STOP_VISITS, patrolLoop as loop } from '@/lib/patrolLoop';
import {
  INITIAL_STATION,
  reduceStation,
  type StationAction,
  type StationState,
} from '@/lib/station';
import type { Direction } from '@/lib/uturn';

/** The car never gets further than this ahead of its destination's lead, so scrolling stays a leash. */
export const LEASH_METRES = 80;
/** Braking aims this many seconds of driving ahead of the car, so it eases to a stop, not a halt. */
export const BRAKE_SECONDS = 0.2;

interface DriveState {
  /**
   * Where the visitor wants the car to be, in metres driven round the patrol loop (it counts up lap
   * after lap, and the scene eases the car toward it, pulled to a stop by the magnet). The car only
   * ever drives forward along the loop: input moves this ahead, braking pulls it back to the car.
   */
  target: number;
  /** Index of the stop nearest to `target`. */
  stopIndex: number;
  /** True when `target` is close enough to a stop for the stop to count as reached. */
  atStop: boolean;
  /** The station whose red light the car is stopped at, or null. */
  atLight: number | null;
  /** The station the visitor can open right now (at its light, or at its stop), or null. */
  openable: number | null;
  /** Which way along the route the car is heading at `target`: 1 outbound, -1 heading back. */
  direction: Direction;
  /** True after braking, until the car drives again: the cue to offer Turn around. */
  braked: boolean;
  /** A U-turn has been asked for (the button, or a jump that is nearer the other way) and is not done. */
  turnRequest: boolean;
  /** Where on the loop (wrapped) to drive to once the U-turn is done, or null to stay put. */
  goal: number | null;
  /** True while the car is on a roundabout, where it drives itself and cannot be braked or turned. */
  arc: boolean;
  /** How many times the car has come round the turnaround and started another lap. */
  laps: number;
  /** A station chosen from the map: opened as soon as the car has arrived at it. */
  pendingOpen: number | null;
  /** The station arrival state: idle, turning in, parked or backing out. */
  station: StationState;
  /** False when the wall is too small on screen to read, so the content opens in the sheet too. */
  wallLegible: boolean;
  /**
   * Start over: the view fades out, the car is put back at the first stop heading out, and the view
   * fades in. `resetCount` goes up at the cut so the scene snaps instead of driving back.
   */
  shift: 'idle' | 'fading-out' | 'fading-in';
  resetCount: number;
  /** Forward input: drive on. Backward input: brake. A size of 0 does nothing. */
  nudge: (delta: number) => void;
  /** Drive on to the next stop ahead. */
  next: () => void;
  /** Brake to a stop. */
  brake: () => void;
  /** Turn round in the road and stop, facing the other way. */
  turnAround: () => void;
  goToStop: (index: number) => void;
  /** Drives to a station and opens it once there. */
  goToStation: (index: number) => void;
  openStation: () => void;
  closeStation: () => void;
  finishManeuver: () => void;
  setWallLegible: (legible: boolean) => void;
  /** The scene finished a U-turn and the car is now `pos` metres round the loop. */
  finishTurn: (pos: number) => void;
  /** The scene says whether the car is on a roundabout. */
  setArc: (arc: boolean) => void;
  /** The scene says the car has come round the turnaround and is starting another lap. */
  completeLap: () => void;
  /** Fade out, put the car back at the first stop heading out, and fade in. */
  startOver: () => void;
  /** The view is dark: cut back to the first stop and fade in. */
  completeFadeOut: () => void;
  /** The view is back: the reset is over. */
  finishReset: () => void;
}

/** What the target says about the stop and station the car is at. */
export function derive(target: number) {
  const s = loop.wrap(target);
  const nearVisit = STOP_VISITS[nearestPoint(loop, s, STOP_VISITS)];
  const magnetIndex = nearestPoint(loop, s, MAGNETS);
  const point = MAGNETS[magnetIndex];
  const inZone =
    point !== undefined &&
    Math.abs(signedGap(loop, s, point.s)) <= magnetZone(loop, magnetIndex, MAGNETS);
  const atStop = inZone && point.kind === 'stop';
  const atLight = inZone && point.kind === 'light' ? point.ref : null;
  const stopIndex = atStop ? point.ref : (nearVisit?.stop ?? 0);
  const stopId = stops[stopIndex]?.id;
  const stationAtStop = atStop ? stations.findIndex((st) => st.stopId === stopId) : -1;
  return {
    target,
    stopIndex,
    atStop,
    atLight,
    openable: atLight ?? (stationAtStop >= 0 ? stationAtStop : null),
    direction: (inZone ? point.direction : loop.direction(s)) as Direction,
  };
}

const IDLE = {
  braked: false,
  turnRequest: false,
  goal: null,
  pendingOpen: null,
} as const;

export const useDriveStore = create<DriveState>((set, get) => {
  /** Applies a movement unless the car is in a station: then it backs out first (or is ignored). */
  const move = (dir: 1 | -1 | 0, go: () => void, jump?: number, open?: number) => {
    // Nothing drives the car while it is starting over, or turning round.
    if (get().shift !== 'idle' || get().turnRequest) return;
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

  /** Drives (or turns round and drives) to the nearest visit of a stop. */
  const jumpTo = (index: number, open: number | null) => {
    const visits = STOP_VISITS.filter((v) => v.stop === index);
    const here = progress.s;
    const plan = planJump(loop, loop.wrap(here), visits);
    if (!plan) return;
    if (plan.uTurn) {
      // Show where it is going now; the scene turns the car round, then drives there.
      set({
        ...derive(plan.visit.s),
        target: here,
        braked: false,
        turnRequest: true,
        goal: plan.visit.s,
        pendingOpen: open,
      });
      return;
    }
    set({
      ...derive(here + plan.distance),
      braked: false,
      goal: null,
      pendingOpen: open,
    });
  };

  return {
    ...derive(START_S),
    braked: false,
    turnRequest: false,
    goal: null,
    arc: false,
    laps: 0,
    station: INITIAL_STATION,
    pendingOpen: null,
    wallLegible: true,
    shift: 'idle',
    resetCount: 0,
    nudge: (delta) => {
      if (delta < 0) return get().brake();
      if (delta === 0) return;
      move(1, () => {
        const was = get().target;
        const ahead = Math.min(was + delta * loop.spec.road, progress.s + LEASH_METRES);
        // Never pulls the target back (a jump may have put it beyond the leash).
        set({ ...derive(Math.max(was, ahead)), braked: false, pendingOpen: null });
      });
    },
    next: () =>
      move(1, () => {
        const was = get().target;
        const s = loop.wrap(was);
        const visit = nextVisit(loop, s, STOP_VISITS);
        if (!visit) return;
        let ahead = loop.ahead(s, visit.s);
        if (ahead <= 1) ahead += loop.length;
        set({ ...derive(was + ahead), braked: false, pendingOpen: null });
      }),
    brake: () =>
      move(-1, () => {
        // On a roundabout the car drives itself round.
        if (get().arc) return;
        const aim = progress.s + Math.max(0, progress.speed) * BRAKE_SECONDS;
        set({ ...derive(aim), braked: true, pendingOpen: null, goal: null });
      }),
    turnAround: () =>
      move(0, () => {
        if (get().arc) return;
        set({
          ...derive(progress.s),
          braked: false,
          pendingOpen: null,
          turnRequest: true,
          goal: null,
        });
      }),
    goToStop: (index) => move(0, () => jumpTo(index, null), index),
    goToStation: (index) => {
      const station = stations[index];
      const stopIndex = stops.findIndex((s) => s.id === station?.stopId);
      if (!station || stopIndex < 0) return;
      move(0, () => jumpTo(stopIndex, index), stopIndex, index);
    },
    openStation: () => {
      const { openable, station, shift, turnRequest } = get();
      if (openable !== null && station.phase === 'idle' && shift === 'idle' && !turnRequest) {
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
        if (pending.kind === 'dir') (pending.dir === 1 ? get().next : get().brake)();
        else if (pending.kind === 'go') get().goToStop(pending.index);
        else if (pending.kind === 'station') get().goToStation(pending.index);
      }
    },
    setWallLegible: (legible) => {
      if (get().wallLegible !== legible) set({ wallLegible: legible });
    },
    finishTurn: (pos) => {
      const { goal, pendingOpen } = get();
      const target = goal === null ? pos : pos + loop.ahead(loop.wrap(pos), goal);
      set({ ...derive(target), ...IDLE, pendingOpen: goal === null ? null : pendingOpen });
    },
    setArc: (arc) => {
      if (get().arc !== arc) set({ arc });
    },
    completeLap: () => set({ laps: get().laps + 1 }),
    startOver: () => {
      const { shift, station, turnRequest } = get();
      if (shift !== 'idle' || station.phase !== 'idle' || turnRequest) return;
      set({ shift: 'fading-out', pendingOpen: null });
    },
    completeFadeOut: () => {
      if (get().shift !== 'fading-out') return;
      set({
        ...derive(START_S),
        ...IDLE,
        arc: false,
        station: INITIAL_STATION,
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
