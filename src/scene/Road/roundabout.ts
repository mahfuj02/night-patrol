import { TorusGeometry, Vector3, type BufferGeometry } from 'three';
import { parkingPath, vectorHeading, type Pose } from '@/lib/parking';
import type { Strip } from './armGeometry';
import type { RouteModel } from './route';

/**
 * The roundabout at the end of the route, where the car loops at the end of the shift.
 *
 * The road runs straight on past The Forks stop to the roundabout and meets it head-on, square to
 * the ring, as a real approach does: the ring is centred on the road's axis, straight ahead of the
 * end of the road, and its outer edge starts exactly where the road ends. The car arrives in its
 * right-hand lane, bears right to join the ring tangentially, goes round counter-clockwise seen
 * from above (Canada drives on the right, so the island is on the car's LEFT), and leaves by
 * the same arm into the other lane, heading back toward the city.
 *
 * Angles `theta` go round the ring counter-clockwise from the mouth of the road: 0 is the point
 * of the ring nearest the road, and the first half turn is on the car's right (the east side when
 * the road runs north).
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
  /** Where the car joins and leaves the ring, as an angle from the mouth of the road (radians). */
  joinAngle: 0.5,
  /** How far before the end of the road the car starts bearing right, and how far it runs back. */
  approach: 14,
  returnRun: 26,
  /** Half the angle left open in the outer bank where the road meets the ring (radians). */
  mouthGap: 0.34,
} as const;

/** The ring's outer radius: where the road ends and the ring begins. */
export const OUTER_RADIUS = ROUNDABOUT.centreline + ROUNDABOUT.width / 2;

export interface RoundaboutLayout {
  /** Centre of the ring (the island), at ground level, straight ahead of the end of the road. */
  centre: Vector3;
  /** Unit vectors at the end of the road: forward (away from the city) and to the left of travel. */
  forward: Vector3;
  left: Vector3;
  /** The end of the road's centre line, which is where the ring's outer edge begins. */
  end: Vector3;
  /** How far the car's lane is from the road's centre line. */
  laneOffset: number;
}

export function roundaboutLayout(model: RouteModel): RoundaboutLayout {
  const end = model.curve.getPointAt(1);
  const forward = model.curve.getTangentAt(1).setY(0).normalize();
  // To the left of the direction of travel: (tangent.z, 0, -tangent.x), as the road ribbon does.
  const left = new Vector3(forward.z, 0, -forward.x);
  const laneOffset = model.lanePointAt(1).sub(end).length();
  const centre = end.clone().addScaledVector(forward, OUTER_RADIUS);
  return { centre, forward, left, end, laneOffset };
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

/** One stretch of the loop: how long it is and the pose after driving `d` metres along it. */
interface Piece {
  kind: LoopSegment['kind'];
  length: number;
  pose: (d: number) => Pose;
}

export interface LoopSegment {
  kind: 'lead' | 'entry' | 'ring' | 'exit' | 'return';
  /** Distances along the whole loop, in metres. */
  from: number;
  to: number;
}

/** The loop the car drives, in stretches, with the pose at any distance along it. */
export interface LoopPath {
  /** Metres from the start to where the car reaches the ring (the end of the entry curve). */
  leadIn: number;
  length: number;
  segments: LoopSegment[];
  /** The car's pose after driving `distance` metres (clamped to the loop). */
  pose: (distance: number) => Pose;
}

/**
 * The loop from route position `u0`: along the road in the car's lane, bearing right onto the ring,
 * once round the ring, off it onto the other lane heading back toward the city, and a short run
 * back along the road. Pure geometry, so it can be tested without a scene.
 */
export function loopPath(model: RouteModel, u0: number): LoopPath {
  const layout = roundaboutLayout(model);
  const { laneOffset } = layout;
  const { centreline, joinAngle, approach, returnRun } = ROUNDABOUT;
  const uApproach = Math.max(u0, 1 - approach / model.length);
  const lane = new Vector3();
  const axis = new Vector3();
  const tangent = new Vector3();

  const laneAt = (u: number): Pose => {
    model.lanePointAt(u, lane);
    model.curve.getTangentAt(u, tangent);
    return { x: lane.x, z: lane.z, heading: vectorHeading(tangent.x, tangent.z) };
  };
  /** The opposite lane (the car's right-hand lane going back): the road's left, heading reversed. */
  const returnAt = (u: number): Pose => {
    model.curve.getPointAt(u, axis);
    model.curve.getTangentAt(u, tangent);
    const lx = tangent.z;
    const lz = -tangent.x;
    return {
      x: axis.x + lx * laneOffset,
      z: axis.z + lz * laneOffset,
      heading: vectorHeading(-tangent.x, -tangent.z),
    };
  };

  const inPose = poseOf(ringPoint(layout, centreline, joinAngle), ringDirection(layout, joinAngle));
  const outAngle = 2 * Math.PI - joinAngle;
  const outPose = poseOf(ringPoint(layout, centreline, outAngle), ringDirection(layout, outAngle));
  const entry = parkingPath(laneAt(uApproach), inPose);
  const exitStart = returnAt(uApproach);
  const exit = parkingPath(outPose, exitStart);
  const uBack = Math.max(0, uApproach - returnRun / model.length);
  const leadLength = (uApproach - u0) * model.length;
  const returnLength = (uApproach - uBack) * model.length;
  const arcLength = centreline * (outAngle - joinAngle);

  const pieces: Piece[] = [
    {
      kind: 'lead',
      length: leadLength,
      pose: (d) => laneAt(Math.min(uApproach, u0 + d / model.length)),
    },
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
    {
      kind: 'return',
      length: returnLength,
      pose: (d) => returnAt(Math.max(uBack, uApproach - d / model.length)),
    },
  ];

  const segments: LoopSegment[] = [];
  let total = 0;
  for (const piece of pieces) {
    segments.push({ kind: piece.kind, from: total, to: total + piece.length });
    total += piece.length;
  }
  const ringStart = segments.find((s) => s.kind === 'ring')!.from;

  return {
    leadIn: ringStart,
    length: total,
    segments,
    pose: (distance) => {
      const d = Math.min(Math.max(distance, 0), total);
      let start = 0;
      for (const piece of pieces) {
        if (d <= start + piece.length || piece === pieces[pieces.length - 1]) {
          return piece.pose(Math.min(piece.length, d - start));
        }
        start += piece.length;
      }
      return pieces[pieces.length - 1]!.pose(returnLength);
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
export function bankGeometry(model: RouteModel): BufferGeometry {
  const layout = roundaboutLayout(model);
  const { mouthGap } = ROUNDABOUT;
  const arc = 2 * Math.PI - 2 * mouthGap;
  const geometry = new TorusGeometry(OUTER_RADIUS + BANK_TUBE, BANK_TUBE, 8, 72, arc);
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
