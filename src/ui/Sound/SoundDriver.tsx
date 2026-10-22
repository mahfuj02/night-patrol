'use client';

import { useEffect } from 'react';
import { stops } from '@/content/stops';
import { nextWiper } from '@/audio/mapping';
import { progress } from '@/lib/driveProgress';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useDriveStore } from '@/store/drive';
import { useSoundStore } from '@/store/sound';

/** How often the car's speed is sent to the audio, in milliseconds. */
const SPEED_INTERVAL_MS = 100;

/**
 * Runs the car's sound while the visitor has it on. Headless. It does nothing at all until sound is on
 * AND the visitor has done something in the page (a saved "on" never starts audio by itself), and the
 * audio code is loaded only then (a dynamic import, so it stays out of the first load). The engine and
 * tyres follow the car's speed, a blip plays as a radio line comes in, and the wipers swish with the
 * cabin animation (not under reduced motion).
 */
export function SoundDriver() {
  const enabled = useSoundStore((s) => s.enabled);
  const unlocked = useSoundStore((s) => s.unlocked);
  const reducedMotion = useReducedMotion();

  // The first click, tap or key press counts as the gesture browsers want before audio may start.
  useEffect(() => {
    if (unlocked) return;
    const unlock = () => useSoundStore.getState().unlock();
    const events = ['pointerdown', 'keydown', 'touchend'] as const;
    for (const name of events) window.addEventListener(name, unlock, { once: true });
    return () => {
      for (const name of events) window.removeEventListener(name, unlock);
    };
  }, [unlocked]);

  useEffect(() => {
    if (!enabled || !unlocked) return;
    let cancelled = false;
    let dispose: (() => void) | undefined;

    void import('@/audio/engine').then(({ createEngine }) => {
      if (cancelled) return;
      const Context =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Context) return;
      const ctx = new Context();
      void ctx.resume();
      const engine = createEngine(ctx);

      const speedTimer = window.setInterval(
        () => engine.setSpeed(progress.speed),
        SPEED_INTERVAL_MS,
      );

      // A blip when the car arrives at a stop that has a radio line, either way round.
      const unsubscribe = useDriveStore.subscribe((state, previous) => {
        if (!state.atStop || (previous.atStop && previous.stopIndex === state.stopIndex)) return;
        const stop = stops[state.stopIndex];
        if (stop?.radioId || stop?.radioReturn) engine.blip();
      });

      // The wipers: one swish per cabin sweep.
      let wiperTimer: number | undefined;
      const started = performance.now();
      const scheduleWiper = () => {
        const wait = nextWiper((performance.now() - started) / 1000);
        wiperTimer = window.setTimeout(
          () => {
            engine.wipe();
            scheduleWiper();
          },
          wait * 1000 + 50,
        );
      };
      if (!reducedMotion) scheduleWiper();

      dispose = () => {
        window.clearInterval(speedTimer);
        window.clearTimeout(wiperTimer);
        unsubscribe();
        engine.dispose();
      };
    });

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [enabled, unlocked, reducedMotion]);

  return null;
}
