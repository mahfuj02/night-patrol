import { Vector3 } from 'three';
import type { BuildingStretch, BuildingStyle } from '@/content/schema';
import { sampleAtmosphere } from '@/lib/atmosphere';
import { rectOutline, rectsOverlap, type Rect } from '@/lib/footprint';
import type { QualityTier } from '@/lib/quality';
import { createRandom, range } from '@/lib/random';
import { resolvedZones } from '../atmosphere';
import type { Crossing } from '../Road/crossStreets';
import type { PathModel } from '../Road/route';

export interface Building {
  stretchId: string;
  style: BuildingStyle;
  /** Arc-length fraction of the lot centre. */
  u: number;
  /** -1 left of travel, 1 right. */
  side: -1 | 1;
  /** Part of a continuous street wall: neighbours on this side may touch and overlap. */
  attached: boolean;
  /** Footprint: width runs along the road, depth away from it. */
  footprint: Rect;
  /** Wall height in metres (without roof). */
  height: number;
  roof: { kind: 'flat' } | { kind: 'gable'; height: number; ridgeAcross: boolean };
  /** Upper tier of a tower: a smaller block on top. */
  crown?: { scale: number; height: number };
  garage?: Rect & { height: number };
  /** A warm light by the front door, in world coordinates. */
  porch?: { x: number; y: number; z: number };
  /** Index into the style's colour list. */
  colour: number;
  /** Set on buildings along a cross street: the id of its crossing. */
  armOf?: string;
  /** Whole-number seed for the window pattern. */
  seed: number;
  /** Share of windows lit warm and cool, already scaled for the stretch and the zone. */
  warm: number;
  cool: number;
}

const SEED = 4242;
/** A stretch whose largest gap is this small or less is a continuous, attached street wall. */
export const ATTACHED_MAX_GAP = 1.5;
/** Attached neighbours are widened by this much so they overlap, hiding wedges on bends. */
const ATTACHED_OVERLAP = 1.2;
/** Keep lots this far from an intersection gap, so side streets stay clear. */
const INTERSECTION_MARGIN = 3;
/** Buildings stay this far beyond the road edge, and this far from each other. */
const ROAD_CLEARANCE = 3;
const NEIGHBOUR_CLEARANCE = 1;
/** On a tight bend a lot that touches the road steps back by these extra metres until it fits. */
const STEP_BACK = [0, 1.5, 3, 4.5];
const COLOUR_COUNT = 4;
/** Buildings line a cross street from here to here, in metres from the main road's edge. */
const JUNCTION_LOTS_FROM = 4;
const STREET_BUILT_LENGTH = 70;
const SAMPLE_STEP = 4;
/** Chance that a house has a porch light, and its height above the ground. */
const PORCH_CHANCE = 0.8;
const PORCH_HEIGHT = 2.3;

interface RoadSample {
  x: number;
  z: number;
  reach: number;
}

