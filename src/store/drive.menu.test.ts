import { beforeEach, describe, expect, it } from 'vitest';
import { stations, stops } from '@/content';
import { INITIAL_STATION } from '@/lib/station';
import { STOP_TS, useDriveStore } from './drive';

const state = () => useDriveStore.getState();
const RRC = stops.findIndex((s) => s.id === stations[0]!.stopId);

function reset() {
  useDriveStore.setState({ station: INITIAL_STATION, pendingOpen: null, wallLegible: true });
  state().goToStop(0);
}

describe('going to a station from the map', () => {
  beforeEach(reset);

  it('drives to the stop and asks for the station to open on arrival', () => {
    state().goToStation(0);
    expect(state().target).toBe(STOP_TS[RRC]);
    expect(state().pendingOpen).toBe(0);
    expect(state().station.phase).toBe('idle');
    // The scene opens it once the car has arrived; opening clears the request.
    expect(state().openable).toBe(0);
    state().openStation();
    expect(state().pendingOpen).toBeNull();
    expect(state().station.phase).toBe('turning-in');
  });

  it('is cancelled by any other movement before the car arrives', () => {
    for (const move of [
      () => state().nudge(0.01),
      () => state().next(),
      () => state().prev(),
      () => state().goToStop(1),
    ]) {
      state().goToStation(0);
      expect(state().pendingOpen).toBe(0);
      move();
      expect(state().pendingOpen).toBeNull();
    }
  });

  it('does nothing for a station that does not exist', () => {
    const before = state().target;
    state().goToStation(99);
    expect(state().target).toBe(before);
    expect(state().pendingOpen).toBeNull();
  });

  it('backs out of the station the car is parked at first, then drives to the chosen one', () => {
    state().goToStop(RRC);
    state().openStation();
    state().finishManeuver();
    expect(state().station.phase).toBe('parked');
    state().goToStation(0);
    expect(state().station.phase).toBe('backing-out');
    expect(state().station.pending).toEqual({ kind: 'station', index: 0 });
    state().finishManeuver();
    expect(state().station.phase).toBe('idle');
    expect(state().pendingOpen).toBe(0);
  });

  it('leaves a parked car where it is for a request to go nowhere new', () => {
    state().goToStop(RRC);
    state().openStation();
    state().finishManeuver();
    state().goToStop(0);
    expect(state().station.pending).toEqual({ kind: 'go', index: 0 });
  });
});
