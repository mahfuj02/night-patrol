import { beforeEach, describe, expect, it } from 'vitest';
import { stations, stops } from '@/content';
import { INITIAL_STATION } from '@/lib/station';
import { LAST_STOP_T, STOP_TS, useDriveStore } from './drive';

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

describe('the end of the shift', () => {
  beforeEach(reset);

  it('ends the drive at the last stop: the road runs on, but the car cannot be driven past it', () => {
    expect(LAST_STOP_T).toBe(STOP_TS[LAST]);
    expect(LAST_STOP_T).toBeLessThan(1);
    state().nudge(5);
    expect(state().target).toBe(LAST_STOP_T);
    expect(state().stopIndex).toBe(LAST);
    expect(state().atStop).toBe(true);
  });

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

  it('loops the roundabout, then fades out, then cuts back to the first stop and fades in', () => {
    state().goToStop(LAST);
    state().startNewPatrol();
    expect(state().shift).toBe('looping');
    // Nothing moves while the car loops: the stop it started from stays the current one.
    expect(state().stopIndex).toBe(LAST);
    state().finishLoop();
    expect(state().shift).toBe('fading-out');
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

  it('ignores a second start while one is running, and steps taken out of order', () => {
    state().goToStop(LAST);
    state().finishLoop();
    state().finishReset();
    state().completeFadeOut();
    expect(state().shift).toBe('idle');
    state().startNewPatrol();
    state().startNewPatrol();
    expect(state().shift).toBe('looping');
    // Fading steps do nothing until the lap is over.
    state().completeFadeOut();
    state().finishReset();
    expect(state().shift).toBe('looping');
    state().finishLoop();
    state().finishLoop();
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
    state().finishLoop();
    state().completeFadeOut();
    expect(state().station).toEqual(INITIAL_STATION);
  });

  it('ignores driving, jumping and opening a station while the end of the shift plays', () => {
    state().goToStop(LAST);
    expect(state().openable).not.toBeNull();
    state().startNewPatrol();
    const target = state().target;
    state().nudge(-0.2);
    state().prev();
    state().next();
    state().goToStop(0);
    state().goToStation(0);
    state().openStation();
    expect(state().target).toBe(target);
    expect(state().station.phase).toBe('idle');
    expect(state().pendingOpen).toBeNull();
    // It works again once the shift has finished.
    state().finishLoop();
    state().completeFadeOut();
    state().finishReset();
    state().nudge(0.01);
    expect(state().target).toBeCloseTo(0.01, 10);
  });
});
