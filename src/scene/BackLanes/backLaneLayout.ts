import { Vector3 } from 'three';
import type { BackLanes, BuildingStretch } from '@/content/schema';
import { rectsOverlap, type Rect } from '@/lib/footprint';
import type { QualityTier } from '@/lib/quality';
import { createRandom } from '@/lib/random';
import { world, type WorldToken } from '@/lib/palette';
import { stretchRange, type Building } from '../Buildings/buildingLayout';
import type { RouteModel } from '../Road/route';

export interface Pole {
  x: number;
  z: number;
  /** Rotation about Y that lays the cross arm along the pole line. */
  yaw: number;
  height: number;
}

export interface Fence {
  x: number;
  z: number;
  /** Rotation about Y; the fence runs along local x. */
  yaw: number;
  length: number;
  colour: string;
}

export interface Bin {
  x: number;
  z: number;
  yaw: number;
  colour: string;
}

export interface BackLaneProps {
  poles: Pole[];
  /** Wire segments as flat endpoints: x1, y1, z1, x2, y2, z2, ... */
  wires: number[];
  fences: Fence[];
  bins: Bin[];
}

const SEED = 8128;
/** Poles stay this far from an intersection gap, so they never stand in a cross street. */
const POLE_GAP_MARGIN = 8;
/** Positions tried along the lane, in metres from the ideal spot, when a pole is blocked. */
const POLE_SHIFTS = [0, 4, -4, 8, -8, 12, -12];
/** Height of the cross arm below the top of the pole, and the three wire offsets along it. */
const ARM_DROP = 0.6;
const WIRE_OFFSETS = [-0.9, 0, 0.9] as const;
/** How far a wire sags between two poles, and how many segments it is drawn in. */
const WIRE_SAG = 0.7;
const WIRE_SEGMENTS = 6;
/** The fence runs this far behind the back of the house row. */
const FENCE_BACK = 11;
const BIN_COLOURS: readonly WorldToken[] = ['binBlue', 'binGreen', 'binGrey'];
const FENCE_COLOURS: readonly WorldToken[] = ['fenceWood', 'fenceWeathered'];

/** The wire points between two poles: a gentle sag, as flat segment endpoints. */
function wireBetween(a: Pole, b: Pole, armY: number, offset: number): number[] {
  // The wires hang from the arm, offset along its direction (the pole line).
  const lx = Math.cos(a.yaw);
  const lz = -Math.sin(a.yaw);
  const points: Vector3[] = [];
  for (let i = 0; i <= WIRE_SEGMENTS; i++) {
    const t = i / WIRE_SEGMENTS;
    points.push(
      new Vector3(
        a.x + (b.x - a.x) * t + lx * offset,
        armY - WIRE_SAG * 4 * t * (1 - t),
        a.z + (b.z - a.z) * t + lz * offset,
      ),
    );
  }
  return points.slice(1).flatMap((p, i) => {
    const q = points[i]!;
    return [q.x, q.y, q.z, p.x, p.y, p.z];
  });
}

/**
 * Back lane scenery behind the houses: a line of wooden power poles with wires on each side of
 * the route, a fence along the back (and one side) of most lots, and a pair of city bins by many
 * houses. Everything keeps clear of the buildings, their garages and the intersections.
 * Deterministic.
 */
