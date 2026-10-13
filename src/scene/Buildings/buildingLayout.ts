import { Vector3 } from 'three';
import type { BuildingStretch, BuildingStyle } from '@/content/schema';
import { sampleAtmosphere } from '@/lib/atmosphere';
import { rectOutline, rectsOverlap, type Rect } from '@/lib/footprint';
import type { QualityTier } from '@/lib/quality';
import { createRandom, range } from '@/lib/random';
import { resolvedZones } from '../atmosphere';
import type { RouteModel } from '../Road/route';

export interface Building {
  stretchId: string;
  style: BuildingStyle;
  /** Arc-length fraction of the lot centre. */
  u: number;
  /** -1 left of travel, 1 right. */
  side: -1 | 1;
  /** Footprint: width runs along the road, depth away from it. */
  footprint: Rect;
  /** Wall height in metres (without roof). */
  height: number;
  roof: { kind: 'flat' } | { kind: 'gable'; height: number; ridgeAcross: boolean };
  /** Upper tier of a tower: a smaller block on top. */
  crown?: { scale: number; height: number };
  garage?: Rect & { height: number };
  /** Index into the style's colour list. */
  colour: number;
  /** Random value for the window pattern. */
  seed: number;
  /** Share of windows lit warm and cool, already scaled for the stretch and the zone. */
  warm: number;
  cool: number;
}

const SEED = 4242;
/** Gap between neighbouring lots along the road, per style. */
const GAPS: Record<BuildingStyle, [number, number]> = {
  warehouse: [0, 1.5],
  tower: [2, 5],
  house: [2.5, 5],
};
/** Keep lots this far from an intersection gap, so side streets stay clear. */
const INTERSECTION_MARGIN = 3;
/** Buildings stay this far beyond the road edge, and this far from each other. */
const ROAD_CLEARANCE = 3;
const NEIGHBOUR_CLEARANCE = 1;
const COLOUR_COUNT = 4;
const SAMPLE_STEP = 4;

interface RoadSample {
  x: number;
  z: number;
  reach: number;
}

function sampleRoad(model: RouteModel): RoadSample[] {
  const samples: RoadSample[] = [];
  const point = new Vector3();
  const steps = Math.ceil(model.length / SAMPLE_STEP);
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    model.curve.getPointAt(u, point);
    samples.push({ x: point.x, z: point.z, reach: model.widthAt(u) / 2 + ROAD_CLEARANCE });
  }
  return samples;
}

function touchesRoad(rect: Rect, samples: readonly RoadSample[]): boolean {
  return rectOutline(rect).some(([x, z]) =>
    samples.some((s) => (s.x - x) ** 2 + (s.z - z) ** 2 < s.reach ** 2),
  );
}

/** Arc-length range of a stretch, in metres, clamped to the route. */
export function stretchRange(model: RouteModel, stretch: BuildingStretch): [number, number] {
  const from = model.stopFractions.get(stretch.from) ?? 0;
  const to = model.stopFractions.get(stretch.to) ?? 1;
  const start = from * model.length + (stretch.fromOffset ?? 0);
  const end = to * model.length + (stretch.toOffset ?? 0);
  return [Math.max(0, start), Math.min(model.length, end)];
}

/**
 * Buildings along both sides of the route, stretch by stretch. Lots are laid end to end, set back
 * from the road edge by the stretch's `setback`, and skipped where they would touch the road,
 * another building or an intersection gap. Window lighting comes from the zone at each lot, scaled
 * by the stretch. Deterministic: every lot draws the same random numbers whether it is built or not.
 */
