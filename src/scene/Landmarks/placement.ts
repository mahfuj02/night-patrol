import { Vector3 } from 'three';
import { stops } from '@/content/stops';
import type { Rect } from '@/lib/footprint';
import type { RouteModel } from '../Road/route';

/** Where a landmark stands: beside the route, measured from its stop. */
export interface LandmarkPlacement {
  stopId: string;
  /** Metres along the road from the stop to the centre of the landmark; negative is before it. */
  offset: number;
  /** -1 on the left of travel, 1 on the right. */
  side: -1 | 1;
  /** Depth away from the road, in metres. */
  depth: number;
  /** Gap between the road edge and the landmark front. */
  setback: number;
  /** Local-x extent kept free of ordinary buildings: from `min` (ahead) to `max` (behind). */
  reserved: { min: number; max: number };
}

/**
 * The RRC Polytechnic campus: on the left of the route, just before the Princess St intersection
 * (which is 16 m past the stop). The campus block is centred 4 m before the stop, so its ahead end
 * stops at the intersection gap. The limestone and brick neighbours and the lower step stand behind
 * it along the same wall, so the reserved stretch covers all of them.
 */
export const rrcPlacement: LandmarkPlacement = {
  stopId: 'rrc-campus',
  offset: -4,
  side: -1,
  depth: 14,
  setback: 7.5,
  reserved: { min: -10, max: 44 },
};

/**
 * The Exchange District warehouses: three attached brick warehouses on the left of the route, from
 * 10 m before the stop to 26 m past it (the route bends left here, so the left side is the inner
 * bend; this spot keeps clear of the road and of the Princess St intersection). The venue with the
 * marquee sign is the middle one.
 */
export const warehousesPlacement: LandmarkPlacement = {
  stopId: 'exchange-warehouses',
  offset: 8,
  side: -1,
  depth: 12,
  setback: 7.5,
  reserved: { min: -19, max: 19 },
};

/**
 * The City services building: a civic hall on the left of the route at the stop, on the outer side
 * of the gentle right bend, with a lower brick annex behind it (toward +x). The route is straight
 * and clear of intersections here.
 */
export const cityServicesPlacement: LandmarkPlacement = {
  stopId: 'city-services',
  offset: 0,
  side: -1,
  depth: 14,
  setback: 7.5,
  reserved: { min: -12, max: 28 },
};

/**
 * The RoleReady tower: on the left of the route just past the Portage & Main intersection, which
 * ends 22 m after the stop (the stop is the intersection itself, so a landmark cannot stand at it).
 * The camera at the stop sees it ahead on the left.
 */
export const roleReadyPlacement: LandmarkPlacement = {
  stopId: 'portage-main',
  offset: 38,
  side: -1,
  depth: 14,
  setback: 7.5,
  reserved: { min: -13, max: 13 },
};

/**
 * The Millennium Library: on the left of the route on the first straight after Portage & Main,
 * about 600 m along. A wide glazed front with a lit lobby (the Projects station parks in front of it).
 */
export const libraryPlacement: LandmarkPlacement = {
  stopId: 'millennium-library',
  offset: 0,
  side: -1,
  depth: 16,
  setback: 7.5,
  reserved: { min: -22, max: 22 },
};

/**
 * The Skills building: a tech building on the RIGHT of the route on the second straight after
 * Portage & Main, about 700 m along (the Library is on the left 100 m before it, so the two station
 * patterns differ). The Skills station parks in front of it.
 */
export const skillsPlacement: LandmarkPlacement = {
  stopId: 'skills-station',
  offset: 0,
  side: 1,
  depth: 16,
  setback: 7.5,
  reserved: { min: -20, max: 20 },
};

/**
 * The LIILAB office: a small glass office on the RIGHT of the route on the third straight, about
 * 940 m along, on the avenue. The Experience station parks in front of it.
 */
export const officePlacement: LandmarkPlacement = {
  stopId: 'liilab-office',
  offset: 0,
  side: 1,
  depth: 14,
  setback: 7.5,
  reserved: { min: -16, max: 16 },
};

/** Every landmark that stands on the route, so ordinary buildings can leave its ground free. */
export const landmarkPlacements: readonly LandmarkPlacement[] = [
  rrcPlacement,
  warehousesPlacement,
  cityServicesPlacement,
  roleReadyPlacement,
  libraryPlacement,
  skillsPlacement,
  officePlacement,
];

