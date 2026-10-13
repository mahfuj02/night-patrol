import { clamp01 } from './route';

/** How far before a stop (in route `t`) a landmark starts to light up. About 55 m on this route. */
export const GLOW_APPROACH = 0.05;
/** Within this of the stop, the landmark is fully lit. */
export const GLOW_HOLD = 0.004;
/** How far after the stop the light takes to fade out again. */
export const GLOW_RELEASE = 0.03;

const smoothstep = (x: number) => {
  const k = clamp01(x);
  return k * k * (3 - 2 * k);
};

/**
 * How lit a landmark is, 0 to 1, for route progress `t` and the `t` of its stop. It eases up as the
 * car approaches, holds at the stop, and eases back down after it. Under reduced motion there is no
 * ramp: it is fully lit at the stop and off everywhere else (a cut, not a fade).
 */
export function landmarkGlow(t: number, stopT: number, reducedMotion = false): number {
  const distance = t - stopT;
  if (reducedMotion) return Math.abs(distance) <= GLOW_HOLD * 2 ? 1 : 0;
  if (distance < 0) {
    return smoothstep((distance + GLOW_APPROACH) / (GLOW_APPROACH - GLOW_HOLD));
  }
  return 1 - smoothstep((distance - GLOW_HOLD) / (GLOW_RELEASE - GLOW_HOLD));
}
