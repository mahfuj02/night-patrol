import { Vector3 } from 'three';
import type { Pose } from '@/lib/parking';
import { vectorHeading } from '@/lib/parking';
import type { Direction, UTurnPath } from '@/lib/uturn';
import { routeModel } from './Road/route';

/**
 * Which way the car is going along the route, and the U-turn it is in the middle of, if any. A plain
 * mutable object, written by the progress and U-turn drivers and read by the car, the camera and the
 * station arrival, so nothing here goes through React state.
 */
export const travel: {
  direction: Direction;
  turn: { p: number; endT: number; path: UTurnPath } | null;
} = { direction: 1, turn: null };

const lane = new Vector3();
const tangent = new Vector3();

/**
 * Where the car is at route position `t` going `direction`: in that direction's right-hand lane,
 * facing the way it is going (so going back, it is in the left lane of the route and faces back).
 * Writes into `out` and returns it.
 */
export function carPoseAt(
  t: number,
  direction: Direction,
  out: Pose = { x: 0, z: 0, heading: 0 },
): Pose {
  routeModel.lanePointAt(t, lane, direction);
  routeModel.curve.getTangentAt(t, tangent);
  out.x = lane.x;
  out.z = lane.z;
  out.heading = vectorHeading(tangent.x * direction, tangent.z * direction);
  return out;
}
