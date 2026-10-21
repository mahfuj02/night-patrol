import { Vector3 } from 'three';
import { driveOffset } from '@/lib/lanes';
import type { Crossing } from '../Road/crossStreets';
import type { RouteModel } from '../Road/route';

export interface Mast {
  /** Foot of the pole. */
  x: number;
  z: number;
  height: number;
  /** The arm, from the top of the pole to its tip. */
  arm: { from: Vector3; to: Vector3 };
}

export interface SignalHead {
  x: number;
  y: number;
  z: number;
  /** Rotation about Y that points the head's local +z (its face) at oncoming traffic. */
  yaw: number;
  /** Which lamp is lit: green on the route, red on the cross street. */
  lit: 'green' | 'red';
  /** Set on a station's light: the station it belongs to. Its lamp changes with the car. */
  station?: number;
  /** Set on a station light that faces the traffic heading back toward the start. */
  back?: boolean;
}

export interface StopSign {
  /** Centre of the sign face. */
  x: number;
  y: number;
  z: number;
  /** Rotation about Y that points the sign's local +z at approaching traffic. */
  yaw: number;
  /** Height of the post. */
  post: number;
}

export interface Furniture {
  masts: Mast[];
  heads: SignalHead[];
  signs: StopSign[];
}

/** Gap between a pole and the edge of the road it stands beside, in metres. */
const POLE_OFFSET = 1.3;
/** How far a pole stands back from the crossing road's edge, along the road it is on. */
const POLE_SETBACK = 2.2;
const MAST_HEIGHT = 6.4;
const ARM_HEIGHT = 6.15;
const HEAD_HEIGHT = 5.3;
const SIGN_HEIGHT = 2.3;
const SIGN_POST = 2.7;
/** Stop signs stand this far beyond the main road edge and this far from the street edge. */
const SIGN_BACK = 1.6;
const SIGN_SIDE = 1.0;

const yawOf = (face: Vector3) => Math.atan2(face.x, face.z);
/** The vector to the right of travel along `v` (flat). */
const rightOf = (v: Vector3) => new Vector3(-v.z, 0, v.x);

/**
 * One mast arm over a road: the pole stands at `base` (beside the road, on its right), the arm
 * reaches across toward `across` (a unit vector pointing from the pole over the road), and a head
 * hangs over each lane centre. `reach` is the distance from the pole to the road centre line;
 * `lane` is how far each lane centre is from that line.
 */
export function mast(
  base: Vector3,
  across: Vector3,
  reach: number,
  lane: number,
  face: Vector3,
  lit: SignalHead['lit'],
): { mast: Mast; heads: SignalHead[] } {
  const tip = reach + lane + 0.4;
  const heads = [reach - lane, reach + lane].map((distance): SignalHead => ({
    x: base.x + across.x * distance,
    y: HEAD_HEIGHT,
    z: base.z + across.z * distance,
    yaw: yawOf(face),
    lit,
  }));
  return {
    mast: {
      x: base.x,
      z: base.z,
      height: MAST_HEIGHT,
      arm: {
        from: new Vector3(base.x, ARM_HEIGHT, base.z),
        to: new Vector3(base.x + across.x * tip, ARM_HEIGHT, base.z + across.z * tip),
      },
    },
    heads,
  };
}

/**
 * Traffic lights and stop signs at the crossings. At a `signals` crossing there is a mast arm for
 * traffic going each way on the route (green) and one for traffic coming from each end of the
 * cross street (red), each with a head over each lane. At a `stop` crossing a stop sign stands at
 * the right of each end of the cross street, facing traffic that comes up to the route.
 */
