import { useFrame } from '@react-three/fiber';
import { patrolLoop as loop } from '@/lib/patrolLoop';
import { easeInOut } from '@/lib/parking';
import { advanceManeuver } from '@/lib/station';
import { UTURN_SECONDS } from '@/lib/uturn';
import { useDriveStore } from '@/store/drive';
import { progress } from './progress';
import { stationView } from './Stations/stationView';
import { travel } from './travel';

/**
 * Drives the U-turn: while `travel.turn` is set the car follows its path across the road (through
 * the same car and camera override the station arrival uses), and when it is done it faces the
 * other way in the other lane, stopped, ready to drive on. The camera simply follows behind the car,
 * so it swings round with it and settles behind the new direction. Under reduced motion the turn
 * finishes in a single frame: a cut to the other lane. Runs after the station driver, before the car
 * and camera.
 */
export function UTurnDriver({ reducedMotion }: { reducedMotion: boolean }) {
  useFrame((_, delta) => {
    const turn = travel.turn;
    if (!turn) return;
    turn.p = advanceManeuver(turn.p, Math.min(delta, 0.1), UTURN_SECONDS, reducedMotion);
    const pose = turn.path.pose(easeInOut(turn.p));
    stationView.active = true;
    stationView.station = -1;
    stationView.glow = 0;
    stationView.x = pose.x;
    stationView.z = pose.z;
    stationView.heading = pose.heading;
    if (turn.p >= 1) {
      // The same lap, the other lane: only where on the loop changes.
      progress.s = progress.s - loop.wrap(progress.s) + turn.toS;
      progress.t = loop.routeT(progress.s);
      progress.direction = loop.direction(progress.s);
      travel.turn = null;
      useDriveStore.getState().finishTurn(progress.s);
    }
  }, -0.7);

  return null;
}
