'use client';

import { useEffect, type RefObject } from 'react';
import { actionForKey, isInteractiveTarget, type DriveAction } from '@/lib/driveInput';
import { swipeToDelta, wheelToDelta } from '@/lib/route';
import { useDriveStore } from '@/store/drive';

/** Under reduced motion, one wheel or swipe gesture moves one stop, at most this often. */
const STEP_COOLDOWN_MS = 500;
const SWIPE_STEP_PIXELS = 60;

function perform(action: DriveAction) {
  const { nudge, next, brake } = useDriveStore.getState();
  if (action.type === 'nudge') nudge(action.delta);
  else if (action.dir === 1) next();
  else brake();
}

/**
 * Wires wheel, touch and keyboard input to the drive store.
 *
 * - The wheel and touch listeners live on `containerRef` only, never on the window, and they are
 *   passive: they do not block native scrolling or assistive tech.
 * - Key handling ignores modified key presses and anything that happened inside a focused control,
 *   so Tab, Enter, Space on a button, and screen reader commands behave normally.
 */
export function useDriveInput(
  containerRef: RefObject<HTMLElement | null>,
  reducedMotion: boolean,
  /** False while something covers the drive (the loading screen): no input drives the car. */
  enabled = true,
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    let lastStepAt = -Infinity;
    const stepWithCooldown = (dir: 1 | -1) => {
      const now = performance.now();
      if (now - lastStepAt < STEP_COOLDOWN_MS) return;
      lastStepAt = now;
      perform({ type: 'step', dir });
    };

    const onWheel = (event: WheelEvent) => {
      if (reducedMotion) {
        if (event.deltaY !== 0) stepWithCooldown(event.deltaY > 0 ? 1 : -1);
        return;
      }
      useDriveStore.getState().nudge(wheelToDelta(event.deltaY, event.deltaMode));
    };

    let touchY: number | null = null;
    let touchTotal = 0;
    const onTouchStart = (event: TouchEvent) => {
      touchY = event.touches[0]?.clientY ?? null;
      touchTotal = 0;
    };
    const onTouchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY;
      if (touchY === null || y === undefined) return;
      const upward = touchY - y;
      touchTotal += upward;
      touchY = y;
      if (!reducedMotion) useDriveStore.getState().nudge(swipeToDelta(upward));
    };
    const onTouchEnd = () => {
      if (reducedMotion && Math.abs(touchTotal) >= SWIPE_STEP_PIXELS) {
        stepWithCooldown(touchTotal > 0 ? 1 : -1);
      }
      touchY = null;
      touchTotal = 0;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (isInteractiveTarget(event.target)) return;
      const action = actionForKey(event.key, event.shiftKey, reducedMotion);
      if (action) perform(action);
    };

    container.addEventListener('wheel', onWheel, { passive: true });
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('touchend', onTouchEnd, { passive: true });
    container.addEventListener('touchcancel', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    return () => {
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [containerRef, reducedMotion, enabled]);
}
