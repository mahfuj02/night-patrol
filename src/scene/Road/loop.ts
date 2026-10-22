import { Vector3 } from 'three';
import { patrolLoop } from '@/lib/patrolLoop';
import { vectorHeading, type Pose } from '@/lib/parking';
import type { Direction } from '@/lib/uturn';
import { arcPath } from './roundabout';
import { routeModel } from './route';

/** The two roundabout passes, built once from the road. */
export const forksArc = arcPath(routeModel, 'forks');
export const startArc = arcPath(routeModel, 'start');

const lane = new Vector3();
const tangent = new Vector3();

/** The pose in the car's lane at `u` along the road, driving `direction`. Writes into `out`. */
export function lanePoseAt(u: number, direction: Direction, out: Pose): Pose {
  routeModel.lanePointAt(u, lane, direction);
  routeModel.curve.getTangentAt(u, tangent);
  out.x = lane.x;
  out.z = lane.z;
  out.heading = vectorHeading(tangent.x * direction, tangent.z * direction);
  return out;
}

/**
 * Where the car is after driving `s` metres round the patrol loop (any real `s`; it wraps): on the
 * outbound lane, round the Forks roundabout, on the return lane, or round the turnaround. Writes
 * into `out` and returns it, so a frame allocates nothing.
 */
export function loopPoseAt(s: number, out: Pose = { x: 0, z: 0, heading: 0 }): Pose {
  const { spec } = patrolLoop;
  const { piece, d } = patrolLoop.where(s);
  const length = routeModel.length;
  switch (piece.kind) {
    case 'out':
      return lanePoseAt((spec.startRun + d) / length, 1, out);
    case 'back':
      return lanePoseAt((spec.road - spec.forksRun - d) / length, -1, out);
    case 'forks':
      return Object.assign(out, forksArc.pose(d));
    case 'start':
      return Object.assign(out, startArc.pose(d));
  }
}

/** Where the car is on the road, as the route's own `t`, and which way it is heading along it. */
export function routeAt(s: number): { t: number; direction: Direction } {
  return { t: patrolLoop.routeT(s), direction: patrolLoop.direction(s) };
}
