import { createRandom, range } from './random';

/** The few canvas calls branch drawing needs, so it can run against a real or a mock context. */
export interface BranchContext {
  lineWidth: number;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  stroke(): void;
}

const MAX_DEPTH = 8;

/**
 * Draws a bare, vase-shaped elm: a forked trunk rising from the bottom centre that splits into
 * ever finer, wide-spreading branches. Original and procedural (no image files). The caller sets
 * the stroke colour; thickness tapers from trunk to twig. Returns the number of segments drawn.
 * Deterministic for a seed.
 */
export function drawBranches(ctx: BranchContext, size: number, seed: number): number {
  const random = createRandom(seed);
  let segments = 0;

  const branch = (
    x: number,
    y: number,
    angle: number,
    length: number,
    width: number,
    depth: number,
  ) => {
    if (depth > MAX_DEPTH || length < size * 0.008) return;
    const x2 = x + Math.sin(angle) * length;
    const y2 = y - Math.cos(angle) * length;
    ctx.lineWidth = Math.max(width, 1);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    segments++;

    // Elms fork low into three or more limbs, then mostly into pairs.
    const children = depth < 2 ? 3 : random() < 0.35 ? 3 : 2;
    for (let i = 0; i < children; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const spread = side * range(random, 0.25, 0.75) + range(random, -0.1, 0.1);
      branch(
        x2,
        y2,
        angle + spread * (depth < 3 ? 1.1 : 1),
        length * range(random, 0.68, 0.84),
        width * 0.66,
        depth + 1,
      );
    }
  };

  branch(size / 2, size, 0, size * 0.2, size * 0.04, 0);
  return segments;
}
