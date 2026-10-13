/**
 * Where the camera should lean toward while a landmark is lit. Written by the lit landmark each
 * frame (the strongest glow wins) and read, then reset, by the camera rig. A plain mutable object
 * keeps per-frame updates out of React state.
 */
export const landmarkFocus = { x: 0, y: 0, z: 0, glow: 0 };

/** How far the look-at point is pulled toward the landmark at full glow, 0 to 1. */
export const FOCUS_PULL = 0.15;

/** Offers a landmark as the focus for this frame; it only takes effect if it glows the most. */
export function offerFocus(x: number, y: number, z: number, glow: number): void {
  if (glow <= landmarkFocus.glow) return;
  landmarkFocus.x = x;
  landmarkFocus.y = y;
  landmarkFocus.z = z;
  landmarkFocus.glow = glow;
}

/** Clears the focus for the next frame. */
export function resetFocus(): void {
  landmarkFocus.glow = 0;
}
