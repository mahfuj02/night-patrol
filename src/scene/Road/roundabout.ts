import { TorusGeometry, Vector3, type BufferGeometry } from 'three';
import { ARC_SPEED } from '@/lib/loopDrive';
import { parkingPath, vectorHeading, type Pose } from '@/lib/parking';
import type { Direction } from '@/lib/uturn';
import type { Strip } from './armGeometry';
import type { RouteModel } from './route';

/**
 * The two roundabouts the patrol drives, one at each end of the road: a big one past The Forks,
 * and a small turnaround behind Ignition. Each puts the car back on the road facing the other way.
 *
 * The road runs straight on to the roundabout and meets it head-on, square to the ring, as a real
 * approach does: the ring is centred on the road's axis, straight ahead of the end of the road,
 * and its outer edge starts exactly where the road ends. The car arrives in its right-hand lane,
 * bears right to join the ring tangentially, goes round counter-clockwise seen from above (Canada
 * drives on the right, so the island is on the car's LEFT), and leaves by the same arm into the
 * other lane, heading back along the road.
 *
 * Angles `theta` go round the ring counter-clockwise from the mouth of the road: 0 is the point
 * of the ring nearest the road, and the first half turn is on the car's right.
 */
export interface RingSpec {
  /** Radius of the centre line of the ring, and the ring's width. */
  centreline: number;
  width: number;
  /** Radius of the snowy island in the middle (a little inside the ring's inner edge). */
  island: number;
  /** Roads are built from this many straight strips round the ring. */
  segments: number;
  /** How fast the car goes round, in metres per second. */
  speed: number;
  /** Where the car joins and leaves the ring, as an angle from the mouth of the road (radians). */
  joinAngle: number;
  /** How far in from the end of the road the car starts bearing right and finishes coming out. */
  approach: number;
  /** Half the angle left open in the outer bank where the road meets the ring (radians). */
  mouthGap: number;
}

/** The big roundabout past The Forks. */
export const ROUNDABOUT: RingSpec = {
  centreline: 17,
  width: 10,
  island: 11.5,
  segments: 64,
  speed: ARC_SPEED,
  joinAngle: 0.5,
  approach: 14,
  mouthGap: 0.34,
};

/** The small turnaround behind Ignition: one lap is about five seconds. */
export const TURNAROUND: RingSpec = {
  centreline: 11,
  width: 8,
  island: 6.8,
  segments: 48,
  speed: ARC_SPEED,
  joinAngle: 0.55,
  approach: 12,
  mouthGap: 0.42,
};

/** Which end of the road a roundabout is at. */
export type RingEnd = 'forks' | 'start';

export const ringSpec = (end: RingEnd): RingSpec => (end === 'forks' ? ROUNDABOUT : TURNAROUND);

/** The Forks ring's outer radius: where the road ends and the ring begins. */
export const OUTER_RADIUS = ROUNDABOUT.centreline + ROUNDABOUT.width / 2;

/** A ring's outer radius. */
export const outerRadius = (spec: RingSpec) => spec.centreline + spec.width / 2;

export interface RoundaboutLayout {
  end: RingEnd;
  spec: RingSpec;
  /** Centre of the ring (the island), at ground level, straight ahead of the end of the road. */
  centre: Vector3;
  /** Unit vectors at the end of the road: forward (away from the road) and to the left of travel. */
  forward: Vector3;
  left: Vector3;
  /** The end of the road's centre line, which is where the ring's outer edge begins. */
  roadEnd: Vector3;
  /** How far the car's lane is from the road's centre line. */
  laneOffset: number;
}

export function roundaboutLayout(model: RouteModel, end: RingEnd = 'forks'): RoundaboutLayout {
  const spec = ringSpec(end);
  const u = end === 'forks' ? 1 : 0;
  const roadEnd = model.curve.getPointAt(u);
  const forward = model.curve.getTangentAt(u).setY(0).normalize();
  if (end === 'start') forward.negate();
  // To the left of the direction of travel: (tangent.z, 0, -tangent.x), as the road ribbon does.
  const left = new Vector3(forward.z, 0, -forward.x);
  const laneOffset = model.lanePointAt(u).sub(roadEnd).length();
  const centre = roadEnd.clone().addScaledVector(forward, outerRadius(spec));
  return { end, spec, centre, forward, left, roadEnd, laneOffset };
}

/** The point at `radius` and angle `theta` round the ring (see the angle convention above). */
export function ringPoint(layout: RoundaboutLayout, radius: number, theta: number): Vector3 {
  return layout.centre
    .clone()
    .addScaledVector(layout.forward, -Math.cos(theta) * radius)
    .addScaledVector(layout.left, -Math.sin(theta) * radius);
}

/** The direction of travel round the ring at `theta`, as a unit vector. */
function ringDirection(layout: RoundaboutLayout, theta: number): Vector3 {
  return new Vector3()
    .addScaledVector(layout.forward, Math.sin(theta))
    .addScaledVector(layout.left, -Math.cos(theta))
    .normalize();
}

function poseOf(point: Vector3, direction: Vector3): Pose {
  return { x: point.x, z: point.z, heading: vectorHeading(direction.x, direction.z) };
}

/** The pose in the car's lane at `u` along the road, driving `direction` (1 outbound, -1 heading back). */
export function lanePose(model: RouteModel, u: number, direction: Direction): Pose {
  const lane = model.lanePointAt(u, new Vector3(), direction);
  const tangent = model.curve.getTangentAt(u);
  return {
    x: lane.x,
    z: lane.z,
    heading: vectorHeading(tangent.x * direction, tangent.z * direction),
  };
}