function sampleRoad(model: PathModel): RoadSample[] {
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
export function stretchRange(model: PathModel, stretch: BuildingStretch): [number, number] {
  const from = model.stopFractions.get(stretch.from) ?? 0;
  const to = model.stopFractions.get(stretch.to) ?? 1;
  const start = from * model.length + (stretch.fromOffset ?? 0);
  const end = to * model.length + (stretch.toOffset ?? 0);
  return [Math.max(0, start), Math.min(model.length, end)];
}

interface Placed {
  rect: Rect;
  stretchIndex: number;
  side: -1 | 1;
  attached: boolean;
}

/**
 * Buildings along both sides of the route, stretch by stretch. Lots are laid end to end, set back
 * from the road edge by the stretch's `setback`. Attached stretches (gap 1.5 m or less) form a
 * continuous street wall: lots touch, overlap slightly, and run right up to each intersection,
 * where the last lot is shortened to fit. A lot that would touch the road on a bend steps back a
 * little instead of leaving a hole. Window lighting comes from the zone at each lot, scaled by the
 * stretch. `reserved` is ground held for landmarks: no lot overlaps it. Deterministic: every lot draws the same random numbers whether it is built or not.
 */
export function buildBuildings(
  model: PathModel,
  stretches: readonly BuildingStretch[],
  crossings: readonly Crossing[] = [],
  reserved: readonly Rect[] = [],
): Building[] {
  const mainSamples = sampleRoad(model);
  const buildings: Building[] = [];
  const taken: Placed[] = [];
  const centre = new Vector3();
  const tangent = new Vector3();

  const lay = (
    path: PathModel,
    stretch: BuildingStretch,
    stretchIndex: number,
    [start, end]: [number, number],
    samples: readonly RoadSample[],
    armOf?: string,
  ) => {
    // Intersection gaps in metres along the road, widened by the margin.
    const gaps = path.intersections.map((x): [number, number] => [
      x.from * path.length - INTERSECTION_MARGIN,
      x.to * path.length + INTERSECTION_MARGIN,
    ]);
    const attached = stretch.gap[1] <= ATTACHED_MAX_GAP;
    const minWidth = stretch.lotWidth[0] * 0.5;

    for (const side of [-1, 1] as const) {
      const free = (rect: Rect) =>
        !touchesRoad(rect, samples) &&
        !reserved.some((r) => rectsOverlap(rect, r, NEIGHBOUR_CLEARANCE)) &&
        !taken.some(
          (t) =>
            !(attached && t.attached && t.stretchIndex === stretchIndex && t.side === side) &&
            rectsOverlap(rect, t.rect, NEIGHBOUR_CLEARANCE),
        );

      const random = createRandom(SEED + stretchIndex * 31 + (side === 1 ? 7 : 0));
      const firstOffset = range(random, 0, 3);
      let distance = start + (attached ? 0 : firstOffset);
      for (;;) {
        const lotWidth = range(random, ...stretch.lotWidth);
        const gap = range(random, ...stretch.gap);
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
        const porch = random();
        const porchSide = random() < 0.5 ? -1 : 1;

        // Shorten the lot to the stretch end and to the next intersection; skip it if too short.
        let width = Math.min(lotWidth, end - distance);
        if (width < minWidth) break;
        const lotStart = distance;
        let next = lotStart + width + gap;
        const blocking = gaps.find(([from, to]) => lotStart < to && lotStart + width > from);
        if (blocking) {
          const room = blocking[0] - lotStart;
          if (lotStart >= blocking[0] || room < minWidth) {
            distance = blocking[1];
            continue;
          }
          width = room;
          next = blocking[1];
        }
        distance = next;

        if (present > stretch.density) continue;
        const at = lotStart + width / 2;
        const u = at / path.length;

        path.curve.getPointAt(u, centre);
        path.curve.getTangentAt(u, tangent);
        // Right of travel, and the yaw that turns local +x onto the tangent.
        const rightX = -tangent.z;
        const rightZ = tangent.x;
        const yaw = Math.atan2(-tangent.z, tangent.x);

        let footprint: Rect | undefined;
        for (const extra of attached ? STEP_BACK : [0]) {
          const out = side * (path.widthAt(u) / 2 + stretch.setback + extra + depth / 2);
          const candidate: Rect = {
            x: centre.x + rightX * out,
            z: centre.z + rightZ * out,
            yaw,
            width: attached ? width + ATTACHED_OVERLAP : width,
            depth,
          };
          if (free(candidate)) {
            footprint = candidate;
            break;
          }
        }
        if (!footprint) continue;

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
          const along = garageShift * Math.max(0, width / 2 - garageSize[0] / 2);
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

        let porchLight: Building['porch'];
        if (stretch.style === 'house' && porch < PORCH_CHANCE) {
          // On the wall facing the road, to one side of the front door.
          const toward = -side * (depth / 2 + 0.15);
          const along = porchSide * width * 0.3;
          porchLight = {
            x: footprint.x + rightX * toward + tangent.x * along,
            y: PORCH_HEIGHT,
            z: footprint.z + rightZ * toward + tangent.z * along,
          };
        }

        const atmosphere = sampleAtmosphere(resolvedZones, path.zoneU ?? u);
        buildings.push({
          stretchId: stretch.id,
          style: stretch.style,
          u,
          side,
          attached,
          ...(armOf ? { armOf } : {}),
          footprint,
          height,
          roof,
          ...(crownTier ? { crown: crownTier } : {}),
          ...(garageRect ? { garage: garageRect } : {}),
          ...(porchLight ? { porch: porchLight } : {}),
          colour,
          seed,
          warm: atmosphere.windowsWarm * stretch.lit,
          cool: atmosphere.windowsCool * stretch.lit,
        });
        taken.push({ rect: footprint, stretchIndex, side, attached });
        if (garageRect) taken.push({ rect: garageRect, stretchIndex, side, attached: false });
      }
    }
  };

  stretches.forEach((stretch, index) =>
    lay(model, stretch, index, stretchRange(model, stretch), mainSamples),
  );

  // Cross streets: the same style as the stretch the crossing sits in, along the first stretch of
  // each arm. They avoid the main road, every cross street and the buildings already placed.
  const armSamples = crossings.flatMap((c) => c.arms.flatMap((arm) => sampleRoad(arm.model)));
  const roadSamples = [...mainSamples, ...armSamples];
  crossings.forEach((crossing, crossingIndex) => {
    const at = crossing.u * model.length;
    const index = stretches.findIndex((s) => {
      const [from, to] = stretchRange(model, s);
      return at >= from && at <= to;
    });
    const stretch = stretches[index];
    if (!stretch) return;
    crossing.arms.forEach((arm, armIndex) => {
      const lane = { ...stretch, id: `${crossing.id}-street` };
      const range: [number, number] = [
        JUNCTION_LOTS_FROM,
        Math.min(arm.length, STREET_BUILT_LENGTH),
      ];
      lay(
        arm.model,
        lane,
        stretches.length + crossingIndex * 2 + armIndex,
        range,
        roadSamples,
        crossing.id,
      );
    });
  });
  return buildings;
}

/** The low tier builds every other building, except in attached stretches, which stay whole. */
export function selectBuildingsForTier(
  buildings: readonly Building[],
  tier: QualityTier,
): Building[] {
  return tier === 'low' ? buildings.filter((b, i) => b.attached || i % 2 === 0) : [...buildings];
}
