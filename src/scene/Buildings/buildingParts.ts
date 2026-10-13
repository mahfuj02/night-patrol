import type { BuildingStyle } from '@/content/schema';
import { world, type WorldToken } from '@/lib/palette';
import type { Building } from './buildingLayout';

/** Wall colours per style, as world palette tokens. A building picks one by its `colour` index. */
export const WALL_COLOURS: Record<BuildingStyle, readonly WorldToken[]> = {
  warehouse: ['brickNight', 'brick', 'brickFaded', 'limestone'],
  tower: ['towerConcrete', 'towerGlass', 'towerGlass', 'limestone'],
  house: ['sidingCream', 'sidingBlue', 'sidingGrey', 'sidingRed'],
};

/** Window grid per style: bay width and floor height (m), and the window size as a share of both. */
export const WINDOW_GRID: Record<
  BuildingStyle | 'garage',
  { bay: number; floor: number; fillX: number; fillY: number; texture: number }
> = {
  warehouse: { bay: 3.4, floor: 3.8, fillX: 0.5, fillY: 0.55, texture: 1 },
  tower: { bay: 2.6, floor: 3.6, fillX: 0.8, fillY: 0.62, texture: 0.3 },
  house: { bay: 3.6, floor: 2.9, fillX: 0.42, fillY: 0.5, texture: 0.35 },
  garage: { bay: 3, floor: 3, fillX: 0, fillY: 0, texture: 0.35 },
};

/** A box: base centre (x, y, z), yaw, size, and its window pattern. */
export interface BodyPart {
  x: number;
  y: number;
  z: number;
  yaw: number;
  width: number;
  height: number;
  depth: number;
  colour: string;
  grid: (typeof WINDOW_GRID)[keyof typeof WINDOW_GRID];
  warm: number;
  cool: number;
  seed: number;
}

/** A gabled roof: base centre, yaw, and size (ridge along local x). */
export interface GablePart {
  x: number;
  y: number;
  z: number;
  yaw: number;
  length: number;
  span: number;
  height: number;
}

/** A thin slab of snow on a flat roof. */
export interface CapPart {
  x: number;
  y: number;
  z: number;
  yaw: number;
  width: number;
  depth: number;
}

export interface BuildingParts {
  bodies: BodyPart[];
  gables: GablePart[];
  caps: CapPart[];
}

/** Thickness of the snow slab on flat roofs. */
export const CAP_HEIGHT = 0.45;
/** How far a gabled roof overhangs the walls. */
const OVERHANG = 0.5;

/** Breaks buildings down into the boxes, gables and snow slabs that are drawn as instances. */
export function buildParts(buildings: readonly Building[]): BuildingParts {
  const bodies: BodyPart[] = [];
  const gables: GablePart[] = [];
  const caps: CapPart[] = [];

  for (const b of buildings) {
    const { x, z, yaw, width, depth } = b.footprint;
    const tokens = WALL_COLOURS[b.style];
    const colour = world[tokens[b.colour % tokens.length]!];
    bodies.push({
      x,
      y: 0,
      z,
      yaw,
      width,
      height: b.height,
      depth,
      colour,
      grid: WINDOW_GRID[b.style],
      warm: b.warm,
      cool: b.cool,
      seed: b.seed,
    });

    let top = b.height;
    if (b.crown) {
      bodies.push({
        x,
        y: b.height,
        z,
        yaw,
        width: width * b.crown.scale,
        height: b.crown.height,
        depth: depth * b.crown.scale,
        colour,
        grid: WINDOW_GRID[b.style],
        warm: b.warm,
        cool: b.cool,
        seed: b.seed + 17,
      });
      // The snow sits on the main roof around the crown and on top of the crown.
      caps.push({ x, y: b.height, z, yaw, width: width - 0.4, depth: depth - 0.4 });
      top = b.height + b.crown.height;
      caps.push({
        x,
        y: top,
        z,
        yaw,
        width: width * b.crown.scale - 0.4,
        depth: depth * b.crown.scale - 0.4,
      });
    } else if (b.roof.kind === 'gable') {
      const across = b.roof.ridgeAcross;
      gables.push({
        x,
        y: b.height,
        z,
        yaw: across ? yaw + Math.PI / 2 : yaw,
        length: (across ? depth : width) + OVERHANG * 2,
        span: (across ? width : depth) + OVERHANG * 2,
        height: b.roof.height,
      });
    } else {
      caps.push({ x, y: b.height, z, yaw, width: width - 0.4, depth: depth - 0.4 });
    }

    if (b.garage) {
      const g = b.garage;
      bodies.push({
        x: g.x,
        y: 0,
        z: g.z,
        yaw: g.yaw,
        width: g.width,
        height: g.height,
        depth: g.depth,
        colour: world[tokens[(b.colour + 1) % tokens.length]!],
        grid: WINDOW_GRID.garage,
        warm: 0,
        cool: 0,
        seed: b.seed + 31,
      });
      caps.push({
        x: g.x,
        y: g.height,
        z: g.z,
        yaw: g.yaw,
        width: g.width - 0.3,
        depth: g.depth - 0.3,
      });
    }
  }
  return { bodies, gables, caps };
}
