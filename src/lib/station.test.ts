import { describe, expect, it } from 'vitest';
import {
  BACK_OUT_SECONDS,
  INITIAL_STATION,
  RED_AFTER,
  RED_APPROACH,
  TURN_IN_SECONDS,
  advanceManeuver,
  isManeuvering,
  lightIsRed,
  offsetT,
  reduceStation,
  stationGlow,
  type StationState,
} from './station';

const open = reduceStation(INITIAL_STATION, { type: 'open', index: 0 });
const parked = reduceStation(open, { type: 'maneuver-done' });

describe('reduceStation', () => {
  it('goes idle, turning in, parked, backing out, idle', () => {
    expect(INITIAL_STATION.phase).toBe('idle');
    expect(open).toEqual({ phase: 'turning-in', index: 0, pending: { kind: 'none' } });
    expect(parked.phase).toBe('parked');
    const leaving = reduceStation(parked, { type: 'close' });
    expect(leaving.phase).toBe('backing-out');
    expect(leaving.index).toBe(0);
    expect(reduceStation(leaving, { type: 'maneuver-done' })).toEqual(INITIAL_STATION);
  });

  it('only opens from idle', () => {
    expect(reduceStation(parked, { type: 'open', index: 1 })).toBe(parked);
    expect(reduceStation(open, { type: 'open', index: 1 })).toBe(open);
  });

  it('remembers the move asked for while backing out, and hands it over at the end', () => {
    const leaving = reduceStation(parked, { type: 'close', pending: { kind: 'dir', dir: 1 } });
    expect(leaving.pending).toEqual({ kind: 'dir', dir: 1 });
    const done = reduceStation(leaving, { type: 'maneuver-done' });
    expect(done.phase).toBe('idle');
    expect(done.pending).toEqual({ kind: 'dir', dir: 1 });
    const jump = reduceStation(parked, { type: 'close', pending: { kind: 'go', index: 4 } });
    expect(reduceStation(jump, { type: 'maneuver-done' }).pending).toEqual({
      kind: 'go',
      index: 4,
    });
  });

  it('can leave halfway through turning in, and ignores close when idle or already leaving', () => {
    expect(reduceStation(open, { type: 'close' }).phase).toBe('backing-out');
    expect(reduceStation(INITIAL_STATION, { type: 'close' })).toBe(INITIAL_STATION);
    const leaving = reduceStation(parked, { type: 'close' });
    expect(reduceStation(leaving, { type: 'close' })).toBe(leaving);
  });

  it('ignores a finished manoeuvre when there is none, or when parked', () => {
    expect(reduceStation(INITIAL_STATION, { type: 'maneuver-done' })).toBe(INITIAL_STATION);
    expect(reduceStation(parked, { type: 'maneuver-done' })).toBe(parked);
  });

  it('knows which phases are manoeuvres', () => {
    const phases: StationState['phase'][] = ['idle', 'turning-in', 'parked', 'backing-out'];
    expect(phases.map(isManeuvering)).toEqual([false, true, false, true]);
  });
});

describe('timing', () => {
  it('turns in within two seconds and backs out in one to two', () => {
    expect(TURN_IN_SECONDS).toBeLessThanOrEqual(2);
    expect(BACK_OUT_SECONDS).toBeGreaterThanOrEqual(1);
    expect(BACK_OUT_SECONDS).toBeLessThanOrEqual(2);
  });

  it('advances progress by dt over the duration, and jumps to the end under reduced motion', () => {
    expect(advanceManeuver(0, 0.5, 2, false)).toBeCloseTo(0.25, 10);
    expect(advanceManeuver(0.9, 0.5, 2, false)).toBe(1);
    expect(advanceManeuver(0, 0.016, 2, true)).toBe(1);
  });
});

describe('offsetT', () => {
  it('turns metres along the road into a change in t', () => {
    expect(offsetT(0.081, -20, 1000)).toBeCloseTo(0.061, 10);
    expect(offsetT(0.5, 0, 1000)).toBe(0.5);
  });
});

describe('lightIsRed', () => {
  const light = 0.063;
  const stop = 0.081;
  it('is green far before, red from just before the light until a little past the stop', () => {
    expect(lightIsRed(light - RED_APPROACH - 0.001, light, stop)).toBe(false);
    expect(lightIsRed(light - RED_APPROACH, light, stop)).toBe(true);
    expect(lightIsRed(light, light, stop)).toBe(true);
    expect(lightIsRed(stop + RED_AFTER, light, stop)).toBe(true);
    expect(lightIsRed(stop + RED_AFTER + 0.001, light, stop)).toBe(false);
  });
  it('stays red for as long as the car is in the station', () => {
    expect(lightIsRed(0.5, light, stop, 'parked')).toBe(true);
    expect(lightIsRed(0.5, light, stop, 'turning-in')).toBe(true);
    expect(lightIsRed(0.5, light, stop, 'backing-out')).toBe(true);
  });
});

describe('stationGlow', () => {
  it('ramps up while turning in, holds while parked and ramps down backing out', () => {
    expect(stationGlow('idle', 0.5)).toBe(0);
    expect(stationGlow('turning-in', 0)).toBe(0);
    expect(stationGlow('turning-in', 0.4)).toBe(0.4);
    expect(stationGlow('parked', 0)).toBe(1);
    expect(stationGlow('backing-out', 0)).toBe(1);
    expect(stationGlow('backing-out', 0.75)).toBe(0.25);
    expect(stationGlow('turning-in', 2)).toBe(1);
  });
});
