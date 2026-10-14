import { beforeEach, describe, expect, it } from 'vitest';
import { stations, stops } from '@/content';
import { INITIAL_STATION } from '@/lib/station';
import { STOP_TS, useDriveStore } from './drive';

const state = () => useDriveStore.getState();
const LAST = stops.length - 1;

function reset() {
  useDriveStore.setState({
    station: INITIAL_STATION,
    pendingOpen: null,
    wallLegible: true,
    shift: 'idle',
    resetCount: 0,
  });
  state().goToStop(0);
}

describe('the end-of-shift reset', () => {
  beforeEach(reset);

  it('does nothing away from the last stop', () => {
    state().startNewPatrol();
    expect(state().shift).toBe('idle');
    state().goToStop(LAST - 1);
    state().startNewPatrol();
    expect(state().shift).toBe('idle');
    // Between stops it does nothing either.
    state().nudge((STOP_TS[LAST - 1]! + STOP_TS[LAST]!) / 2 - STOP_TS[LAST - 1]!);
    state().startNewPatrol();
    expect(state().shift).toBe('idle');
  });

  it('fades out at the last stop, then cuts back to the first stop and fades in', () => {
    state().goToStop(LAST);
    state().startNewPatrol();
    expect(state().shift).toBe('fading-out');
    // Nothing moves until the view is dark.
    expect(state().stopIndex).toBe(LAST);
    expect(state().resetCount).toBe(0);
    state().completeFadeOut();
    expect(state().shift).toBe('fading-in');
    expect(state().stopIndex).toBe(0);
    expect(state().target).toBe(0);
    expect(state().atStop).toBe(true);
    expect(state().resetCount).toBe(1);
    state().finishReset();
    expect(state().shift).toBe('idle');
  });

  it('ignores a second start while one is running, and out-of-order steps', () => {
    state().goToStop(LAST);
    state().finishReset();
    state().completeFadeOut();
    expect(state().shift).toBe('idle');
    state().startNewPatrol();
    state().startNewPatrol();
    expect(state().shift).toBe('fading-out');
    state().finishReset();
    expect(state().shift).toBe('fading-out');
    state().completeFadeOut();
    state().completeFadeOut();
    expect(state().resetCount).toBe(1);
  });

  it('waits until the car is out of its station', () => {
    state().goToStop(LAST);
    state().openStation();
    state().finishManeuver();
    expect(state().station.phase).toBe('parked');
    state().startNewPatrol();
    expect(state().shift).toBe('idle');
    expect(stations.some((s) => s.stopId === stops[LAST]!.id)).toBe(true);
  });

  it('clears a pending station and the station state when it resets', () => {
    state().goToStop(LAST);
    useDriveStore.setState({ pendingOpen: 1 });
    state().startNewPatrol();
    expect(state().pendingOpen).toBeNull();
    state().completeFadeOut();
    expect(state().station).toEqual(INITIAL_STATION);
  });
});
