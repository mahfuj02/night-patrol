import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useRef } from 'react';
import { stepLoop } from '@/lib/loopDrive';
import { MAGNETS, START_S, patrolLoop as loop } from '@/lib/patrolLoop';
import { UTURN_RUN, uTurnPath } from '@/lib/uturn';
import { useDriveStore } from '@/store/drive';
import { loopPoseAt } from './Road/loop';
import { progress } from './progress';
import { stationView } from './Stations/stationView';
import { travel } from './travel';

/** Ignore long frames (tab switches) so the car does not lurch. */
const MAX_DELTA = 0.1;

/** Writes the route position and heading that follow from the car's place on the loop. */
function publish() {
  progress.t = loop.routeT(progress.s);
  progress.direction = loop.direction(progress.s);
}

/**
 * Drives the car round the patrol loop. `progress.s` (metres driven) eases toward the requested
 * distance, pulled to a stop by the magnet at each stop and station light. The car never reverses:
 * it only ever moves forward along the loop, so the visitor's backward input brakes it (the store
 * pulls the request back to the car), and a U-turn is a separate, deliberate move (see
 * `UTurnDriver`). The step itself is `stepLoop` in `@/lib/loopDrive`, shared with the tests. Runs before the car and camera
 * (negative priority), so they see this frame's value.
 */
export function ProgressDriver({ reducedMotion }: { reducedMotion: boolean }) {
  const seenReset = useRef(useDriveStore.getState().resetCount);
  const lastKind = useRef(loop.where(progress.s).piece.kind);

  useLayoutEffect(() => {
    publish();
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, MAX_DELTA);
    const store = useDriveStore.getState();

    // Start over is a cut back to the first stop heading out, not a drive back along the loop.
    if (store.resetCount !== seenReset.current) {
      seenReset.current = store.resetCount;
      progress.s = START_S;
      progress.speed = 0;
      travel.turn = null;
      lastKind.current = loop.where(START_S).piece.kind;
      publish();
      return;
    }
    // While the car is turning round the U-turn driver moves it.
    if (travel.turn) {
      progress.speed = 0;
      return;
    }
    // A U-turn has been asked for: start it as soon as the car is on the road and out of a bay.
    if (store.turnRequest) {
      progress.speed = 0;
      if (stationView.active) return;
      const here = loop.wrap(progress.s);
      const landing = loop.landing(here, UTURN_RUN);
      if (landing === null) {
        store.finishTurn(progress.s);
        return;
      }
      // Under reduced motion the U-turn driver finishes it in one frame: a cut to the other lane.
      travel.turn = {
        p: 0,
        toS: landing,
        path: uTurnPath(loopPoseAt(here), loopPoseAt(landing)),
      };
      return;
    }

    const before = progress.s;
    const step = stepLoop(loop, {
      s: before,
      speed: progress.speed,
      target: store.target,
      dt,
      reducedMotion,
      owned: stationView.active,
      magnets: MAGNETS,
    });
    store.setArc(step.onArc);
    const next = step.s;
    progress.s = next;
    progress.speed = step.speed;
    const kind = loop.where(next).piece.kind;
    if (lastKind.current === 'start' && kind === 'out') store.completeLap();
    lastKind.current = kind;
    publish();
  }, -1);

  return null;
}
