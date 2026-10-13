import { Vector3 } from 'three';
import type { LampType } from '@/content/schema';
import { sampleAtmosphere, type RGB } from '@/lib/atmosphere';
import { resolvedZones } from '../atmosphere';
import type { RouteModel } from './route';

export interface Lamp {
  /** Arc-length fraction along the route. */
  u: number;
  type: LampType;
  /** Foot of the pole. */
  pole: Vector3;
  /** The light source, at the end of the arm. */
  head: Vector3;
  height: number;
  /** Light colour and strength, taken from the zone the lamp stands in. */
  color: RGB;
  intensity: number;
}

interface LampSpec {
  spacing: number;
  height: number;
  /** Horizontal reach of the arm toward the road. */
  arm: number;
  /** Lamps alternate sides of the road; otherwise they all stand on one side. */
  alternate: boolean;
}

// Cool LED cobra-heads on tall poles along avenues, shorter sodium lamps in the old streets,
// low warm lanterns near the river (see docs/art-reference.md).
const SPECS: Record<LampType, LampSpec> = {
  sodium: { spacing: 30, height: 7.5, arm: 1.6, alternate: true },
  led: { spacing: 38, height: 9.5, arm: 2.4, alternate: false },
  warm: { spacing: 26, height: 5.5, arm: 1.0, alternate: true },
};

/** Lamp positions along both edges of the route, in order of `u`. Deterministic. */
export function buildLamps(model: RouteModel): Lamp[] {
  const lamps: Lamp[] = [];
  let distance = SPECS.sodium.spacing / 2;
  let flip = 1;

  while (distance < model.length) {
    const u = distance / model.length;
    const atmosphere = sampleAtmosphere(resolvedZones, u);
    const spec = SPECS[atmosphere.lampType];
    const side = spec.alternate ? flip : 1;
    flip = -flip;

    const p = model.curve.getPointAt(u);
    const tangent = model.curve.getTangentAt(u);
    // Lateral direction matches the road ribbon: (tangent.z, 0, -tangent.x).
    const lateral = new Vector3(tangent.z, 0, -tangent.x);
    const offset = model.widthAt(u) / 2 + 1;
    const pole = p.clone().addScaledVector(lateral, side * offset);
    const head = pole.clone().addScaledVector(lateral, -side * spec.arm);
    head.y = spec.height;

    lamps.push({
      u,
      type: atmosphere.lampType,
      pole,
      head,
      height: spec.height,
      color: [...atmosphere.lightColor],
      intensity: atmosphere.lightIntensity,
    });
    distance += spec.spacing;
  }
  return lamps;
}