/**
 * Scenery: lit buildings beside the route with no stop and no panel. Each is anchored to a stop that
 * exists (the dashcam, The Forks) by an offset in metres, like a landmark, but is kept apart from
 * `landmarkPlacements` because it belongs to no stop. Ordinary buildings leave its ground free.
 */
export interface SceneryPlacement extends LandmarkPlacement {
  id: 'warm-house' | 'museum' | 'esplanade-riel';
}

/**
 * The warm-windowed house on the residential street, just past the dashcam stop on the left, so it
 * is in view while parked there. It has warm windows only: no figures, no text (CLAUDE.md rule 9).
 */
export const warmHousePlacement: SceneryPlacement = {
  id: 'warm-house',
  stopId: 'dashcam',
  offset: 14,
  side: -1,
  depth: 9,
  setback: 12,
  reserved: { min: -12, max: 12 },
};

/** The Canadian Museum for Human Rights, on the avenue: a lit glass tower on a stone base, no lettering. */
export const museumPlacement: SceneryPlacement = {
  id: 'museum',
  stopId: 'the-forks',
  offset: -112,
  side: -1,
  depth: 22,
  setback: 14,
  reserved: { min: -26, max: 26 },
};

/** Esplanade Riel: a footbridge with a glowing spire and cable stays, beyond the museum. */
export const esplanadePlacement: SceneryPlacement = {
  id: 'esplanade-riel',
  stopId: 'the-forks',
  offset: -52,
  side: -1,
  depth: 6,
  setback: 24,
  reserved: { min: -20, max: 20 },
};

export const sceneryPlacements: readonly SceneryPlacement[] = [
  warmHousePlacement,
  museumPlacement,
  esplanadePlacement,
];

export interface LandmarkFrame {
  /** Centre of the footprint at ground level. */
  position: Vector3;
  /** Rotation about Y. Local +z points away from the road and local -z faces it. */
  yaw: number;
  /** Local +x is the direction along the wall away from the stop's onward direction. */
  stopT: number;
}

/**
 * The position and orientation of a landmark. Local +z points away from the road, so the front
 * (facing the road) is -z. On the left of the route local +x runs back along the road, so the
 * viewer standing on the road and looking at the front has local +x on their left.
 */
export function landmarkFrame(model: RouteModel, placement: LandmarkPlacement): LandmarkFrame {
  const stopFraction = model.stopFractions.get(placement.stopId);
  const stop = stops.find((s) => s.id === placement.stopId);
  if (stopFraction === undefined || !stop) {
    throw new Error(`Landmark stop ${placement.stopId} is not on the route`);
  }
  const u = stopFraction + placement.offset / model.length;
  const centre = model.curve.getPointAt(u);
  const tangent = model.curve.getTangentAt(u);
  const right = new Vector3(-tangent.z, 0, tangent.x);
  const out = placement.side * (model.widthAt(u) / 2 + placement.setback + placement.depth / 2);
  const position = centre.addScaledVector(right, out);
  position.y = 0;
  // Local x along the tangent and local z to the right, turned half a turn on the left side so
  // that local +z points away from the road.
  const yaw = Math.atan2(-tangent.z, tangent.x) + (placement.side === -1 ? Math.PI : 0);
  return { position, yaw, stopT: stop.t };
}

/** A rectangle on the ground covering the reserved local-x stretch of a landmark. */
export function reservedRect(frame: LandmarkFrame, placement: LandmarkPlacement): Rect {
  const { min, max } = placement.reserved;
  const mid = (min + max) / 2;
  // Local +x in world space: (cos yaw, -sin yaw).
  return {
    x: frame.position.x + Math.cos(frame.yaw) * mid,
    z: frame.position.z - Math.sin(frame.yaw) * mid,
    yaw: frame.yaw,
    width: max - min,
    depth: placement.depth,
  };
}

/**
 * The frame of a piece of scenery. It has no stop of its own, so its `stopT` is the route position
 * of its own centre: the glow rises as the car approaches it and falls as it leaves (scenery also
 * keeps a steady light, see `Landmark`'s `minGlow`).
 */
export function sceneryFrame(model: RouteModel, placement: SceneryPlacement): LandmarkFrame {
  const frame = landmarkFrame(model, placement);
  const stopFraction = model.stopFractions.get(placement.stopId)!;
  return { ...frame, stopT: stopFraction + placement.offset / model.length };
}
