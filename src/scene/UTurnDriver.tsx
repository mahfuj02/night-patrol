import { useFrame } from '@react-three/fiber';
import { easeInOut } from '@/lib/parking';
import { advanceManeuver } from '@/lib/station';
import { UTURN_SECONDS } from '@/lib/uturn';
import { progress } from './progress';
import { stationView } from './Stations/stationView';
import { travel } from './travel';

/**
 * Drives the U-turn: while `travel.turn` is set the car follows its path across the road (through
 * the same car and camera override the station arrival uses), and when it is done the car faces the
 * other way in the other lane and drives on from where it came out. The camera simply follows behind
 * the car, so it swings round with it and settles behind the new direction. Under reduced motion
 * there is no U-turn at all (see `ProgressDriver`: the car cuts to the other lane). Runs after the
 * station driver, before the car and camera.
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
      travel.direction = travel.direction === 1 ? -1 : 1;
      progress.t = turn.endT;
      travel.turn = null;
    }
  }, -0.7);

  return null;
}
