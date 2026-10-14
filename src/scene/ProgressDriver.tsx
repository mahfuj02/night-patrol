import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useRef } from 'react';
import { applyMagnet, dampT } from '@/lib/route';
import { followDirection, needsTurn, uTurnEnd, uTurnPath } from '@/lib/uturn';
import { MAGNET_TS, useDriveStore } from '@/store/drive';
import { progress } from './progress';
import { routeModel } from './Road/route';
import { stationView } from './Stations/stationView';
import { carPoseAt, travel } from './travel';

/** How quickly on-screen progress catches up with the requested progress (per second). */
const FOLLOW_RATE = 5;
/** Ignore long frames (tab switches) so the car does not lurch. */
const MAX_DELTA = 0.1;

function desiredProgress() {
  return applyMagnet(useDriveStore.getState().target, MAGNET_TS);
}

/**
 * Eases `progress.t` toward the requested progress, pulled toward the nearest stop by the magnet.
 * The car never reverses: when the requested spot is behind it, it turns round (a U-turn across
 * the road, see `UTurnDriver`) and drives on facing forward in the other lane; a small step back
 * just holds it still. Under reduced motion there is no easing and no U-turn: the view cuts to the
 * destination, and to the other lane when the direction changes. Runs before the car and camera
 * (negative priority), so they see this frame's value.
 */
export function ProgressDriver({ reducedMotion }: { reducedMotion: boolean }) {
  useLayoutEffect(() => {
    progress.t = desiredProgress();
  }, []);

  const seenReset = useRef(useDriveStore.getState().resetCount);

  useFrame((_, delta) => {
    const desired = desiredProgress();
    // The end-of-shift reset is a cut back to the first stop, not a drive back along the route, and
    // the new patrol starts facing forward.
    const { resetCount, shift } = useDriveStore.getState();
    if (resetCount !== seenReset.current) {
      seenReset.current = resetCount;
      travel.direction = 1;
      travel.turn = null;
      progress.t = desired;
      return;
    }
    // While the car is turning round the U-turn driver moves it.
    if (travel.turn) return;

    // A station manoeuvre or the end-of-shift lap owns the car; otherwise turn round if it must.
    const owned = stationView.active || shift !== 'idle';
    if (!owned && needsTurn(travel.direction, progress.t, desired, routeModel.length)) {
      if (reducedMotion) {
        // A cut to the other lane, at the same spot.
        travel.direction = travel.direction === 1 ? -1 : 1;
      } else {
        const endT = uTurnEnd(progress.t, travel.direction, routeModel.length);
        const start = carPoseAt(progress.t, travel.direction);
        const end = carPoseAt(endT, travel.direction === 1 ? -1 : 1);
        travel.turn = { p: 0, endT, path: uTurnPath(start, end) };
      }
      return;
    }

    const eased = reducedMotion
      ? desired
      : dampT(progress.t, desired, FOLLOW_RATE, Math.min(delta, MAX_DELTA));
    progress.t = owned ? eased : followDirection(travel.direction, progress.t, eased);
  }, -1);

  return null;
}
