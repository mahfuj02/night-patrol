/** How long the view takes to fade to black and back at the end of the shift, in milliseconds. */
export const SHIFT_FADE_MS = 800;

/**
 * The longest the roundabout lap may take before the shift moves on anyway, in milliseconds. A lap
 * takes about ten seconds of animation, but a slow machine draws fewer frames, so this is generous.
 */
export const LOOP_MAX_MS = 70_000;
