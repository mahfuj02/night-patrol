import { beforeEach, describe, expect, it } from 'vitest';
import { stations, stops } from '@/content';
import { INITIAL_STATION } from '@/lib/station';
import { MAGNET_TS, STATION_LIGHT_TS, STOP_TS, useDriveStore } from './drive';

const state = () => useDriveStore.getState();
const EDU = 0;
const RRC = stops.findIndex((s) => s.id === stations[EDU]!.stopId);
const lightT = STATION_LIGHT_TS[EDU]!;

function reset() {
  useDriveStore.setState({ station: INITIAL_STATION, wallLegible: true });
  state().goToStop(0);
}

describe('station magnets', () => {
  it('puts the Education red light before the RRC stop, in route order', () => {
    expect(lightT).toBeLessThan(STOP_TS[RRC]!);
    expect(lightT).toBeGreaterThan(STOP_TS[RRC - 1]!);
    expect(MAGNET_TS).toHaveLength(STOP_TS.length + STATION_LIGHT_TS.length);
    expect([...MAGNET_TS]).toEqual([...MAGNET_TS].sort((a, b) => a - b));
    // About 20 m before the stop on a 1,123 m route.
    expect(STOP_TS[RRC]! - lightT).toBeCloseTo(20 / 1122.84, 6);
  });
});

describe('opening a station', () => {
  beforeEach(reset);

  it('can be opened at the red light and at the stop, and not elsewhere', () => {
    expect(state().openable).toBeNull();
    useDriveStore.setState({ ...state(), target: lightT });
    state().nudge(0);
    expect(state().atLight).toBe(EDU);
    expect(state().openable).toBe(EDU);
    expect(state().atStop).toBe(false);
    state().goToStop(RRC);
    expect(state().atLight).toBeNull();
    expect(state().atStop).toBe(true);
    expect(state().openable).toBe(EDU);
    state().goToStop(RRC + 1);
    expect(state().openable).toBeNull();
  });

  it('opens only when something is openable', () => {
    state().openStation();
    expect(state().station.phase).toBe('idle');
    state().goToStop(RRC);
    state().openStation();
    expect(state().station).toEqual({
      phase: 'turning-in',
      index: EDU,
      pending: { kind: 'none' },
    });
  });

  it('goes turning in, parked, backing out and back to idle as the scene reports', () => {
    state().goToStop(RRC);
    state().openStation();
    state().finishManeuver();
    expect(state().station.phase).toBe('parked');
    state().closeStation();
    expect(state().station.phase).toBe('backing-out');
    state().finishManeuver();
    expect(state().station).toEqual(INITIAL_STATION);
    // Back on the road at the same stop.
    expect(state().stopIndex).toBe(RRC);
  });
});

describe('moving while at a station', () => {
  beforeEach(() => {
    reset();
    state().goToStop(RRC);
    state().openStation();
  });

  it('ignores movement while the car turns in', () => {
    const before = state().target;
    state().nudge(0.05);
    state().next();
    state().prev();
    state().goToStop(0);
    expect(state().target).toBe(before);
    expect(state().station.phase).toBe('turning-in');
  });

  it('backs out first when driving on from the parked car, then makes the move', () => {
    state().finishManeuver();
    state().next();
    expect(state().station.phase).toBe('backing-out');
    expect(state().station.pending).toEqual({ kind: 'dir', dir: 1 });
    expect(state().stopIndex).toBe(RRC);
    state().finishManeuver();
    expect(state().station).toEqual(INITIAL_STATION);
    expect(state().stopIndex).toBe(RRC + 1);
  });

  it('drives backwards on Prev and a wheel nudge too', () => {
    state().finishManeuver();
    state().prev();
    state().finishManeuver();
    expect(state().stopIndex).toBe(RRC - 1);

    state().goToStop(RRC);
    state().openStation();
    state().finishManeuver();
    state().nudge(0.04);
    expect(state().station.pending).toEqual({ kind: 'dir', dir: 1 });
    state().finishManeuver();
    expect(state().stopIndex).toBe(RRC + 1);
  });

  it('keeps a jump to another stop for after backing out', () => {
    state().finishManeuver();
    state().goToStop(5);
    expect(state().station.pending).toEqual({ kind: 'go', index: 5 });
    state().finishManeuver();
    expect(state().stopIndex).toBe(5);
    expect(state().station.phase).toBe('idle');
  });

  it('ignores a zero nudge while parked', () => {
    state().finishManeuver();
    state().nudge(0);
    expect(state().station.phase).toBe('parked');
  });

  it('can be left with the leave action halfway through turning in', () => {
    state().closeStation();
    expect(state().station.phase).toBe('backing-out');
    state().finishManeuver();
    expect(state().station).toEqual(INITIAL_STATION);
  });
});

describe('wall legibility', () => {
  beforeEach(reset);
  it('remembers whether the wall is big enough to read, and resets when the car leaves', () => {
    state().setWallLegible(false);
    expect(state().wallLegible).toBe(false);
    state().setWallLegible(false);
    state().goToStop(RRC);
    state().openStation();
    state().finishManeuver();
    state().closeStation();
    state().finishManeuver();
    expect(state().wallLegible).toBe(true);
  });
});
