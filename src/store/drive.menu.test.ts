import { beforeEach, describe, expect, it } from 'vitest';
import { stations, stops } from '@/content';
import { progress } from '@/lib/driveProgress';
import { INITIAL_STATION } from '@/lib/station';
import { useDriveStore } from './drive';
import { arriveAt, resetDrive, visitOf } from './driveTestUtils';

const state = () => useDriveStore.getState();
const RRC = stops.findIndex((s) => s.id === stations[0]!.stopId);

describe('going to a station from the map', () => {
  beforeEach(resetDrive);

  it('drives to the stop and asks for the station to open on arrival', () => {
    state().goToStation(0);
    expect(state().target).toBeCloseTo(visitOf(RRC).s, 6);
    expect(state().pendingOpen).toBe(0);
    expect(state().station.phase).toBe('idle');
    // The scene opens it once the car has arrived; opening clears the request.
    expect(state().openable).toBe(0);
    state().openStation();
    expect(state().pendingOpen).toBeNull();
    expect(state().station.phase).toBe('turning-in');
  });

  it('goes to the heading-back visit of a station when that is nearer, turning round once', () => {
    arriveAt(8, 1);
    state().goToStation(0);
    expect(state().turnRequest).toBe(true);
    expect(state().goal).toBe(visitOf(RRC, -1).s);
    expect(state().pendingOpen).toBe(0);
    // Once the scene has turned the car round, the open request is still waiting.
    progress.s = progress.s + 1000;
    state().finishTurn(progress.s);
    expect(state().pendingOpen).toBe(0);
    expect(state().turnRequest).toBe(false);
  });

  it('is cancelled by any other movement before the car arrives', () => {
    for (const move of [
      () => state().nudge(0.01),
      () => state().next(),
      () => state().brake(),
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
    useDriveStore.setState({ station: INITIAL_STATION });
    arriveAt(RRC);
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

  it('keeps a request to go elsewhere for after backing out', () => {
    arriveAt(RRC);
    state().openStation();
    state().finishManeuver();
    state().goToStop(0);
    expect(state().station.pending).toEqual({ kind: 'go', index: 0 });
  });
});
