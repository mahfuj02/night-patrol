import { useFrame } from '@react-three/fiber';
import { useLayoutEffect } from 'react';
import { applyMagnet, dampT } from '@/lib/route';
import { MAGNET_TS, useDriveStore } from '@/store/drive';
import { progress } from './progress';

/** How quickly on-screen progress catches up with the requested progress (per second). */
const FOLLOW_RATE = 5;
/** Ignore long frames (tab switches) so the car does not lurch. */
const MAX_DELTA = 0.1;

function desiredProgress() {
  return applyMagnet(useDriveStore.getState().target, MAGNET_TS);
}

/**
 * Eases `progress.t` toward the requested progress, pulled toward the nearest stop by the magnet.
 * Under reduced motion there is no easing: the view cuts straight to the destination.
 * Runs before the car and camera (negative priority), so they see this frame's value.
 */
export function ProgressDriver({ reducedMotion }: { reducedMotion: boolean }) {
  useLayoutEffect(() => {
    progress.t = desiredProgress();
  }, []);

  useFrame((_, delta) => {
    const desired = desiredProgress();
    progress.t = reducedMotion
      ? desired
      : dampT(progress.t, desired, FOLLOW_RATE, Math.min(delta, MAX_DELTA));
  }, -1);

  return null;
}
