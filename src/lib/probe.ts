/**
 * Reads `?probe=on` from a URL query string. It makes the scene write the car's position to the
 * page (`document.body.dataset.car`) so the end-to-end tests can check where the car really goes;
 * nothing else changes, and visitors never see it.
 */
export function parseProbeParam(search: string): boolean {
  return new URLSearchParams(search).get('probe') === 'on';
}

/** The text written for a car pose: "x,z,heading" with a few decimals. */
export function formatCarPose(x: number, z: number, heading: number): string {
  return [x, z, heading].map((n) => n.toFixed(3)).join(',');
}
