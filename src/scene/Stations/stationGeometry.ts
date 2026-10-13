import { Vector3 } from 'three';
import type { Station } from '@/content/schema';
import { bayPose, type Pose } from '@/lib/parking';
import { landmarkFrame, landmarkPlacements } from '../Landmarks/placement';
import type { RouteModel } from '../Road/route';

/** Half the car's length: from its centre to its nose. */
export const CAR_HALF_LENGTH = 2.1;
/** The pad (the patch of packed road to the bay) is this much wider than the bay. */
const PAD_EXTRA_WIDTH = 2.4;
/** How far past the car's nose the pad runs toward the wall, and how far it overlaps the road. */
const PAD_ROAD_OVERLAP = 0.3;

/** The lit rectangle on the wall, in world space. */
export interface WallRect {
  /** Corners as the visitor on the road sees them: top-left, top-right, bottom-right, bottom-left. */
  corners: [Vector3, Vector3, Vector3, Vector3];
  centre: Vector3;
  /** Unit normal pointing out of the wall, toward the road. */
  normal: Vector3;
  width: number;
  height: number;
}

export interface StationGeometry {
  /** Where the car stops in the bay, facing the wall. */
  car: Pose;
  wall: WallRect;
  /** Arc-length fraction of the route point nearest the bay. */
  bayU: number;
  /** The stretch of road edge cleared of plowed snow and trees, as arc-length fractions. */
  clearing: { from: number; to: number };
  /** The patch of packed road from the road edge to the bay (an arm, for the road mesh). */
  pad: { origin: Vector3; dir: Vector3; length: number; width: number };
}

/** The `u` of the point on the route nearest to `point`, by a fine search. */
export function nearestU(model: Pick<RouteModel, 'curve' | 'length'>, point: Vector3): number {
  const steps = Math.max(200, Math.round(model.length / 2));
  let best = 0;
  let bestDistance = Infinity;
  const p = new Vector3();
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    model.curve.getPointAt(u, p);
    const d = (p.x - point.x) ** 2 + (p.z - point.z) ** 2;
    if (d < bestDistance) {
      bestDistance = d;
      best = u;
    }
  }
  return best;
}

/**
 * The geometry of a station from its data: the lit wall rectangle, the bay in front of it, the road
 * clearing and the pad. The landmark's own frame places the wall, so nothing here is hardcoded to
 * one building. The car stops squarely in front of the middle of the rectangle, its nose `depth`
 * metres from the wall, facing it.
 */
export function stationGeometry(model: RouteModel, station: Station): StationGeometry {
  const placement = landmarkPlacements.find((p) => p.stopId === station.stopId);
  if (!placement) throw new Error(`Station ${station.id}: no landmark stands at ${station.stopId}`);
  const frame = landmarkFrame(model, placement);
  const { rect } = station.wall;

  /** A point in the landmark frame as a world point. */
  const world = (x: number, y: number, z: number) =>
    new Vector3(
      frame.position.x + Math.cos(frame.yaw) * x + Math.sin(frame.yaw) * z,
      y,
      frame.position.z - Math.sin(frame.yaw) * x + Math.cos(frame.yaw) * z,
    );
  const left = rect.x + rect.width / 2; // local +x is the viewer's left
  const right = rect.x - rect.width / 2;
  const corners: WallRect['corners'] = [
    world(left, rect.y + rect.height, rect.z),
    world(right, rect.y + rect.height, rect.z),
    world(right, rect.y, rect.z),
    world(left, rect.y, rect.z),
  ];
  // Local -z faces the road.
  const normal = new Vector3(-Math.sin(frame.yaw), 0, -Math.cos(frame.yaw));
  const centre = world(rect.x, rect.y + rect.height / 2, rect.z);

  // Squarely in front of the middle of the rectangle, nose `depth` from the wall.
  const mid = world(rect.x, 0, rect.z);
  const car = bayPose(
    { x: mid.x, z: mid.z },
    { x: normal.x, z: normal.z },
    station.bay.depth + CAR_HALF_LENGTH,
  );
  // The car faces the wall, which is against the normal.
  car.heading = Math.atan2(-normal.x, -normal.z);

  const bayU = nearestU(model, new Vector3(car.x, 0, car.z));
  const clearing = {
    from: bayU - station.bay.clearBefore / model.length,
    to: bayU + station.bay.clearAfter / model.length,
  };

  // The pad runs from the road edge, along the normal, to the wall.
  const road = model.curve.getPointAt(bayU);
  const toCar = new Vector3(car.x - road.x, 0, car.z - road.z);
  const distanceToRoad = toCar.length();
  const edge = model.widthAt(bayU) / 2;
  const length = Math.max(
    0.1,
    distanceToRoad - edge + PAD_ROAD_OVERLAP + CAR_HALF_LENGTH + station.bay.depth,
  );
  const dir = normal.clone().negate();
  const origin = new Vector3(car.x, 0, car.z).addScaledVector(
    normal,
    distanceToRoad - edge + PAD_ROAD_OVERLAP,
  );

  return {
    car,
    wall: { corners, centre, normal, width: rect.width, height: rect.height },
    bayU,
    clearing,
    pad: { origin, dir, length, width: station.bay.width + PAD_EXTRA_WIDTH },
  };
}
