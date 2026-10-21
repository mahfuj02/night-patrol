import { beforeEach, describe, expect, it } from 'vitest';
import { stops } from '@/content';
import { progress } from '@/lib/driveProgress';
import { STOP_VISITS, START_S, patrolLoop as loop } from '@/lib/patrolLoop';
import { LEASH_METRES, useDriveStore } from './drive';
import { arriveAt, placeCar, resetDrive, visitOf } from './driveTestUtils';

const state = () => useDriveStore.getState();
const LAST = stops.length - 1;

describe('drive store', () => {
  beforeEach(resetDrive);

  it('starts at the first stop, heading out', () => {
    expect(state().target).toBe(START_S);
    expect(state().stopIndex).toBe(0);
    expect(state().atStop).toBe(true);
    expect(state().direction).toBe(1);
    expect(state().braked).toBe(false);
  });

  it('visits every stop heading out and all but the first and last again heading back', () => {
    const out = STOP_VISITS.filter((v) => v.direction === 1).map((v) => v.stop);
    const back = STOP_VISITS.filter((v) => v.direction === -1).map((v) => v.stop);
    expect(out).toEqual(stops.map((_, i) => i));
    expect(back).toEqual(
      stops
        .map((_, i) => i)
        .filter((i) => i !== 0 && i !== LAST)
        .reverse(),
    );
    expect(stops[0]!.onReturn).toBe(false);
    expect(stops[LAST]!.onReturn).toBe(false);
  });

  it('drives on with a forward nudge, and the leash keeps it from running away', () => {
    state().nudge(0.05);
    expect(state().target).toBeCloseTo(START_S + 0.05 * loop.spec.road, 6);
    expect(state().atStop).toBe(false);
    state().nudge(5);
    expect(state().target).toBeCloseTo(progress.s + LEASH_METRES, 6);
    // Another nudge never pulls it back.
    const was = state().target;
    state().nudge(0.001);
    expect(state().target).toBe(was);
  });

  it('brakes on a backward nudge: the request comes back to the car, which never reverses', () => {
    state().nudge(0.1);
    progress.speed = 10;
    state().nudge(-0.01);
    expect(state().target).toBeGreaterThanOrEqual(progress.s);
    expect(state().target).toBeLessThan(progress.s + 5);
    expect(state().braked).toBe(true);
    // Driving on again clears it.
    state().nudge(0.01);
    expect(state().braked).toBe(false);
  });

  it('does nothing for a zero nudge', () => {
    const before = state().target;
    state().nudge(0);
    expect(state().target).toBe(before);
  });

  it('reports en route between stops', () => {
    placeCar((visitOf(1).s + visitOf(2).s) / 2);
    expect(state().atStop).toBe(false);
    expect(state().direction).toBe(1);
  });

  it('knows which way it is heading at a stop on the way back', () => {
    arriveAt(5, -1);
    expect(state().atStop).toBe(true);
    expect(state().stopIndex).toBe(5);
    expect(state().direction).toBe(-1);
  });

  it('steps to the next stop, in loop order: out to The Forks, then back, then out again', () => {
    const seen: { stop: number; direction: number }[] = [];
    for (let i = 0; i < STOP_VISITS.length; i++) {
      state().next();
      progress.s = state().target;
      expect(state().atStop).toBe(true);
      seen.push({ stop: state().stopIndex, direction: state().direction });
    }
    expect(seen.slice(0, LAST)).toEqual(
      stops.slice(1).map((_, i) => ({ stop: i + 1, direction: 1 })),
    );
    // After The Forks the patrol comes back through the city.
    expect(seen[LAST]).toEqual({ stop: LAST - 1, direction: -1 });
    expect(seen[seen.length - 1]).toEqual({ stop: 0, direction: 1 });
    // A full loop of visits later it is back where it started, a lap on.
    expect(state().target - START_S).toBeCloseTo(loop.length, 6);
  });

  it('goes to a stop ahead by driving on', () => {
    state().goToStop(5);
    expect(state().stopIndex).toBe(5);
    expect(state().turnRequest).toBe(false);
    expect(state().target).toBeCloseTo(progress.s + loop.ahead(progress.s, visitOf(5).s), 6);
    expect(state().direction).toBe(1);
  });

  it('goes to a stop behind by turning round once when that is shorter than driving the loop', () => {
    arriveAt(8, 1); // Dashcam, heading out
    state().goToStop(2); // the campus: 600 m back by turning round, much more by the ring
    expect(state().turnRequest).toBe(true);
    expect(state().goal).toBe(visitOf(2, -1).s);
    expect(state().stopIndex).toBe(2);
    // It stays where it is until the scene has turned it round.
    expect(state().target).toBe(progress.s);
  });

  it('drives on round the ring, because it cannot turn round on one', () => {
    placeCar(loop.pieces[1]!.from + 20); // on the Forks roundabout
    state().goToStop(1);
    expect(state().turnRequest).toBe(false);
    expect(state().direction).toBe(-1);
    expect(state().target).toBeGreaterThan(progress.s);
  });

  it('turns round rather than drive the ring and all the way back to the stop it just passed', () => {
    arriveAt(9, 1);
    placeCar(progress.s + 5);
    state().goToStop(9);
    expect(state().turnRequest).toBe(true);
    expect(state().goal).toBe(visitOf(9, -1).s);
  });

  it('turns round at most once for any jump, from anywhere on the road', () => {
    for (const from of STOP_VISITS) {
      for (let to = 0; to < stops.length; to++) {
        placeCar(from.s);
        state().goToStop(to);
        const wasTurning = state().turnRequest;
        if (wasTurning) {
          // The scene turns it round, then drives on: the plan after the turn is a plain drive.
          const landing = loop.landing(loop.wrap(progress.s), 10)!;
          progress.s = progress.s - loop.wrap(progress.s) + landing;
          state().finishTurn(progress.s);
          expect(state().turnRequest).toBe(false);
          expect(state().target).toBeGreaterThanOrEqual(progress.s);
          expect(state().target - progress.s).toBeLessThan(loop.length);
        }
      }
    }
  });

  it('ignores an unknown stop index', () => {
    state().goToStop(99);
    expect(state().stopIndex).toBe(0);
    expect(state().target).toBe(START_S);
  });
});
