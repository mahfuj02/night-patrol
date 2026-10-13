import { describe, expect, it } from 'vitest';
import {
  CITY,
  annexGeometry,
  boardGeometry,
  columnXs,
  detailGeometry,
  hallGeometry,
  hallTop,
  signGeometry,
} from './cityModel';
import { cityServicesPlacement } from './placement';

const box = (g: ReturnType<typeof hallGeometry>) => {
  g.computeBoundingBox();
  return g.boundingBox!;
};
const frontZ = -CITY.depth / 2;

describe('city services model', () => {
  it('stands a four-storey hall on the ground, with a cornice', () => {
    const b = box(hallGeometry());
    expect(b.min.y).toBeCloseTo(0, 6);
    expect(b.max.y).toBeCloseTo(hallTop + 0.45, 5);
    expect(b.min.x).toBeCloseTo(-CITY.width / 2 - 0.35, 5);
  });

  it('puts the lower brick annex behind the hall (+x), with colours and metre uvs', () => {
    const g = annexGeometry();
    const b = box(g);
    expect(b.min.x).toBeGreaterThanOrEqual(CITY.width / 2 - 0.3);
    expect(b.max.y).toBeLessThan(hallTop);
    expect(g.getAttribute('color').count).toBe(g.getAttribute('position').count);
    expect(g.getAttribute('uv').count).toBe(g.getAttribute('position').count);
  });

  it('keeps everything inside the reserved ground', () => {
    const { min, max } = cityServicesPlacement.reserved;
    for (const g of [hallGeometry(), annexGeometry(), detailGeometry()]) {
      const b = box(g);
      expect(b.min.x).toBeGreaterThanOrEqual(min);
      expect(b.max.x).toBeLessThanOrEqual(max);
    }
  });

  it('centres an even row of columns on the entrance, under the canopy', () => {
    const xs = columnXs();
    expect(xs).toHaveLength(CITY.portico.columns);
    expect(xs[0]! + xs[xs.length - 1]!).toBeCloseTo(2 * CITY.entranceX, 6);
    expect(box(detailGeometry()).min.z).toBeLessThan(frontZ - CITY.portico.stand);
  });

  it('hangs the request board on the wall over the door and the lettering over the roof', () => {
    const board = box(boardGeometry());
    expect(board.min.z).toBeCloseTo(frontZ - 0.05, 5);
    expect(board.min.y).toBeGreaterThan(CITY.portico.height);
    expect(box(signGeometry()).min.y).toBeGreaterThan(hallTop);
  });
});
