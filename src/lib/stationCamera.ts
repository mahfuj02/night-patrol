/** Maths for framing a lit wall and deciding whether its text is big enough to read. */

/** The width, in CSS pixels, that wall content is laid out at before it is projected onto the wall. */
export const WALL_DESIGN_WIDTH = 720;
/** Below this on-screen scale (projected width over design width) the wall text is too small. */
export const MIN_WALL_SCALE = 0.75;

/**
 * The least distance from the wall plane at which a `rectWidth` by `rectHeight` rectangle still fits
 * the view, with a margin, for a vertical field of view in degrees and a screen aspect ratio
 * (width over height). A wide screen is limited by the height, a tall phone by the width.
 */
export function fitDistance(
  rectWidth: number,
  rectHeight: number,
  verticalFovDeg: number,
  aspect: number,
  margin = 1.12,
): number {
  const halfV = Math.tan((verticalFovDeg * Math.PI) / 360);
  const halfH = halfV * Math.max(aspect, 0.01);
  return Math.max((rectHeight * margin) / 2 / halfV, (rectWidth * margin) / 2 / halfH);
}

/**
 * Whether wall content is readable: the wall shows at a scale of at least `MIN_WALL_SCALE`, and it
 * is not wider than the screen (which would crop it).
 */
export function isWallLegible(
  projectedWidth: number,
  designWidth: number,
  viewportWidth: number,
): boolean {
  if (designWidth <= 0 || viewportWidth <= 0) return false;
  return projectedWidth / designWidth >= MIN_WALL_SCALE && projectedWidth <= viewportWidth * 1.02;
}
