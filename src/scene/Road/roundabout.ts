import { Vector3 } from 'three';
import { vectorHeading, type Pose } from '@/lib/parking';
import type { RouteModel } from './route';
import type { Strip } from './armGeometry';

/**
 * The roundabout at the end of the route, where the car loops at the end of the shift. It stands
 * past the last stop, at the end of the road: the road runs on 38 m beyond The Forks stop and
 * meets the ring there, tangent to it. Canada drives on the right and circulates counter-clockwise
 * (seen from above), so the island is on the car's LEFT as it goes round, and the car enters by
 * carrying straight on into the ring.
 */
export const ROUNDABOUT = {
  /** Radius of the centre line of the ring, and the ring's width. */
  centreline: 17,
  width: 10,
  /** Radius of the snowy island in the middle (a little inside the ring's inner edge). */
  island: 11.5,
  /** Roads are built from this many straight strips round the ring. */
  segments: 64,
  /** How fast the car goes round, in metres per second. */
  speed: 15,
} as const;

/** The island's centre and the radius the car follows, from the route's end and its lane. */
export interface RoundaboutLayout {
  /** Centre of the ring, at ground level. */
  centre: Vector3;
  /** Unit vectors at the end of the route: forward, and to the left of travel. */
  forward: Vector3;
  left: Vector3;
  /** The end of the route's centre line. */
  end: Vector3;
  /** The radius of the car's path: the ring's centre line plus the car's lane offset. */
  laneRadius: number;
}

export function roundaboutLayout(model: RouteModel): RoundaboutLayout {
  const end = model.curve.getPointAt(1);
  const forward = model.curve.getTangentAt(1).setY(0).normalize();
  // To the left of the direction of travel: (tangent.z, 0, -tangent.x), as the road ribbon does.
  const left = new Vector3(forward.z, 0, -forward.x);
  const lane = model.lanePointAt(1);
  const laneOffset = lane.clone().sub(end).length();
  const centre = end.clone().addScaledVector(left, ROUNDABOUT.centreline);
  return { centre, forward, left, end, laneRadius: ROUNDABOUT.centreline + laneOffset };
}

/** A point on the circle of radius `radius` at angle `s`, s = 0 being the end of the route's lane. */
function onCircle(layout: RoundaboutLayout, radius: number, s: number): Vector3 {
  const { centre, forward, left } = layout;
  return centre
    .clone()
    .addScaledVector(left, -Math.cos(s) * radius)
    .addScaledVector(forward, Math.sin(s) * radius);
}

/** The loop the car drives: the lead-in along the road from where it is, then once round the ring. */
export interface LoopPath {
  /** Metres of lead-in along the road, from the start to the end of the route. */
  leadIn: number;
  /** Metres of the whole loop: the lead-in and one lap. */
  length: number;
  /** The car's pose after driving `distance` metres (clamped to the loop). */
  pose: (distance: number) => Pose;
}

/**
 * The loop path from route position `u0`: along the road to its end, then once round the ring and
 * back to where it entered. Pure geometry, so it can be tested without a scene.
 */
export function loopPath(model: RouteModel, u0: number): LoopPath {
  const layout = roundaboutLayout(model);
  const leadIn = Math.max(0, (1 - u0) * model.length);
  const lap = 2 * Math.PI * layout.laneRadius;
  const lane = new Vector3();
  const tangent = new Vector3();

  return {
    leadIn,
    length: leadIn + lap,
    pose: (distance) => {
      const d = Math.min(Math.max(distance, 0), leadIn + lap);
      if (d < leadIn) {
        const u = Math.min(1, u0 + d / model.length);
        model.lanePointAt(u, lane);
        model.curve.getTangentAt(u, tangent);
        return { x: lane.x, z: lane.z, heading: vectorHeading(tangent.x, tangent.z) };
      }
      const s = (d - leadIn) / layout.laneRadius;
      const p = onCircle(layout, layout.laneRadius, s);
      // The direction of travel: left * sin(s) + forward * cos(s).
      const dx = layout.left.x * Math.sin(s) + layout.forward.x * Math.cos(s);
      const dz = layout.left.z * Math.sin(s) + layout.forward.z * Math.cos(s);
      return { x: p.x, z: p.z, heading: vectorHeading(dx, dz) };
    },
  };
}

/** How long the loop takes at the roundabout's speed, in seconds. */
export function loopSeconds(path: LoopPath): number {
  return path.length / ROUNDABOUT.speed;
}

/**
 * The ring as straight road strips round the centre line, each a little longer than its share of
 * the circle so neighbours overlap and leave no gaps on the outside of the bend.
 */
export function ringStrips(model: RouteModel): Strip[] {
  const layout = roundaboutLayout(model);
  const { centreline, width, segments } = ROUNDABOUT;
  const share = (2 * Math.PI * centreline) / segments;
  const length = share * 1.35;
  return Array.from({ length: segments }, (_, i) => {
    const s = ((i + 0.5) / segments) * 2 * Math.PI;
    const mid = onCircle(layout, centreline, s);
    const dir = new Vector3()
      .addScaledVector(layout.left, Math.sin(s))
      .addScaledVector(layout.forward, Math.cos(s))
      .normalize();
    return {
      origin: mid.clone().addScaledVector(dir, -length / 2),
      dir,
      length,
      width,
    };
  });
}
