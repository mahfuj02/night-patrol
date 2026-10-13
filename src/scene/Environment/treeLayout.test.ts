import { describe, expect, it } from 'vitest';
import { lamps } from '../Road/lamps';
import { routeModel } from '../Road/route';
import { buildTrees, selectTreesForTier } from './treeLayout';

const VARIANTS = 3;
const trees = buildTrees(routeModel, VARIANTS);
const count = (from: number, to: number) => trees.filter((t) => t.u >= from && t.u <= to).length;

const sideOf = (tree: (typeof trees)[number]) => {
  const centre = routeModel.curve.getPointAt(tree.u);
  const tangent = routeModel.curve.getTangentAt(tree.u);
  return Math.sign((tree.base.x - centre.x) * tangent.z - (tree.base.z - centre.z) * tangent.x);
};
const offsetOf = (tree: (typeof trees)[number]) => {
  const centre = routeModel.curve.getPointAt(tree.u);
  return Math.hypot(tree.base.x - centre.x, tree.base.z - centre.z);
};

describe('buildTrees', () => {
  it('plants a few dozen trees', () => {
    expect(trees.length).toBeGreaterThan(30);
    expect(trees.length).toBeLessThan(160);
  });

  it('is deterministic', () => {
    const again = buildTrees(routeModel, VARIANTS);
    expect(again).toHaveLength(trees.length);
    expect(again[4]!.base.toArray()).toEqual(trees[4]!.base.toArray());
  });

  it('follows the zone density: dense on the avenue, almost none downtown', () => {
    expect(count(0.738, 0.798)).toBeGreaterThan(count(0.44, 0.61));
    expect(count(0.738, 0.798)).toBeGreaterThanOrEqual(5);
    expect(count(0.44, 0.61)).toBeLessThanOrEqual(4);
  });

  it('keeps regular rows: about 9 m apart along each side, set back behind the ridge', () => {
    for (const side of [-1, 1]) {
      const row = trees.filter((t) => sideOf(t) === side);
      expect(row.length).toBeGreaterThan(15);
      row.forEach((tree, i) => {
        if (i === 0) return;
        const gap = (tree.u - row[i - 1]!.u) * routeModel.length;
        expect(gap).toBeGreaterThan(7);
      });
    }
    for (const tree of trees) {
      const half = routeModel.widthAt(tree.u) / 2;
      expect(offsetOf(tree)).toBeGreaterThan(half + 5); // clear of the ridge (about 2.8 m wide)
      expect(offsetOf(tree)).toBeLessThan(half + 6.1);
      expect(tree.base.y).toBe(0);
    }
  });

  it('keeps rows tight to the road: nothing wandering in open ground', () => {
    for (const tree of trees) {
      const half = routeModel.widthAt(tree.u) / 2;
      expect(offsetOf(tree) - half).toBeLessThan(6.1);
    }
  });

  it('leaves the intersection and lamp poles clear', () => {
    const gap = routeModel.intersections[0]!;
    for (const tree of trees) {
      const at = tree.u * routeModel.length;
      expect(
        at < (gap.from - 6 / routeModel.length) * routeModel.length ||
          at > (gap.to + 6 / routeModel.length) * routeModel.length,
      ).toBe(true);
      for (const lamp of lamps) {
        expect(
          Math.hypot(lamp.pole.x - tree.base.x, lamp.pole.z - tree.base.z),
        ).toBeGreaterThanOrEqual(3.5);
      }
    }
  });

  it('staggers the two rows', () => {
    const left = trees.filter((t) => sideOf(t) === -1).map((t) => t.u * routeModel.length);
    const right = trees.filter((t) => sideOf(t) === 1).map((t) => t.u * routeModel.length);
    const closest = Math.min(...left.map((l) => Math.min(...right.map((r) => Math.abs(l - r)))));
    expect(closest).toBeGreaterThan(0.2);
  });

  it('turns each tree so its long limbs face the road, letting avenue branches meet over it', () => {
    for (const tree of trees) {
      const centre = routeModel.curve.getPointAt(tree.u);
      const facing = { x: Math.sin(tree.yaw), z: Math.cos(tree.yaw) };
      const toRoad = { x: centre.x - tree.base.x, z: centre.z - tree.base.z };
      const length = Math.hypot(toRoad.x, toRoad.z);
      const cos = (facing.x * toRoad.x + facing.z * toRoad.z) / length;
      expect(cos).toBeGreaterThan(0.85);
    }
  });

  it('varies scale by about 15% and spreads trees over the shapes', () => {
    for (const tree of trees) {
      expect(tree.scale).toBeGreaterThanOrEqual(0.85);
      expect(tree.scale).toBeLessThanOrEqual(1.15);
    }
    const used = new Set(trees.map((t) => t.variant));
    expect(used.size).toBe(VARIANTS);
  });
});

describe('selectTreesForTier', () => {
  it('keeps all trees on high and medium and half on low', () => {
    expect(selectTreesForTier(trees, 'high')).toHaveLength(trees.length);
    expect(selectTreesForTier(trees, 'medium')).toHaveLength(trees.length);
    expect(selectTreesForTier(trees, 'low')).toHaveLength(Math.ceil(trees.length / 2));
  });
});
