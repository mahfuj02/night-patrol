import { describe, expect, it } from 'vitest';
import {
  TOP_ROAD_SPEED,
  accelAt,
  decelAt,
  stepLoop,
  stoppingDistance,
  wantedSpeed,
} from './loopDrive';
import { createLoop } from './loopRoute';

const loop = createLoop({ road: 1000, startRun: 10, forksRun: 14, startArc: 100, forksArc: 150 });
const DT = 1 / 60;

/** Drives from `s0` toward a target that may move, recording every step. */
function drive(
  s0: number,
  target: (t: number) => number,
  seconds: number,
  options: { reducedMotion?: boolean } = {},
) {
  let s = s0;
  let speed = 0;
  const speeds: number[] = [];
  const places: number[] = [];
  for (let t = 0; t < seconds; t += DT) {
    const step = stepLoop(loop, {
      s,
      speed,
      target: target(t),
      dt: DT,
      reducedMotion: options.reducedMotion ?? false,
      owned: false,
      magnets: [],
    });
    s = step.s;
    speed = step.speed;
    speeds.push(speed);
    places.push(s);
  }
  return { s, speed, speeds, places };
}

describe('the road step', () => {
  it('wants to stop in the distance it has: never faster than it can brake', () => {
    expect(wantedSpeed(0)).toBe(0);
    expect(wantedSpeed(-5)).toBe(0);
    for (const d of [0.5, 2, 10, 40, 200, 1000]) {
      expect(stoppingDistance(wantedSpeed(d))).toBeLessThanOrEqual(d + 1e-9);
    }
    expect(wantedSpeed(5000)).toBeLessThanOrEqual(TOP_ROAD_SPEED);
    expect(wantedSpeed(1000)).toBeGreaterThan(wantedSpeed(60));
  });

  it('speeds up and slows down smoothly: the speed never jumps, whatever the request does', () => {
    // A jump of 400 m, then a scroll-like creep, then another jump.
    const target = (t: number) => (t < 1 ? 400 : t < 4 ? 400 + (t - 1) * 60 : 900);
    const { speeds } = drive(20, target, 40);
    let previous = 0;
    for (const v of speeds) {
      expect(v - previous).toBeLessThanOrEqual(accelAt(previous) * DT + 1e-9);
      // (the last few centimetres a second of creep come to rest at once, which nobody can see)
      if (previous > 0.5) expect(previous - v).toBeLessThanOrEqual(decelAt(previous) * DT + 1e-9);
      previous = v;
    }
  });

  it('arrives at the target without overshooting it, and rests there', () => {
    const { s, speed, places } = drive(20, () => 300, 60);
    expect(s).toBeCloseTo(300, 2);
    expect(speed).toBe(0);
    expect(Math.max(...places)).toBeLessThanOrEqual(300 + 1e-9);
  });

  it('starts from rest and never goes backwards', () => {
    const { places } = drive(20, () => 120, 30);
    for (let i = 1; i < places.length; i++)
      expect(places[i]!).toBeGreaterThanOrEqual(places[i - 1]!);
  });

  it('eases off before the stop, not at it', () => {
    const { speeds, places } = drive(20, () => 200, 40);
    const near = places.findIndex((p) => p > 200 - 3);
    expect(speeds[near]!).toBeLessThan(speeds[Math.floor(near / 2)]!);
  });

  it('goes faster for a long way than a short one', () => {
    const far = Math.max(...drive(20, () => 900, 30).speeds);
    const near = Math.max(...drive(20, () => 120, 30).speeds);
    expect(far).toBeGreaterThan(near);
  });

  it('cuts to the target under reduced motion', () => {
    const { s } = drive(20, () => 300, 0.1, { reducedMotion: true });
    expect(s).toBeCloseTo(300, 6);
  });

  it('stops short of a roundabout at its mouth, then drives it', () => {
    const { places } = drive(900, () => 1200, 1);
    expect(Math.max(...places)).toBeLessThanOrEqual(loop.pieces[1]!.from + 1e-6);
  });
});
