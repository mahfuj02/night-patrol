/**
 * Reads `?intro=off` from a URL query string. It skips the Ignition loading screen (for tests and
 * for linking straight into the drive); anything else, or nothing, shows it.
 */
export function parseIntroParam(search: string): boolean {
  return new URLSearchParams(search).get('intro') !== 'off';
}

/** How long the loading screen waits for the scene before offering Start Patrol anyway, in ms. */
export const INTRO_PATIENCE_MS = 25_000;

/** What the gauge shows for the scene's progress (0 to 100): a whole number, and never backwards. */
export function gaugePercent(progress: number, previous = 0): number {
  const clamped = Math.min(100, Math.max(0, Math.round(progress)));
  return Math.max(clamped, previous);
}

/** The angle of the gauge needle for a percentage: -90 degrees at empty, 90 at full. */
export function needleAngle(percent: number): number {
  return -90 + (Math.min(100, Math.max(0, percent)) / 100) * 180;
}