export function buildFurniture(crossings: readonly Crossing[]): Furniture {
  const out: Furniture = { masts: [], heads: [], signs: [] };

  for (const crossing of crossings) {
    const { centre, tangent, right, mainHalf, street } = crossing;
    const streetHalf = street.width / 2;

    if (crossing.control === 'signals') {
      const lane = driveOffset(mainHalf * 2);
      const reach = mainHalf + POLE_OFFSET;
      const setback = streetHalf + POLE_SETBACK;
      // Traffic going with the route, approaching from behind the crossing.
      const forward = mast(
        centre.clone().addScaledVector(tangent, -setback).addScaledVector(right, reach),
        right.clone().negate(),
        reach,
        lane,
        tangent.clone().negate(),
        'green',
      );
      // Oncoming traffic, approaching from beyond it.
      const oncoming = mast(
        centre.clone().addScaledVector(tangent, setback).addScaledVector(right, -reach),
        right.clone(),
        reach,
        lane,
        tangent.clone(),
        'green',
      );
      for (const part of [forward, oncoming]) {
        out.masts.push(part.mast);
        out.heads.push(...part.heads);
      }
      // Cross traffic, coming from each end of the street toward the route.
      for (const arm of crossing.arms) {
        const onRight = rightOf(arm.dir.clone().negate());
        const part = mast(
          centre
            .clone()
            .addScaledVector(arm.dir, mainHalf + POLE_SETBACK)
            .addScaledVector(onRight, streetHalf + POLE_OFFSET),
          onRight.clone().negate(),
          streetHalf + POLE_OFFSET,
          streetHalf / 2,
          arm.dir.clone(),
          'red',
        );
        out.masts.push(part.mast);
        out.heads.push(...part.heads);
      }
    }

    if (crossing.control === 'stop') {
      for (const arm of crossing.arms) {
        const onRight = rightOf(arm.dir.clone().negate());
        const at = centre
          .clone()
          .addScaledVector(arm.dir, mainHalf + SIGN_BACK)
          .addScaledVector(onRight, streetHalf + SIGN_SIDE);
        out.signs.push({
          x: at.x,
          y: SIGN_HEIGHT,
          z: at.z,
          yaw: yawOf(arm.dir),
          post: SIGN_POST,
        });
      }
    }
  }
  return out;
}

/** The mast of a station light stands this far past the line where the car stops. */
const STATION_MAST_AHEAD = 5;

/**
 * The signals at the stations, for both ways round the loop. Heading out, one mast over the right-hand
 * side of the route stands a little past where the car stops at the red light, with a head over each
 * lane facing the traffic that approaches. Heading back, the car stops at a light on the other side
 * of the stop, and a second mast stands over the route's left-hand side, past that light, facing the
 * traffic that comes back. They start green; the scene turns a station's heads red as the car
 * arrives (`station` says which, `back` which way).
 */
export function buildStationLights(
  model: RouteModel,
  stations: readonly { index: number; lightT: number; stopT: number }[],
): { masts: Mast[]; heads: SignalHead[] } {
  const out: { masts: Mast[]; heads: SignalHead[] } = { masts: [], heads: [] };
  for (const { index, lightT, stopT } of stations) {
    for (const back of [false, true]) {
      // Heading back the light is as far past the stop as it is before it heading out.
      const at = back ? 2 * stopT - lightT : lightT;
      const u = at + ((back ? -1 : 1) * STATION_MAST_AHEAD) / model.length;
      const centre = model.curve.getPointAt(u);
      const t = model.curve.getTangentAt(u);
      t.y = 0;
      t.normalize();
      const right = new Vector3(-t.z, 0, t.x);
      const half = model.widthAt(u) / 2;
      const reach = half + POLE_OFFSET;
      const side = back ? -1 : 1;
      const part = mast(
        centre.clone().addScaledVector(right, reach * side),
        right.clone().multiplyScalar(-side),
        reach,
        driveOffset(half * 2),
        back ? t.clone() : t.clone().negate(),
        'green',
      );
      out.masts.push(part.mast);
      out.heads.push(...part.heads.map((head) => ({ ...head, station: index, back })));
    }
  }
  return out;
}
