import { describe, expect, it } from 'vitest';
import { world } from '@/lib/palette';
import { createBodyGeometry, createBoxGeometry, createGableGeometry } from './buildingGeometry';
import { WINDOW_GRID, type BodyPart } from './buildingParts';

describe('createGableGeometry', () => {
  it('winds every triangle counter-clockwise seen from its stored normal', () => {
    const geometry = createGableGeometry();
    const position = geometry.getAttribute('position');
    const normal = geometry.getAttribute('normal');
    expect(position.count).toBe(18);
    for (let i = 0; i < position.count; i += 3) {
      const p = [0, 1, 2].map((k) => [
        position.getX(i + k),
        position.getY(i + k),
        position.getZ(i + k),
      ]);
      const e1 = [0, 1, 2].map((c) => p[1]![c]! - p[0]![c]!);
      const e2 = [0, 1, 2].map((c) => p[2]![c]! - p[0]![c]!);
      const cross = [
        e1[1]! * e2[2]! - e1[2]! * e2[1]!,
        e1[2]! * e2[0]! - e1[0]! * e2[2]!,
        e1[0]! * e2[1]! - e1[1]! * e2[0]!,
      ];
      const dot =
        cross[0]! * normal.getX(i) + cross[1]! * normal.getY(i) + cross[2]! * normal.getZ(i);
      expect(dot).toBeGreaterThan(0);
    }
  });

  it('peaks at one metre along the ridge and sits on the ground', () => {
    const geometry = createGableGeometry();
    geometry.computeBoundingBox();
    expect(geometry.boundingBox!.min.y).toBe(0);
    expect(geometry.boundingBox!.max.y).toBe(1);
  });
});

describe('createBoxGeometry', () => {
  it('stands on the ground', () => {
    const geometry = createBoxGeometry();
    geometry.computeBoundingBox();
    expect(geometry.boundingBox!.min.y).toBeCloseTo(0, 6);
    expect(geometry.boundingBox!.max.y).toBeCloseTo(1, 6);
  });
});

describe('createBodyGeometry', () => {
  const part: BodyPart = {
    x: 0,
    y: 0,
    z: 0,
    yaw: 0,
    width: 10,
    height: 20,
    depth: 8,
    colour: world.brick,
    grid: WINDOW_GRID.warehouse,
    warm: 0.5,
    cool: 0.25,
    seed: 3,
  };

  it('carries the size, lighting and grid of each part', () => {
    const geometry = createBodyGeometry([part, { ...part, width: 4 }]);
    const size = geometry.getAttribute('aSize');
    const lit = geometry.getAttribute('aLit');
    const grid = geometry.getAttribute('aGrid');
    expect([size.getX(0), size.getY(0), size.getZ(0)]).toEqual([10, 20, 8]);
    expect(size.getX(1)).toBe(4);
    expect([lit.getX(0), lit.getY(0), lit.getZ(0), lit.getW(0)]).toEqual([
      0.5,
      0.25,
      3,
      WINDOW_GRID.warehouse.texture,
    ]);
    expect(grid.getX(0)).toBeCloseTo(WINDOW_GRID.warehouse.bay, 5);
    expect(grid.getY(0)).toBeCloseTo(WINDOW_GRID.warehouse.floor, 5);
  });
});
