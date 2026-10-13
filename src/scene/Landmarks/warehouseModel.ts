import { BufferGeometry, Float32BufferAttribute, PlaneGeometry } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { world } from '@/lib/palette';
import { metricBox } from './metricBox';

/**
 * The Exchange District warehouses as a stylized blockout, in local metres: the origin is the
 * centre of the three-warehouse footprint on the ground, +z points away from the road (the fronts
 * face -z), and +x runs along the wall to the viewer's left (back along the road), -x to their
 * right (ahead). From the back: a dry goods warehouse, the venue in the middle, then the grain
 * supply warehouse nearest the camera.
 */
export const WAREHOUSES = {
  depth: 12,
  /** Storey height in the shared window grid. */
  storey: 3.6,
  /** Each warehouse: x centre, width and number of storeys. */
  dryGoods: { x: 12, width: 12, floors: 4 },
  venue: { x: 0, width: 12, floors: 3 },
  grain: { x: -12, width: 12, floors: 4 },
  /** The marquee sign over the venue door. */
  marquee: { width: 8.4, height: 2.5, bottom: 4.1, stand: 1.4 },
  door: { width: 2.2, height: 3 },
} as const;

const frontZ = -WAREHOUSES.depth / 2;

/** A wall-facing plane (facing the road, -z) with the given size and centre. */
function frontPlane(width: number, height: number, x: number, y: number, z: number): PlaneGeometry {
  return new PlaneGeometry(width, height).rotateY(Math.PI).translate(x, y, z);
}

function merge(parts: BufferGeometry[]): BufferGeometry {
  const merged = mergeGeometries(parts);
  parts.forEach((part) => part.dispose());
  if (!merged) throw new Error('Nothing to merge');
  return merged;
}

function colour(geometry: BufferGeometry, hex: string): BufferGeometry {
  const count = geometry.getAttribute('position').count;
  const c = new Float32Array(count * 3);
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
  for (let i = 0; i < count; i++) c.set([r, g, b], i * 3);
  geometry.setAttribute('color', new Float32BufferAttribute(c, 3));
  return geometry;
}

/** Height of a warehouse's walls. */
export const wallHeight = (floors: number) => floors * WAREHOUSES.storey;

/**
 * The three brick bodies and their cornices. Vertex colours tint each body a little differently
 * (one weathered, one dark, one rust), under the brick window grid.
 */
export function warehouseBodyGeometry(): BufferGeometry {
  const { depth, dryGoods, venue, grain } = WAREHOUSES;
  const tint = [world.brickFaded, world.brickNight, world.brick] as const;
  return merge(
    [dryGoods, venue, grain].flatMap((w, i) => {
      const top = wallHeight(w.floors);
      return [
        colour(metricBox(w.width, top, depth, w.x, 0, 0), tint[i]!),
        // A cornice a little proud of the wall.
        colour(metricBox(w.width + 0.5, 0.4, depth + 0.5, w.x, top, 0), world.limestone),
      ];
    }),
  );
}

/** The marquee frame: two rods to the wall, a canopy over the door and the door itself. */
export function warehouseSteelGeometry(): BufferGeometry {
  const { marquee, door, venue } = WAREHOUSES;
  const z = frontZ - marquee.stand / 2;
  const rod = 0.1;
  return merge([
    // Rods holding the board out from the wall.
    metricBox(rod, rod, marquee.stand, -marquee.width / 2 + 0.5, marquee.bottom + 0.4, z),
    metricBox(rod, rod, marquee.stand, marquee.width / 2 - 0.5, marquee.bottom + 0.4, z),
    metricBox(
      rod,
      rod,
      marquee.stand,
      -marquee.width / 2 + 0.5,
      marquee.bottom + marquee.height - 0.4,
      z,
    ),
    metricBox(
      rod,
      rod,
      marquee.stand,
      marquee.width / 2 - 0.5,
      marquee.bottom + marquee.height - 0.4,
      z,
    ),
    // The board's backing, so it reads as a box rather than a card.
    metricBox(
      marquee.width,
      marquee.height,
      0.3,
      venue.x,
      marquee.bottom,
      frontZ - marquee.stand - 0.15,
    ),
    // A canopy over the door.
    metricBox(door.width + 1.2, 0.25, 1.4, venue.x, door.height + 0.1, frontZ - 0.7),
    // The door.
    metricBox(door.width, door.height, 0.12, venue.x, 0, frontZ - 0.06),
  ]);
}

/** The marquee board face, a little in front of its backing. */
export function marqueeBoardGeometry(): BufferGeometry {
  const { marquee, venue } = WAREHOUSES;
  return frontPlane(
    marquee.width - 0.2,
    marquee.height - 0.2,
    venue.x,
    marquee.bottom + marquee.height / 2,
    frontZ - marquee.stand - 0.32,
  );
}

/** Where each ghost sign sits on the walls, in the atlas order the texture uses. */
export const ghostSignRects = {
  /** Dry goods and wholesale, on the back warehouse. */
  dryGoods: { x: WAREHOUSES.dryGoods.x, y: 10.2, width: 8.4, height: 3.4 },
  /** The Winnipeg grain trade, on the warehouse nearest the camera. */
  grain: { x: WAREHOUSES.grain.x, y: 10.6, width: 10, height: 3.8 },
  /** A faded word above the marquee, on the venue. */
  warehouse: { x: WAREHOUSES.venue.x, y: 8.6, width: 7, height: 1.5 },
} as const;

/**
 * The ghost sign planes, merged into one geometry whose uv rectangles pick each sign out of one
 * texture atlas (`atlasRects`, top to bottom). They sit 4 cm off the brick.
 */
export function ghostSignGeometry(
  atlasRects: Record<keyof typeof ghostSignRects, [number, number, number, number]>,
) {
  const z = frontZ - 0.04;
  return merge(
    (Object.keys(ghostSignRects) as (keyof typeof ghostSignRects)[]).map((key) => {
      const r = ghostSignRects[key];
      const plane = frontPlane(r.width, r.height, r.x, r.y, z);
      const [u0, v0, u1, v1] = atlasRects[key];
      const uv = plane.getAttribute('uv');
      // Turned half a turn to face the road, the plane still has u running to the viewer's right,
      // so the lettering reads left to right from the road.
      for (let i = 0; i < uv.count; i++) {
        const u = uv.getX(i);
        const v = uv.getY(i);
        uv.setXY(i, u0 + u * (u1 - u0), v0 + v * (v1 - v0));
      }
      return plane;
    }),
  );
}
