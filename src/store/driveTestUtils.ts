import { progress } from '@/lib/driveProgress';
import { START_S, STOP_VISITS } from '@/lib/patrolLoop';
import { INITIAL_STATION } from '@/lib/station';
import { derive, useDriveStore } from './drive';

/** The visit to a stop, outbound (1) or heading back (-1). */
export function visitOf(stop: number, direction: 1 | -1 = 1) {
  const visit = STOP_VISITS.find((v) => v.stop === stop && v.direction === direction);
  if (!visit) throw new Error(`No visit to stop ${stop} going ${direction}`);
  return visit;
}

/** Everything idle, the car at the first stop, as on load. For tests only. */
export function resetDrive(): void {
  progress.s = START_S;
  progress.speed = 0;
  useDriveStore.setState({
    ...derive(START_S),
    braked: false,
    turnRequest: false,
    goal: null,
    arc: false,
    laps: 0,
    station: INITIAL_STATION,
    pendingOpen: null,
    wallLegible: true,
    shift: 'idle',
    resetCount: 0,
  });
}

/** Puts the car, and the request, at `s` metres round the loop with the car stopped. For tests only. */
export function placeCar(s: number): void {
  progress.s = s;
  progress.speed = 0;
  useDriveStore.setState({
    ...derive(s),
    braked: false,
    turnRequest: false,
    goal: null,
    pendingOpen: null,
  });
}

/** Puts the car at a visit to a stop. For tests only. */
export function arriveAt(stop: number, direction: 1 | -1 = 1): void {
  placeCar(visitOf(stop, direction).s);
}
