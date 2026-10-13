/** Hash of an integer lattice point to [0, 1). Deterministic. */
function hash(i: number, seed: number): number {
  const h = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
  return h - Math.floor(h);
}

/**
 * Smooth 1D value noise in [0, 1): random values at integer positions, blended with a smoothstep.
 * Used for gentle lumpy variation along the road (snow ridge height and width).
 */
export function noise1(x: number, seed = 0): number {
  const i = Math.floor(x);
  const f = x - i;
  const t = f * f * (3 - 2 * f);
  return hash(i, seed) * (1 - t) + hash(i + 1, seed) * t;
}
