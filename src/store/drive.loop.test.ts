import { beforeEach, describe, expect, it } from 'vitest';
import { progress } from '@/lib/driveProgress';
import { stepLoop } from '@/lib/loopDrive';
import { MAGNETS, START_S, patrolLoop as loop } from '@/lib/patrolLoop';
import { UTURN_RUN } from '@/lib/uturn';
import { useDriveStore } from './drive';
import { arriveAt, placeCar, resetDrive } from './driveTestUtils';

const state = () => useDriveStore.getState();
const DT = 1 / 30;

/**
 * Drives the store and the car for real, frame by frame, the way the scene does: the same step
 * (`stepLoop`), the same U-turn landing, the same lap count. Counts U-turns and reverses.
 */
function simulate(options: {
  seconds: number;
  /** Called before each frame with the time, to press things. */
  input?: (t: number, frame: number) => void;
  reducedMotion?: boolean;
  /** Stop early when this returns true. */
  until?: () => boolean;
}) {
  const log = { turns: 0, reverses: 0, frames: 0, kinds: new Set<string>(), maxBack: 0 };
  let lastKind = loop.where(progress.s).piece.kind;
  const frames = Math.round(options.seconds / DT);
  for (let frame = 0; frame < frames; frame++) {
    options.input?.(frame * DT, frame);
    const store = state();
    if (store.turnRequest) {
      // The scene turns the car round: the same lap, the other lane, a run further on.
      const here = loop.wrap(progress.s);
      const landing = loop.landing(here, UTURN_RUN);
      if (landing !== null) {
        progress.s = progress.s - here + landing;
        log.turns++;
      }
      progress.speed = 0;
      store.finishTurn(progress.s);
    } else {
      const before = progress.s;
      const step = stepLoop(loop, {
        s: before,
        speed: progress.speed,
        target: store.target,
        dt: DT,
        reducedMotion: options.reducedMotion ?? false,
        owned: false,
        magnets: MAGNETS,
      });
      progress.s = step.s;
      progress.speed = step.speed;
      store.setArc(step.onArc);
      if (step.s < before - 1e-9) {
        log.reverses++;
        log.maxBack = Math.max(log.maxBack, before - step.s);
      }
      const kind = loop.where(step.s).piece.kind;
      if (lastKind === 'start' && kind === 'out') store.completeLap();
      lastKind = kind;
      log.kinds.add(kind);
    }
    log.frames++;
    if (options.until?.()) break;
  }
  return log;
}

