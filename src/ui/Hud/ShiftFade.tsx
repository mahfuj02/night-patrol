'use client';

import { useEffect } from 'react';
import { LOOP_STALL_MS, SHIFT_FADE_MS } from '@/lib/shift';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useDriveStore } from '@/store/drive';

/**
 * The end-of-shift fade: a dark veil over the scene that fades in after the roundabout lap, holds
 * while the car is put back at the first stop, and fades out again. It also times out a lap that
 * the scene does not finish. Under reduced motion there is no fade: the view cuts
 * (the veil is never shown). It carries no text (the caption "New patrol starting." is in the radio
 * region) and takes no pointer events, so the page underneath keeps working.
 */
export function ShiftFade() {
  const shift = useDriveStore((s) => s.shift);
  const finishLoop = useDriveStore((s) => s.finishLoop);
  const completeFadeOut = useDriveStore((s) => s.completeFadeOut);
  const finishReset = useDriveStore((s) => s.finishReset);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (shift === 'idle') return;
    if (shift === 'looping') {
      // The roundabout lap is drawn by the scene, which ends it. Under reduced motion there is no
      // lap (a cut). A scene that has stopped drawing must not leave the shift hanging, so the lap
      // is ended if it goes LOOP_STALL_MS without a frame; every frame of the lap restarts the
      // clock, so a slow machine that is still drawing always finishes it.
      if (reducedMotion) {
        const timer = window.setTimeout(finishLoop, 0);
        return () => window.clearTimeout(timer);
      }
      let timer = window.setTimeout(finishLoop, LOOP_STALL_MS);
      const unsubscribe = useDriveStore.subscribe((state, previous) => {
        if (state.loopTicks === previous.loopTicks) return;
        window.clearTimeout(timer);
        timer = window.setTimeout(finishLoop, LOOP_STALL_MS);
      });
      return () => {
        unsubscribe();
        window.clearTimeout(timer);
      };
    }
    const wait = reducedMotion ? 0 : SHIFT_FADE_MS;
    const timer = window.setTimeout(shift === 'fading-out' ? completeFadeOut : finishReset, wait);
    return () => window.clearTimeout(timer);
  }, [shift, reducedMotion, finishLoop, completeFadeOut, finishReset]);

  return (
    <div
      aria-hidden="true"
      data-testid="shift-fade"
      data-shift={shift}
      className="bg-night pointer-events-none fixed inset-0 z-40 transition-opacity ease-in-out motion-reduce:transition-none"
      style={{
        opacity: shift === 'fading-out' ? 1 : 0,
        transitionDuration: `${reducedMotion ? 0 : SHIFT_FADE_MS}ms`,
        // The veil is never shown under reduced motion, where the view cuts.
        visibility: reducedMotion ? 'hidden' : 'visible',
      }}
    />
  );
}
