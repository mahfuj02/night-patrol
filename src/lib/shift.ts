/** How long the view takes to fade to black and back at the end of the shift, in milliseconds. */
export const SHIFT_FADE_MS = 800;

/**
 * How long the roundabout lap may go without the scene advancing it before the shift moves on
 * anyway, in milliseconds. The scene ticks the lap every frame it draws, so this only fires if the
 * scene has stopped drawing altogether. It is a stall limit, not a time limit: a slow machine that
 * draws few frames still finishes its lap.
 */
export const LOOP_STALL_MS = 30_000;
