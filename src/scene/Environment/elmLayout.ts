import { Vector3 } from 'three';
import { sampleAtmosphere } from '@/lib/atmosphere';
import type { QualityTier } from '@/lib/quality';
import { createRandom, range } from '@/lib/random';
import { resolvedZones } from '../atmosphere';
import { lamps } from '../Road/lamps';
import type { RouteModel } from '../Road/route';

export interface Elm {
  u: number;
  /** Foot of the trunk. */
  base: Vector3;
  height: number;
  canopyWidth: number;
  yaw: number;
  /** Horizontal shift of the canopy toward the road, so branches arch over it. */
  lean: Vector3;
}

const SPACING = 17;
const SEED = 1907;
/** Keep trunks this far from lamp poles. */
const LAMP_CLEARANCE = 3.5;

/**
 * Elm positions along both sides of the route, thinned by each zone's `trees` density (so the
 * avenue is lined with them and downtown is nearly bare). Deterministic.
 */
export function buildElms(model: RouteModel): Elm[] {
  const random = createRandom(SEED);
  const elms: Elm[] = [];

  for (let distance = 9; distance < model.length - 5; distance += SPACING) {
    for (const side of [-1, 1]) {
      // Always draw the same random numbers so one zone's density never shifts another's trees.
      const present = random();
      const along = range(random, -3, 3);
      const offsetOut = range(random, 3.2, 6);
      const height = range(random, 11, 15);
      const canopyWidth = range(random, 11, 15);
      const yaw = range(random, 0, Math.PI * 2);

      const u = Math.min(0.999, Math.max(0.001, (distance + along) / model.length));
      const density = sampleAtmosphere(resolvedZones, u).trees;
      if (present > density * 0.9) continue;

      const p = model.curve.getPointAt(u);
      const tangent = model.curve.getTangentAt(u);
      const lateral = new Vector3(tangent.z, 0, -tangent.x);
      const base = p.clone().addScaledVector(lateral, side * (model.widthAt(u) / 2 + offsetOut));
      base.y = 0;

      const nearLamp = lamps.some(
        (lamp) => Math.hypot(lamp.pole.x - base.x, lamp.pole.z - base.z) < LAMP_CLEARANCE,
      );
      if (nearLamp) continue;

      elms.push({
        u,
        base,
        height,
        canopyWidth,
        yaw,
        lean: lateral.clone().multiplyScalar(-side * canopyWidth * 0.12),
      });
    }
  }
  return elms;
}

/** Weak devices get half the trees (every other one). */
export function selectElmsForTier(elms: readonly Elm[], tier: QualityTier): Elm[] {
  return tier === 'low' ? elms.filter((_, i) => i % 2 === 0) : [...elms];
}