describe('driving the patrol loop', () => {
  beforeEach(resetDrive);

  it('forward input alone drives a full loop and comes back out, with no turns and no reversing', () => {
    // A visitor scrolls on at a steady pace and never scrolls back.
    const log = simulate({
      seconds: 600,
      input: (_t, frame) => {
        if (frame % 6 === 0) state().nudge(0.02);
      },
      until: () => progress.s - START_S > loop.length + 100,
    });
    expect(log.turns).toBe(0);
    expect(log.reverses).toBe(0);
    // Out along the road, round The Forks, back along the road, round the turnaround, out again.
    expect([...log.kinds].sort()).toEqual(['back', 'forks', 'out', 'start']);
    expect(state().laps).toBe(1);
    expect(loop.where(progress.s).piece.kind).toBe('out');
    expect(loop.direction(progress.s)).toBe(1);
  });

  it('Next stop alone also drives round and round, for ever', () => {
    let presses = 0;
    simulate({
      seconds: 3000,
      input: (_t, frame) => {
        // Press Next stop whenever the car has reached the stop it was sent to.
        if (frame % 15 === 0 && Math.abs(progress.s - state().target) < 1) {
          state().next();
          presses++;
        }
      },
      until: () => presses >= 45,
    });
    expect(state().laps).toBeGreaterThanOrEqual(2);
    expect(progress.s - START_S).toBeGreaterThan(2 * loop.length);
  });

  it('jittery back-and-forth input never turns the car round', () => {
    // A nervous trackpad: forward, back, forward... for a long time, from mid-road.
    arriveAt(4, 1);
    let seed = 7;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    const start = progress.s;
    const log = simulate({
      seconds: 120,
      input: () => {
        const r = random();
        if (r < 0.4) state().nudge(0.01 + random() * 0.03);
        else if (r < 0.7) state().nudge(-(0.005 + random() * 0.02));
        else if (r < 0.75) state().brake();
        expect(state().turnRequest).toBe(false);
      },
    });
    expect(log.turns).toBe(0);
    expect(log.reverses).toBe(0);
    // The car only ever went forward.
    expect(progress.s).toBeGreaterThanOrEqual(start);
  });

  it('Turn around turns the car round exactly once, and it then faces the other way, stopped', () => {
    arriveAt(5, 1);
    const before = loop.wrap(progress.s);
    state().turnAround();
    expect(state().turnRequest).toBe(true);
    // Pressing it again while turning does nothing more.
    state().turnAround();
    const log = simulate({ seconds: 5 });
    expect(log.turns).toBe(1);
    expect(state().turnRequest).toBe(false);
    expect(state().direction).toBe(-1);
    expect(loop.direction(progress.s)).toBe(-1);
    // The same road, a little further on, in the other lane (the stop's magnet may settle it).
    expect(
      Math.abs(loop.roadMetres(progress.s) - (loop.roadMetres(before) + UTURN_RUN)),
    ).toBeLessThan(12);
    // It sits still until driven on, and then goes the way it now faces.
    const at = progress.s;
    simulate({ seconds: 3 });
    expect(progress.s).toBeCloseTo(at, 3);
    state().nudge(0.03);
    simulate({ seconds: 4 });
    expect(progress.s).toBeGreaterThan(at);
    expect(loop.direction(progress.s)).toBe(-1);
  });

  it('Turn around twice turns it round and back again, once each', () => {
    arriveAt(6, 1);
    state().turnAround();
    expect(simulate({ seconds: 2 }).turns).toBe(1);
    state().turnAround();
    expect(simulate({ seconds: 2 }).turns).toBe(1);
    expect(loop.direction(progress.s)).toBe(1);
  });

  it('cannot turn round on a roundabout, or while starting over', () => {
    placeCar(loop.pieces[1]!.from + 30);
    state().setArc(true);
    state().turnAround();
    expect(state().turnRequest).toBe(false);
    placeCar(loop.outS(300));
    state().setArc(false);
    state().startOver();
    state().turnAround();
    expect(state().turnRequest).toBe(false);
  });

  it('brakes to a stop and holds there', () => {
    arriveAt(3, 1);
    simulate({
      seconds: 4,
      input: (_t, frame) => {
        if (frame % 6 === 0) state().nudge(0.01);
      },
    });
    expect(progress.speed).toBeGreaterThan(3);
    state().brake();
    expect(state().braked).toBe(true);
    simulate({ seconds: 4 });
    expect(progress.speed).toBeLessThan(0.05);
    const at = progress.s;
    simulate({ seconds: 2 });
    expect(progress.s).toBeCloseTo(at, 6);
    expect(state().braked).toBe(true);
  });

  it('brakes nothing on a roundabout: the car drives itself round', () => {
    placeCar(loop.pieces[1]!.from + 20);
    simulate({ seconds: 0.1 });
    expect(state().arc).toBe(true);
    const before = state().target;
    state().brake();
    expect(state().braked).toBe(false);
    expect(state().target).toBe(before);
    const start = progress.s;
    simulate({ seconds: 2 });
    expect(progress.s).toBeGreaterThan(start + 10);
  });

  it('drives round the roundabouts by itself, then on to where it was sent', () => {
    arriveAt(9, 1);
    state().next(); // The Forks
    simulate({ seconds: 60, until: () => Math.abs(progress.s - state().target) < 0.5 });
    expect(state().stopIndex).toBe(10);
    state().next(); // heading back: through the ring first
    const log = simulate({
      seconds: 120,
      until: () => Math.abs(progress.s - state().target) < 0.5,
    });
    expect(log.kinds.has('forks')).toBe(true);
    expect(state().direction).toBe(-1);
    expect(state().stopIndex).toBe(9);
  });

  it('cuts across the roundabouts under reduced motion, still all the way round the loop', () => {
    const log = simulate({
      seconds: 300,
      reducedMotion: true,
      input: (_t, frame) => {
        if (frame % 4 === 0) state().nudge(0.05);
      },
      until: () => progress.s - START_S > loop.length + 100,
    });
    expect(log.turns).toBe(0);
    expect(log.reverses).toBe(0);
    expect([...log.kinds].sort()).toEqual(['back', 'forks', 'out', 'start']);
    expect(state().laps).toBe(1);
  });

  it('jumps to a stop by turning round once, then driving there', () => {
    arriveAt(8, 1);
    state().goToStop(2);
    const log = simulate({
      seconds: 60,
      until: () => !state().turnRequest && Math.abs(progress.s - state().target) < 0.5,
    });
    expect(log.turns).toBe(1);
    expect(log.reverses).toBe(0);
    expect(state().stopIndex).toBe(2);
    expect(state().direction).toBe(-1);
    expect(state().atStop).toBe(true);
  });

  it('jumps to a stop by driving on, with no turn at all', () => {
    arriveAt(2, 1);
    state().goToStop(8);
    const log = simulate({
      seconds: 60,
      until: () => Math.abs(progress.s - state().target) < 0.5,
    });
    expect(log.turns).toBe(0);
    expect(state().stopIndex).toBe(8);
    expect(state().direction).toBe(1);
  });
});

describe('starting over', () => {
  beforeEach(resetDrive);

  it('fades out, cuts back to the first stop heading out, and fades in', () => {
    arriveAt(7, -1);
    state().startOver();
    expect(state().shift).toBe('fading-out');
    state().completeFadeOut();
    expect(state().shift).toBe('fading-in');
    expect(state().resetCount).toBe(1);
    expect(state().target).toBe(START_S);
    expect(state().stopIndex).toBe(0);
    expect(state().direction).toBe(1);
    state().finishReset();
    expect(state().shift).toBe('idle');
  });

  it('ignores all driving while it plays', () => {
    arriveAt(4, 1);
    state().startOver();
    const target = state().target;
    state().nudge(0.05);
    state().next();
    state().brake();
    state().turnAround();
    state().goToStop(1);
    expect(state().target).toBe(target);
    expect(state().turnRequest).toBe(false);
  });

  it('is not offered from a station, and does nothing there', () => {
    arriveAt(2, 1);
    state().openStation();
    state().startOver();
    expect(state().shift).toBe('idle');
  });

  it('only completes a fade that is under way', () => {
    state().completeFadeOut();
    expect(state().shift).toBe('idle');
    expect(state().resetCount).toBe(0);
    state().finishReset();
    expect(state().shift).toBe('idle');
  });
});
