import { Vector3 } from 'three';
import { sampleAtmosphere } from '@/lib/atmosphere';
import type { QualityTier } from '@/lib/quality';
import { createRandom, range } from '@/lib/random';
import { resolvedZones } from '../atmosphere';
import { lamps } from '../Road/lamps';
import type { RouteModel } from '../Road/route';

export interface Tree {
  u: number;
  /** Foot of the trunk. */
  base: Vector3;
  /** Rotation about Y. Trees are built facing +Z, so this turns the long limbs toward the road. */
  yaw: number;
  /** Uniform scale, 0.85 to 1.15. */
  scale: number;
  /** Which of the shared tree shapes this one uses. */
  variant: number;
}

/** Distance between trees in a row, with a little jitter. */
const SPACING = 9;
const JITTER = 0.9;
const SEED = 1907;
/** Distance from the road edge to the foot of the plowed snow ridge's far side (ridge width plus margin). */
const BEHIND_RIDGE = 5.5;
/** Keep trunks this far from lamp poles. */
const LAMP_CLEARANCE = 3.5;
/** Keep trunks this far from an intersection, so side streets stay clear. */
const INTERSECTION_MARGIN = 6;

/**
 * Tree positions in a regular row along each side of the road, set back behind the plowed ridge.
 * The two rows are staggered by half a spacing. Rows are thinned by each zone's `trees` density
 * (many on the avenue, few downtown), broken at intersections, and kept clear of lamp poles.
 * Every tree is turned so its long limbs point at the road, so on a lined avenue the branches
 * from both sides arch over it. Deterministic.
 */
export function buildTrees(model: RouteModel, variantCount: number): Tree[] {
  const random = createRandom(SEED);
  const trees: Tree[] = [];

  for (let distance = 8; distance < model.length - 6; distance += SPACING) {
    for (const side of [-1, 1]) {
      // Always draw the same random numbers so one zone's density never shifts another's trees.
      const present = random();
      const along = range(random, -JITTER, JITTER);
      const out = range(random, -0.4, 0.4);
      const turn = range(random, -0.45, 0.45);
      const scale = range(random, 0.85, 1.15);
      const variant = Math.floor(random() * variantCount);

      const at = distance + along + (side === 1 ? SPACING / 2 : 0);
      if (at >= model.length - 6) continue;
      const u = at / model.length;
      if (present > sampleAtmosphere(resolvedZones, u).trees * 0.9) continue;
      if (model.inIntersection(u, INTERSECTION_MARGIN)) continue;

      const p = model.curve.getPointAt(u);
      const tangent = model.curve.getTangentAt(u);
      const lateral = new Vector3(tangent.z, 0, -tangent.x);
      const base = p
        .clone()
        .addScaledVector(lateral, side * (model.widthAt(u) / 2 + BEHIND_RIDGE + out));
      base.y = 0;

      const nearLamp = lamps.some(
        (lamp) => Math.hypot(lamp.pole.x - base.x, lamp.pole.z - base.z) < LAMP_CLEARANCE,
      );
      if (nearLamp) continue;

      const toRoad = lateral.clone().multiplyScalar(-side);
      trees.push({
        u,
        base,
        yaw: Math.atan2(toRoad.x, toRoad.z) + turn,
        scale,
        variant,
      });
    }
  }
  return trees;
}

/** Weak devices get half the trees (every other one). */
export function selectTreesForTier(trees: readonly Tree[], tier: QualityTier): Tree[] {
  return tier === 'low' ? trees.filter((_, i) => i % 2 === 0) : [...trees];
}