export function buildBuildings(
  model: RouteModel,
  stretches: readonly BuildingStretch[],
): Building[] {
  const samples = sampleRoad(model);
  const buildings: Building[] = [];
  const taken: Rect[] = [];
  const centre = new Vector3();
  const tangent = new Vector3();

  const free = (rect: Rect) =>
    !touchesRoad(rect, samples) && !taken.some((t) => rectsOverlap(rect, t, NEIGHBOUR_CLEARANCE));

  stretches.forEach((stretch, stretchIndex) => {
    const [start, end] = stretchRange(model, stretch);
    for (const side of [-1, 1] as const) {
      const random = createRandom(SEED + stretchIndex * 31 + (side === 1 ? 7 : 0));
      let distance = start + range(random, 0, 3);
      for (;;) {
        const lotWidth = range(random, ...stretch.lotWidth);
        const gap = range(random, ...GAPS[stretch.style]);
        const depth = range(random, ...stretch.depth);
        const height = range(random, ...stretch.height);
        const present = random();
        const gable = random();
        const ridge = random();
        const crown = random();
        const garage = random();
        const colour = Math.floor(random() * COLOUR_COUNT);
        const seed = Math.floor(random() * 1000);
        const garageShift = range(random, -1, 1);
        const garageSize = [range(random, 5.5, 7), range(random, 5, 6.5)] as const;

        if (distance + lotWidth > end) break;
        const at = distance + lotWidth / 2;
        const lotStart = distance;
        distance += lotWidth + gap;

        if (present > stretch.density) continue;
        const u = at / model.length;
        if (
          model.inIntersection(u, INTERSECTION_MARGIN) ||
          model.inIntersection(lotStart / model.length, INTERSECTION_MARGIN) ||
          model.inIntersection((lotStart + lotWidth) / model.length, INTERSECTION_MARGIN)
        ) {
          continue;
        }

        model.curve.getPointAt(u, centre);
        model.curve.getTangentAt(u, tangent);
        // Right of travel, and the yaw that turns local +x onto the tangent.
        const rightX = -tangent.z;
        const rightZ = tangent.x;
        const yaw = Math.atan2(-tangent.z, tangent.x);
        const out = side * (model.widthAt(u) / 2 + stretch.setback + depth / 2);
        const footprint: Rect = {
          x: centre.x + rightX * out,
          z: centre.z + rightZ * out,
          yaw,
          width: lotWidth,
          depth,
        };
        if (!free(footprint)) continue;

        let roof: Building['roof'] = { kind: 'flat' };
        let crownTier: Building['crown'];
        if (stretch.style === 'house') {
          if (gable < 0.6) {
            roof = { kind: 'gable', height: 2.3 + gable * 2, ridgeAcross: ridge < 0.3 };
          }
        } else if (stretch.style === 'tower' && crown < 0.65) {
          crownTier = {
            scale: 0.55 + crown * 0.3,
            height: Math.max(3, height * (0.08 + ridge * 0.1)),
          };
        }

        let garageRect: Building['garage'];
        if (stretch.style === 'house' && garage < (stretch.garage ?? 0)) {
          const behind = side * (depth / 2 + garageSize[1] / 2 + 2.5);
          const along = garageShift * Math.max(0, lotWidth / 2 - garageSize[0] / 2);
          const candidate: Rect = {
            x: footprint.x + rightX * behind + tangent.x * along,
            z: footprint.z + rightZ * behind + tangent.z * along,
            yaw,
            width: garageSize[0],
            depth: garageSize[1],
          };
          if (free(candidate) && !rectsOverlap(candidate, footprint, 1)) {
            garageRect = { ...candidate, height: 3 };
          }
        }

        const atmosphere = sampleAtmosphere(resolvedZones, u);
        buildings.push({
          stretchId: stretch.id,
          style: stretch.style,
          u,
          side,
          footprint,
          height,
          roof,
          ...(crownTier ? { crown: crownTier } : {}),
          ...(garageRect ? { garage: garageRect } : {}),
          colour,
          seed,
          warm: atmosphere.windowsWarm * stretch.lit,
          cool: atmosphere.windowsCool * stretch.lit,
        });
        taken.push(footprint);
        if (garageRect) taken.push(garageRect);
      }
    }
  });
  return buildings;
}

/** The low tier builds every other building. */
export function selectBuildingsForTier(
  buildings: readonly Building[],
  tier: QualityTier,
): Building[] {
  return tier === 'low' ? buildings.filter((_, i) => i % 2 === 0) : [...buildings];
}
