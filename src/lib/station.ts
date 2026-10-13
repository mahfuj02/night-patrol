/**
 * The station arrival state machine and its timing (docs/navigation-redesign.md). Pure, so the
 * store, the scene and the tests share one set of rules.
 *
 * Phases: `idle` (driving, or stopped at a light with the Open button showing), `turning-in`,
 * `parked`, `backing-out`. A visitor who drives on while parked backs out first, and the move they
 * asked for is remembered (`pending`) and done once the car is back on the road.
 */

export type StationPhase = 'idle' | 'turning-in' | 'parked' | 'backing-out';

export type Pending =
  | { kind: 'none' }
  | { kind: 'dir'; dir: 1 | -1 }
  | { kind: 'go'; index: number }
  | { kind: 'station'; index: number };

export interface StationState {
  phase: StationPhase;
  /** The station being visited, or null while idle. */
  index: number | null;
  pending: Pending;
}

export type StationAction =
  | { type: 'open'; index: number }
  | { type: 'close'; pending?: Pending }
  | { type: 'maneuver-done' };

export const INITIAL_STATION: StationState = {
  phase: 'idle',
  index: null,
  pending: { kind: 'none' },
};

/** Seconds to turn into the bay, and to back out of it. */
export const TURN_IN_SECONDS = 2;
export const BACK_OUT_SECONDS = 1.2;

export function reduceStation(state: StationState, action: StationAction): StationState {
  switch (action.type) {
    case 'open':
      return state.phase === 'idle'
        ? { phase: 'turning-in', index: action.index, pending: { kind: 'none' } }
        : state;
    case 'close': {
      const pending = action.pending ?? { kind: 'none' };
      if (state.phase === 'parked') return { ...state, phase: 'backing-out', pending };
      // Leaving halfway through turning in: back out from where the car is.
      if (state.phase === 'turning-in') return { ...state, phase: 'backing-out', pending };
      return state;
    }
    case 'maneuver-done':
      if (state.phase === 'turning-in') return { ...state, phase: 'parked' };
      if (state.phase === 'backing-out') {
        return { phase: 'idle', index: null, pending: state.pending };
      }
      return state;
  }
}

/** True while the car is in a manoeuvre, when input other than leaving is ignored. */
export const isManeuvering = (phase: StationPhase) =>
  phase === 'turning-in' || phase === 'backing-out';

/** The `t` of a point `metres` along the road from an anchor `t`. */
export function offsetT(anchorT: number, metres: number, routeLength: number): number {
  return anchorT + metres / routeLength;
}

/** How far before the light the signal starts to turn red, and how far past the stop it stays red. */
export const RED_APPROACH = 0.02;
export const RED_AFTER = 0.012;

/**
 * Whether a station's light is red: from a little before the car's stopping point at the light
 * until a little past the stop, and for as long as the car is in the station.
 */
export function lightIsRed(
  t: number,
  lightT: number,
  stopT: number,
  phase: StationPhase = 'idle',
): boolean {
  if (phase !== 'idle') return true;
  return t >= lightT - RED_APPROACH && t <= stopT + RED_AFTER;
}

/** How lit the headlights and the wall are, 0 to 1, for a phase and its progress `p` (0 to 1). */
export function stationGlow(phase: StationPhase, p: number): number {
  switch (phase) {
    case 'idle':
      return 0;
    case 'turning-in':
      return Math.min(1, Math.max(0, p));
    case 'parked':
      return 1;
    case 'backing-out':
      return 1 - Math.min(1, Math.max(0, p));
  }
}

/** Moves a manoeuvre's progress on by `dt` seconds. Under reduced motion it jumps to the end. */
export function advanceManeuver(
  p: number,
  dt: number,
  seconds: number,
  reducedMotion: boolean,
): number {
  if (reducedMotion) return 1;
  return Math.min(1, p + dt / seconds);
}
