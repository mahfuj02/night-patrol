import { beforeEach, describe, expect, it } from 'vitest';
import { stations, stops } from '@/content';
import { progress } from '@/lib/driveProgress';
import { patrolLoop as loop, MAGNETS } from '@/lib/patrolLoop';
import { INITIAL_STATION } from '@/lib/station';
import { useDriveStore } from './drive';
import { arriveAt, placeCar, resetDrive, visitOf } from './driveTestUtils';

const state = () => useDriveStore.getState();
const EDU = 0;
const RRC = stops.findIndex((s) => s.id === stations[EDU]!.stopId);
const lights = MAGNETS.filter((m) => m.kind === 'light' && m.ref === EDU);

describe('station magnets', () => {
  it('puts a red light before the stop in each direction: both sides of the stop', () => {
    expect(lights).toHaveLength(2);
    const out = lights.find((l) => l.direction === 1)!;
    const back = lights.find((l) => l.direction === -1)!;
    const stopOut = visitOf(RRC, 1).s;
    const stopBack = visitOf(RRC, -1).s;
    // About 20 m before the stop along the way the car is going, as the content says.
    expect(loop.ahead(out.s, stopOut)).toBeCloseTo(20, 6);
    expect(loop.ahead(back.s, stopBack)).toBeCloseTo(20, 6);
    // On the road that is before the stop heading out, and past it heading back.
    expect(loop.roadMetres(out.s)).toBeLessThan(loop.roadMetres(stopOut));
    expect(loop.roadMetres(back.s)).toBeGreaterThan(loop.roadMetres(stopBack));
  });

  it('keeps every magnet point in loop order, with a stop for each visit', () => {
    const order = MAGNETS.map((m) => m.s);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    const stopCount = MAGNETS.filter((m) => m.kind === 'stop').length;
    expect(stopCount).toBe(stops.length + (stops.length - 2));
  });
});

describe('opening a station', () => {
  beforeEach(resetDrive);

  it('can be opened at the red light and at the stop, and not elsewhere, in either direction', () => {
    expect(state().openable).toBeNull();
    for (const direction of [1, -1] as const) {
      const light = lights.find((l) => l.direction === direction)!;
      placeCar(light.s);
      expect(state().atLight).toBe(EDU);
      expect(state().openable).toBe(EDU);
      expect(state().atStop).toBe(false);
      expect(state().direction).toBe(direction);
      arriveAt(RRC, direction);
      expect(state().atLight).toBeNull();
      expect(state().atStop).toBe(true);
      expect(state().openable).toBe(EDU);
      arriveAt(RRC + 1, direction);
      expect(state().openable).toBeNull();
    }
  });

  it('opens only when something is openable', () => {
    state().openStation();
    expect(state().station.phase).toBe('idle');
    arriveAt(RRC, -1);
    state().openStation();
    expect(state().station).toEqual({
      phase: 'turning-in',
      index: EDU,
      pending: { kind: 'none' },
    });
  });

  it('goes turning in, parked, backing out and back to idle as the scene reports', () => {
    arriveAt(RRC);
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
    resetDrive();
    arriveAt(RRC);
    state().openStation();
  });

  it('ignores movement while the car turns in', () => {
    const before = state().target;
    state().nudge(0.05);
    state().next();
    state().brake();
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

  it('backs out and stays on the road for brake, and drives on for a forward nudge', () => {
    state().finishManeuver();
    state().brake();
    expect(state().station.pending).toEqual({ kind: 'dir', dir: -1 });
    state().finishManeuver();
    expect(state().stopIndex).toBe(RRC);
    expect(state().braked).toBe(true);
    expect(state().target).toBeCloseTo(progress.s, 0);

    arriveAt(RRC);
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

  it('does not turn round or start over from the bay', () => {
    state().finishManeuver();
    state().turnAround();
    state().startOver();
    expect(state().station.phase).toBe('parked');
    expect(state().turnRequest).toBe(false);
    expect(state().shift).toBe('idle');
  });
});

describe('wall legibility', () => {
  beforeEach(resetDrive);
  it('remembers whether the wall is big enough to read, and resets when the car leaves', () => {
    state().setWallLegible(false);
    expect(state().wallLegible).toBe(false);
    state().setWallLegible(false);
    arriveAt(RRC);
    state().openStation();
    state().finishManeuver();
    state().closeStation();
    state().finishManeuver();
    expect(state().wallLegible).toBe(true);
  });
});
