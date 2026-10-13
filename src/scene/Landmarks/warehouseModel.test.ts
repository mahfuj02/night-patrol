import { describe, expect, it } from 'vitest';
import { warehousesPlacement } from './placement';
import { ghostAtlasRects } from './landmarkTextures';
import {
  WAREHOUSES,
  ghostSignGeometry,
  ghostSignRects,
  marqueeBoardGeometry,
  wallHeight,
  warehouseBodyGeometry,
  warehouseSteelGeometry,
} from './warehouseModel';

const bounds = (g: ReturnType<typeof warehouseBodyGeometry>) => {
  g.computeBoundingBox();
  return g.boundingBox!;
};
const frontZ = -WAREHOUSES.depth / 2;

describe('warehouse model', () => {
  it('lines three warehouses up along the wall, the dry goods one behind (+x), grain ahead (-x)', () => {
    const b = bounds(warehouseBodyGeometry());
    // 36 m in all, from -18 to 18.
    expect(b.min.x).toBeCloseTo(-18.25, 5);
    expect(b.max.x).toBeCloseTo(18.25, 5);
    expect(b.min.y).toBeCloseTo(0, 6);
    expect(b.max.y).toBeCloseTo(wallHeight(4) + 0.4, 5);
    // The reserved ground covers every warehouse.
    expect(b.min.x).toBeGreaterThanOrEqual(warehousesPlacement.reserved.min);
    expect(b.max.x).toBeLessThanOrEqual(warehousesPlacement.reserved.max);
    expect(WAREHOUSES.dryGoods.x).toBeGreaterThan(WAREHOUSES.venue.x);
    expect(WAREHOUSES.grain.x).toBeLessThan(WAREHOUSES.venue.x);
  });

  it('makes the venue the lower middle warehouse', () => {
    expect(WAREHOUSES.venue.floors).toBeLessThan(WAREHOUSES.dryGoods.floors);
    expect(WAREHOUSES.venue.x).toBe(0);
  });

  it('carries colours and metre uvs on the bodies, for the brick window shader', () => {
    const g = warehouseBodyGeometry();
    expect(g.getAttribute('color')).toBeDefined();
    expect(g.getAttribute('uv')).toBeDefined();
    expect(g.getAttribute('normal')).toBeDefined();
  });

  it('hangs the marquee board over the venue door, clear of the wall', () => {
    const board = bounds(marqueeBoardGeometry());
    expect(board.min.z).toBeLessThan(frontZ - WAREHOUSES.marquee.stand + 0.1);
    expect(board.min.y).toBeGreaterThan(WAREHOUSES.door.height);
    expect(board.max.y).toBeLessThan(wallHeight(WAREHOUSES.venue.floors));
    // Centred on the venue.
    expect((board.min.x + board.max.x) / 2).toBeCloseTo(WAREHOUSES.venue.x, 5);
    const steel = bounds(warehouseSteelGeometry());
    // The board face is in front of its backing.
    expect(board.min.z).toBeLessThan(steel.min.z);
  });

  it('puts the ghost signs just off the brick, on the right warehouses, below the cornice', () => {
    const geometry = ghostSignGeometry(ghostAtlasRects);
    const b = bounds(geometry);
    expect(b.min.z).toBeCloseTo(frontZ - 0.04, 5);
    expect(b.max.z).toBeCloseTo(frontZ - 0.04, 5);
    expect(ghostSignRects.dryGoods.x).toBe(WAREHOUSES.dryGoods.x);
    expect(ghostSignRects.grain.x).toBe(WAREHOUSES.grain.x);
    expect(ghostSignRects.warehouse.x).toBe(WAREHOUSES.venue.x);
    for (const [name, rect] of Object.entries(ghostSignRects)) {
      const floors =
        name === 'dryGoods'
          ? WAREHOUSES.dryGoods.floors
          : name === 'grain'
            ? WAREHOUSES.grain.floors
            : WAREHOUSES.venue.floors;
      expect(rect.y + rect.height / 2).toBeLessThan(wallHeight(floors));
      // Every sign is above the doors and the marquee.
      expect(rect.y - rect.height / 2).toBeGreaterThan(
        WAREHOUSES.marquee.bottom + WAREHOUSES.marquee.height,
      );
    }
  });

  it('picks each sign out of its own part of the texture atlas', () => {
    const uv = ghostSignGeometry(ghostAtlasRects).getAttribute('uv');
    // Three planes of four vertices; each stays inside its atlas rectangle.
    const keys = Object.keys(ghostSignRects) as (keyof typeof ghostAtlasRects)[];
    keys.forEach((key, i) => {
      const [u0, v0, u1, v1] = ghostAtlasRects[key];
      for (let v = 0; v < 4; v++) {
        const x = uv.getX(i * 4 + v);
        const y = uv.getY(i * 4 + v);
        expect(x).toBeGreaterThanOrEqual(u0 - 1e-6);
        expect(x).toBeLessThanOrEqual(u1 + 1e-6);
        expect(y).toBeGreaterThanOrEqual(v0 - 1e-6);
        expect(y).toBeLessThanOrEqual(v1 + 1e-6);
      }
    });
  });
});

describe('ghost atlas', () => {
  it('stacks three rectangles that fill the texture without overlapping', () => {
    const rects = Object.values(ghostAtlasRects).sort((a, b) => a[1] - b[1]);
    expect(rects[0]![1]).toBe(0);
    expect(rects[2]![3]).toBe(1);
    expect(rects[0]![3]).toBeCloseTo(rects[1]![1], 10);
    expect(rects[1]![3]).toBeCloseTo(rects[2]![1], 10);
  });
});
