import { beforeEach, describe, expect, it } from 'vitest';
import { stops } from '@/content';
import { STOP_TS, useDriveStore } from './drive';

const state = () => useDriveStore.getState();

describe('drive store', () => {
  beforeEach(() => {
    state().goToStop(0);
  });

  it('starts at the first stop', () => {
    expect(state().target).toBe(0);
    expect(state().stopIndex).toBe(0);
    expect(state().atStop).toBe(true);
  });

  it('exposes stop positions in order', () => {
    expect(STOP_TS).toEqual(stops.map((s) => s.t));
  });

  it('nudges and clamps progress', () => {
    state().nudge(0.01);
    expect(state().target).toBeCloseTo(0.01, 10);
    state().nudge(-1);
    expect(state().target).toBe(0);
    state().nudge(5);
    // The drive ends at the last stop (the road runs a little past it, for the roundabout).
    expect(state().target).toBe(STOP_TS[STOP_TS.length - 1]);
    expect(state().stopIndex).toBe(stops.length - 1);
  });

  it('reports en route between stops', () => {
    const mid = (STOP_TS[1]! + STOP_TS[2]!) / 2;
    state().nudge(mid);
    expect(state().atStop).toBe(false);
  });

  it('steps to the next and previous stop', () => {
    state().next();
    expect(state().stopIndex).toBe(1);
    expect(state().target).toBe(STOP_TS[1]);
    expect(state().atStop).toBe(true);
    state().next();
    expect(state().stopIndex).toBe(2);
    state().prev();
    expect(state().stopIndex).toBe(1);
  });

  it('does not step past either end', () => {
    state().prev();
    expect(state().stopIndex).toBe(0);
    state().goToStop(stops.length - 1);
    state().next();
    expect(state().stopIndex).toBe(stops.length - 1);
  });

  it('ignores an unknown stop index', () => {
    state().goToStop(99);
    expect(state().stopIndex).toBe(0);
  });
});
