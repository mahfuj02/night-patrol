import type { UTurnPath } from '@/lib/uturn';

/**
 * The U-turn the car is in the middle of, if any. A plain mutable object, written by the progress
 * and U-turn drivers and read by them, so nothing here goes through React state. `p` runs 0 to 1
 * along `path`; `toS` is where on the loop (wrapped) the car comes out of it, in the other lane.
 */
export const travel: {
  turn: { p: number; toS: number; path: UTurnPath } | null;
} = { turn: null };
