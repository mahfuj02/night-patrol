import { START_S } from './patrolLoop';

/**
 * Where the car is, written once per frame by the scene's ProgressDriver and read by the car, the
 * camera, the lights and the store. A plain mutable object keeps per-frame updates out of React
 * state, and keeps this module free of three.js so the store can read it.
 *
 * `s` is the total distance driven round the patrol loop, in metres (it keeps counting up lap after
 * lap; the loop wraps it). `t` is the same spot as a route position (0 to 1, for the atmosphere, the
 * lamps, the map), `direction` which way along the route the car is heading (1 out, -1 back), and
 * `speed` how fast it is going in metres per second.
 */
export const progress = { s: START_S, t: 0, direction: 1 as 1 | -1, speed: 0 };
