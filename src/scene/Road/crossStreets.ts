import { LineCurve3, Vector3 } from 'three';
import type { Intersection } from '@/content/schema';
import type { PathModel, RouteModel } from './route';

/** The ridge and buildings on a cross street keep clear of the main road for this many metres. */
const JUNCTION = 4;
/** An arm starts this far inside the main road's edge, so the two surfaces overlap without a seam. */
const OVERLAP = 0.3;

/** One side of a cross street: a straight road running away from the route. */
export interface Arm {
  crossingId: string;
  /** +1 for the arm on the left of the route, -1 for the right (in the direction of travel). */
  sign: 1 | -1;
  /** Where the arm starts, at the edge of the main road. */
  origin: Vector3;
  /** Unit vector pointing away from the route. */
  dir: Vector3;
  length: number;
  width: number;
  /** The arm as a path, for the ridge and building layouts. */
  model: PathModel;
}

/** A place where a cross street meets the route. */
export interface Crossing {
  id: string;
  /** Arc-length fraction of the centre of the intersection. */
  u: number;
  centre: Vector3;
  /** Unit tangent of the route and the unit vector to its right (both flat). */
  tangent: Vector3;
  right: Vector3;
  /** Half the width of the main road here. */
  mainHalf: number;
  street: { width: number; length: number };
  control: 'signals' | 'stop' | 'none';
  arms: [Arm, Arm];
}

function armModel(
  id: string,
  origin: Vector3,
  dir: Vector3,
  length: number,
  width: number,
  zoneU: number,
): PathModel {
  const end = origin.clone().addScaledVector(dir, length);
  const intersections = [{ id: `${id}-junction`, from: 0, to: JUNCTION / length }];
  return {
    curve: new LineCurve3(origin.clone(), end),
    length,
    widthAt: () => width,
    stopFractions: new Map(),
    intersections,
    inIntersection: (u, margin = 0) => u <= (JUNCTION + margin) / length,
    zoneU,
  };
}

/**
 * The cross streets of a route: for every intersection that has a `street`, a straight road across
 * the route at the centre of the gap, as two arms. The street is square to the route unless it has a
 * `skew` (degrees). Crossings without a street are left out.
 */
export function buildCrossings(
  model: RouteModel,
  intersections: readonly Intersection[],
): Crossing[] {
  return intersections.flatMap((spec) => {
    const gap = model.intersections.find((x) => x.id === spec.id);
    if (!spec.street || !gap) return [];
    const u = (gap.from + gap.to) / 2;
    const centre = model.curve.getPointAt(u);
    const tangent = model.curve.getTangentAt(u);
    tangent.y = 0;
    tangent.normalize();
    // Left of travel, matching the road ribbon's lateral direction; the right is its opposite.
    const left = new Vector3(tangent.z, 0, -tangent.x);
    const right = left.clone().negate();
    const mainHalf = model.widthAt(u) / 2;

    const skew = ((spec.street.skew ?? 0) * Math.PI) / 180;
    const [sin, cos] = [Math.sin(skew), Math.cos(skew)];
    // Rotate the left vector by the skew about the vertical axis.
    const dirLeft = new Vector3(left.x * cos + left.z * sin, 0, -left.x * sin + left.z * cos);
    const start = Math.max(0, mainHalf / cos - OVERLAP);
    const length = spec.street.length - start;

    const arm = (sign: 1 | -1): Arm => {
      const dir = dirLeft.clone().multiplyScalar(sign);
      const origin = centre.clone().addScaledVector(dir, start);
      return {
        crossingId: spec.id,
        sign,
        origin,
        dir,
        length,
        width: spec.street!.width,
        model: armModel(
          `${spec.id}-${sign > 0 ? 'left' : 'right'}`,
          origin,
          dir,
          length,
          spec.street!.width,
          u,
        ),
      };
    };

    return [
      {
        id: spec.id,
        u,
        centre,
        tangent,
        right,
        mainHalf,
        street: { width: spec.street.width, length: spec.street.length },
        control: spec.control ?? 'none',
        arms: [arm(1), arm(-1)] as [Arm, Arm],
      },
    ];
  });
}
