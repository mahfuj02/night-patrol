import { createRandom, range } from './random';

/** The few canvas calls twig drawing needs, so it can run against a real or a mock context. */
export interface TwigContext {
  lineWidth: number;
  globalAlpha: number;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  stroke(): void;
}

const MAX_DEPTH = 4;

/**
 * Draws a sprig of fine twigs for the leafless tips of the trees: a few stems fanning up from the
 * bottom centre that fork into finer and finer twigs. There is no trunk in this picture; the 3D
 * trees carry the trunk and branches as geometry. Each stroke is drawn twice, wide and faint under
 * thin and solid, so the edges are soft instead of hard and pixelated. The caller sets the stroke
 * colour. Returns the number of segments drawn. Deterministic for a seed.
 */
export function drawTwigs(ctx: TwigContext, size: number, seed: number): number {
  const random = createRandom(seed);
  let segments = 0;

  const twig = (
    x: number,
    y: number,
    angle: number,
    length: number,
    width: number,
    depth: number,
  ) => {
    if (depth > MAX_DEPTH) return;
    const x2 = x + Math.sin(angle) * length;
    const y2 = y - Math.cos(angle) * length;
    for (const [factor, alpha] of [
      [2.6, 0.3],
      [1, 1],
    ] as const) {
      ctx.globalAlpha = alpha;
      ctx.lineWidth = Math.max(width * factor, 1);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    segments++;

    const children = depth < 2 ? 3 : 2;
    for (let i = 0; i < children; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      twig(
        x2,
        y2,
        angle + side * range(random, 0.3, 0.8) + range(random, -0.1, 0.1),
        length * range(random, 0.55, 0.72),
        width * 0.62,
        depth + 1,
      );
    }
  };

  const stems = 3 + Math.floor(random() * 3);
  for (let i = 0; i < stems; i++) {
    const angle = ((i + 0.5) / stems - 0.5) * 1.1 + range(random, -0.08, 0.08);
    twig(size / 2, size * 0.97, angle, size * range(random, 0.26, 0.34), size * 0.012, 0);
  }
  ctx.globalAlpha = 1;
  return segments;
}