export interface ArcSegment {
  kind: 'entry' | 'ring' | 'exit';
  /** Distances along the pass, in metres. */
  from: number;
  to: number;
}

/**
 * One pass through a roundabout: in from the road's end lane, round the ring and out onto the other
 * lane. Starts and ends `approach` metres in from the end of the road.
 */
export interface ArcPath {
  length: number;
  segments: ArcSegment[];
  /** The pose after driving `distance` metres along the pass (clamped to it). */
  pose: (distance: number) => Pose;
  /** Where the pass starts (the lane it arrives in) and where it ends (the lane it leaves in). */
  from: Pose;
  to: Pose;
  /** The `u` along the road, where the pass starts and ends. */
  u: number;
}

/**
 * The pass through the roundabout at one end of the road: bearing right onto the ring, once round
 * the ring, and off it onto the other lane. Pure geometry, so it can be tested without a scene.
 */
export function arcPath(model: RouteModel, end: RingEnd): ArcPath {
  const layout = roundaboutLayout(model, end);
  const { spec } = layout;
  const { centreline, joinAngle, approach } = spec;
  const u = end === 'forks' ? 1 - approach / model.length : approach / model.length;
  // Arriving: the right-hand lane toward the ring. Leaving: the other lane, heading away from it.
  const arriveDirection: Direction = end === 'forks' ? 1 : -1;
  const from = lanePose(model, u, arriveDirection);
  const to = lanePose(model, u, arriveDirection === 1 ? -1 : 1);

  const inPose = poseOf(ringPoint(layout, centreline, joinAngle), ringDirection(layout, joinAngle));
  const outAngle = 2 * Math.PI - joinAngle;
  const outPose = poseOf(ringPoint(layout, centreline, outAngle), ringDirection(layout, outAngle));
  const entry = parkingPath(from, inPose);
  const exit = parkingPath(outPose, to);
  const arcLength = centreline * (outAngle - joinAngle);

  const pieces: { kind: ArcSegment['kind']; length: number; pose: (d: number) => Pose }[] = [
    { kind: 'entry', length: entry.length, pose: (d) => entry.pose(d / entry.length) },
    {
      kind: 'ring',
      length: arcLength,
      pose: (d) => {
        const theta = joinAngle + d / centreline;
        return poseOf(ringPoint(layout, centreline, theta), ringDirection(layout, theta));
      },
    },
    { kind: 'exit', length: exit.length, pose: (d) => exit.pose(d / exit.length) },
  ];
  const segments: ArcSegment[] = [];
  let total = 0;
  for (const piece of pieces) {
    segments.push({ kind: piece.kind, from: total, to: total + piece.length });
    total += piece.length;
  }
  const last = pieces[pieces.length - 1]!;

  return {
    length: total,
    segments,
    from,
    to,
    u,
    pose: (distance) => {
      const d = Math.min(Math.max(distance, 0), total);
      let start = 0;
      for (const piece of pieces) {
        if (d <= start + piece.length || piece === last) {
          return piece.pose(Math.min(piece.length, d - start));
        }
        start += piece.length;
      }
      return last.pose(last.length);
    },
  };
}

/** How long a pass takes at the roundabout's speed, in seconds. */
export function arcSeconds(path: ArcPath, end: RingEnd): number {
  return path.length / ringSpec(end).speed;
}

/**
 * The ring as straight road strips round the centre line, each a little longer than its share of
 * the circle so neighbours overlap and leave no gaps on the outside of the bend.
 */
export function ringStrips(model: RouteModel, end: RingEnd = 'forks'): Strip[] {
  const layout = roundaboutLayout(model, end);
  const { centreline, width, segments } = layout.spec;
  const share = (2 * Math.PI * centreline) / segments;
  const length = share * 1.35;
  return Array.from({ length: segments }, (_, i) => {
    const theta = ((i + 0.5) / segments) * 2 * Math.PI;
    const mid = ringPoint(layout, centreline, theta);
    const dir = ringDirection(layout, theta);
    return {
      origin: mid.clone().addScaledVector(dir, -length / 2),
      dir,
      length,
      width,
    };
  });
}

/** Radius of the tube of the low plowed bank round the outside of the ring. */
export const BANK_TUBE = 0.45;

/**
 * The low plowed bank round the outside of the ring, as an arc of a torus lying flat. It stops short
 * of the mouth of the road (`mouthGap` either side), so the road runs into the ring without a wall
 * of snow across it.
 */
export function bankGeometry(model: RouteModel, end: RingEnd = 'forks'): BufferGeometry {
  const layout = roundaboutLayout(model, end);
  const { mouthGap } = layout.spec;
  const arc = 2 * Math.PI - 2 * mouthGap;
  const geometry = new TorusGeometry(outerRadius(layout.spec) + BANK_TUBE, BANK_TUBE, 8, 72, arc);
  // The torus lies in x-y with its arc starting along +x and running toward +y. Lay it flat (x, z),
  // so the arc runs from +x toward +z. That is the opposite way round to the ring angle theta
  // (which goes from the mouth toward the car's right, the opposite way to x toward z), so the
  // arc starts at theta = -mouthGap and runs the long way round to theta = +mouthGap.
  geometry.rotateX(Math.PI / 2);
  const start = Math.atan2(
    layout.left.z * Math.sin(mouthGap) - layout.forward.z * Math.cos(mouthGap),
    layout.left.x * Math.sin(mouthGap) - layout.forward.x * Math.cos(mouthGap),
  );
  // Turning about Y by psi moves an angle phi (measured x toward z) to phi - psi.
  geometry.rotateY(-start);
  geometry.translate(layout.centre.x, 0.2, layout.centre.z);
  return geometry;
}