export function buildBackLanes(
  model: RouteModel,
  buildings: readonly Building[],
  stretches: readonly BuildingStretch[],
  config: BackLanes,
): BackLaneProps {
  const random = createRandom(SEED);
  const houses = buildings.filter((b) => b.style === 'house');
  const solids: Rect[] = buildings.flatMap((b) =>
    b.garage ? [b.footprint, b.garage] : [b.footprint],
  );
  const fits = (rect: Rect, margin = 0.3) => !solids.some((s) => rectsOverlap(rect, s, margin));

  const props: BackLaneProps = { poles: [], wires: [], fences: [], bins: [] };

  // Fences and bins, house by house. Every house draws the same random numbers.
  for (const house of houses) {
    const { x, z, yaw, width, depth } = house.footprint;
    const out = house.side;
    const outward = new Vector3(Math.sin(yaw), 0, Math.cos(yaw)).multiplyScalar(out);
    const along = new Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const fenceRoll = random();
    const sideRoll = random();
    const fenceColour = world[FENCE_COLOURS[Math.floor(random() * FENCE_COLOURS.length)]!];
    const binRoll = random();
    const binColours = [random(), random()].map(
      (r) => world[BIN_COLOURS[Math.floor(r * BIN_COLOURS.length)]!],
    );

    if (fenceRoll < config.fenceChance) {
      // Along the back lot line, behind any garage.
      const backAt = depth / 2 + FENCE_BACK;
      const length = width + 3;
      const back: Rect = {
        x: x + outward.x * backAt,
        z: z + outward.z * backAt,
        yaw,
        width: length,
        depth: 0.15,
      };
      if (fits(back)) props.fences.push({ x: back.x, z: back.z, yaw, length, colour: fenceColour });

      // Down one side of the lot, from the house to the back fence.
      const side = sideRoll < 0.5 ? -1 : 1;
      const run = FENCE_BACK;
      const centreAt = depth / 2 + run / 2;
      const sideRect: Rect = {
        x: x + outward.x * centreAt + along.x * side * (width / 2 + 1.4),
        z: z + outward.z * centreAt + along.z * side * (width / 2 + 1.4),
        yaw: yaw + Math.PI / 2,
        width: run,
        depth: 0.15,
      };
      if (fits(sideRect)) {
        props.fences.push({
          x: sideRect.x,
          z: sideRect.z,
          yaw: sideRect.yaw,
          length: run,
          colour: fenceColour,
        });
      }
    }

    if (binRoll < config.binChance) {
      // Two bins side by side against the back of the house.
      binColours.forEach((colour, i) => {
        const at = depth / 2 + 0.9;
        const shift = (width / 2 - 1.2) * (house.seed % 2 === 0 ? 1 : -1) + i * 0.85;
        const rect: Rect = {
          x: x + outward.x * at + along.x * shift,
          z: z + outward.z * at + along.z * shift,
          yaw,
          width: 0.7,
          depth: 0.8,
        };
        if (fits(rect, 0.05)) props.bins.push({ x: rect.x, z: rect.z, yaw, colour });
      });
    }
  }

  // Power poles along a line behind the houses on each side of the route.
  const centre = new Vector3();
  const tangent = new Vector3();
  stretches.forEach((stretch) => {
    if (stretch.style !== 'house') return;
    const [start, end] = stretchRange(model, stretch);
    for (const side of [-1, 1] as const) {
      let previous: Pole | undefined;
      // The two lines are staggered by half a spacing.
      const first = start + (side === 1 ? 0 : config.poleSpacing / 2);
      for (let d = first; d < end; d += config.poleSpacing) {
        // A pole blocked by a building or a cross street slides along the lane to the nearest gap.
        let pole: Pole | undefined;
        for (const shift of POLE_SHIFTS) {
          const u = (d + shift) / model.length;
          if (u < 0 || u > 1 || model.inIntersection(u, POLE_GAP_MARGIN)) continue;
          model.curve.getPointAt(u, centre);
          model.curve.getTangentAt(u, tangent);
          const rightX = -tangent.z;
          const rightZ = tangent.x;
          const out = side * (model.widthAt(u) / 2 + stretch.setback + config.poleOffset);
          const candidate: Pole = {
            x: centre.x + rightX * out,
            z: centre.z + rightZ * out,
            yaw: Math.atan2(-tangent.z, tangent.x),
            height: config.poleHeight,
          };
          const footprint: Rect = {
            x: candidate.x,
            z: candidate.z,
            yaw: candidate.yaw,
            width: 0.6,
            depth: 0.6,
          };
          if (fits(footprint, 1)) {
            pole = candidate;
            break;
          }
        }
        if (!pole) continue;
        props.poles.push(pole);
        // Wires run on to the next pole, across a cross street if need be.
        if (
          previous &&
          Math.hypot(pole.x - previous.x, pole.z - previous.z) < config.poleSpacing * 2.2
        ) {
          const armY = config.poleHeight - ARM_DROP;
          for (const offset of WIRE_OFFSETS) {
            props.wires.push(...wireBetween(previous, pole, armY, offset));
          }
        }
        previous = pole;
      }
    }
  });

  return props;
}

/** The low tier keeps every pole and wire but only every other fence and bin. */
export function selectBackLanesForTier(props: BackLaneProps, tier: QualityTier): BackLaneProps {
  if (tier !== 'low') return props;
  return {
    ...props,
    fences: props.fences.filter((_, i) => i % 2 === 0),
    bins: props.bins.filter((_, i) => i % 2 === 0),
  };
}
