/**
 * How the car's speed shapes the sound. Pure maths, so it can be tested without an AudioContext.
 * All the audio is synthesised in the browser (oscillators and filtered noise): there are no audio
 * files, so nothing to license and nothing to download.
 */

/** The speed (m/s) where the engine and the tyres reach full level. The car's own top speeds are far higher in a jump. */
export const TOP_SPEED = 30;

const clamp01 = (x: number) => Math.min(1, Math.max(0, Number.isFinite(x) ? x : 0));

/** 0 at rest, 1 at `TOP_SPEED` and above. */
export const speedShare = (speed: number) => clamp01(speed / TOP_SPEED);

/** Engine hum pitch in Hz: a low idle that rises with speed. */
export const engineFrequency = (speed: number) => 48 + 52 * speedShare(speed);

/** Engine level, 0 to 0.12: always a quiet idle while the sound is on. */
export const engineGain = (speed: number) => 0.035 + 0.085 * speedShare(speed);

/** Tyres crunching on snow: silent at rest, rising with speed, 0 to 0.09. */
export const tyreGain = (speed: number) => 0.09 * Math.pow(speedShare(speed), 0.8);

/** The tyre noise gets brighter with speed: low-pass cutoff in Hz. */
export const tyreCutoff = (speed: number) => 500 + 1500 * speedShare(speed);

/** The wipers swish this often, in seconds (matches the cabin animation). */
export const WIPER_PERIOD = 10;
/** Where in the period the swish happens, as seconds from the start. */
export const WIPER_AT = 8.6;

/** Seconds until the next wiper swish after `elapsed` seconds of running. */
export function nextWiper(elapsed: number): number {
  const into = elapsed % WIPER_PERIOD;
  return into <= WIPER_AT ? WIPER_AT - into : WIPER_PERIOD - into + WIPER_AT;
}
