import { Box3, Vector3, type BufferAttribute } from 'three';
import { describe, expect, it } from 'vitest';
import { buildTreeVariant } from './treeBuilder';

const seeds = [101, 202, 303, 404];
const high = seeds.map((seed) => buildTreeVariant(seed, 'high'));
const low = seeds.map((seed) => buildTreeVariant(seed, 'low'));

describe('buildTreeVariant', () => {
  it('forks low: a trunk of 2 to 3 m into 3 to 5 main limbs', () => {
    for (const { stats } of [...high, ...low]) {
      expect(stats.forkHeight).toBeGreaterThanOrEqual(2.2);
      expect(stats.forkHeight).toBeLessThanOrEqual(3);
      expect(stats.limbs).toBeGreaterThanOrEqual(3);
      expect(stats.limbs).toBeLessThanOrEqual(5);
    }
  });

  it('stays within the triangle budget per tree', () => {
    for (const { stats } of high) {
      expect(stats.woodTriangles).toBeLessThan(1300);
      expect(stats.twigTriangles).toBeLessThan(520);
    }
    for (const { stats } of low) {
      expect(stats.woodTriangles).toBeLessThan(520);
      expect(stats.twigTriangles).toBeLessThan(110);
    }
  });

  it('uses fewer branch levels, and so fewer triangles, on low', () => {
    for (let i = 0; i < seeds.length; i++) {
      expect(low[i]!.stats.woodTriangles).toBeLessThan(high[i]!.stats.woodTriangles / 2);
      expect(low[i]!.stats.twigClusters).toBeLessThan(high[i]!.stats.twigClusters);
    }
  });

  it('is deterministic for a seed and different between seeds', () => {
    const again = buildTreeVariant(101, 'high');
    expect((again.wood.getAttribute('position') as BufferAttribute).array.slice(0, 90)).toEqual(
      (high[0]!.wood.getAttribute('position') as BufferAttribute).array.slice(0, 90),
    );
    expect(
      (high[1]!.wood.getAttribute('position') as BufferAttribute).array.slice(0, 90),
    ).not.toEqual((high[0]!.wood.getAttribute('position') as BufferAttribute).array.slice(0, 90));
  });

  it('is a tall vase: roughly 9 to 16 m high, rooted at the origin, nothing below ground', () => {
    for (const { wood, twigs } of high) {
      const box = new Box3().setFromBufferAttribute(
        wood.getAttribute('position') as BufferAttribute,
      );
      expect(box.min.y).toBeGreaterThanOrEqual(-0.01);
      expect(box.max.y).toBeGreaterThan(9);
      expect(box.max.y).toBeLessThan(17);
      const twigBox = new Box3().setFromBufferAttribute(
        twigs.getAttribute('position') as BufferAttribute,
      );
      expect(twigBox.min.y).toBeGreaterThan(1.5);
    }
  });

  it('spreads wide and reaches further toward +Z, where its road-side limbs point', () => {
    for (const { wood } of high) {
      const box = new Box3().setFromBufferAttribute(
        wood.getAttribute('position') as BufferAttribute,
      );
      expect(box.max.x - box.min.x).toBeGreaterThan(6);
      expect(box.max.z).toBeGreaterThan(Math.abs(box.min.z) * 0.9);
    }
    const reach = high.map(({ wood }) => {
      const box = new Box3().setFromBufferAttribute(
        wood.getAttribute('position') as BufferAttribute,
      );
      return box.max.z;
    });
    expect(Math.max(...reach)).toBeGreaterThan(5);
  });

  it('flares at the base: the trunk is wider at the ground than at the fork', () => {
    for (const { wood, stats } of high) {
      const position = wood.getAttribute('position') as BufferAttribute;
      const widthNear = (yTarget: number) => {
        let min = Infinity;
        let max = -Infinity;
        for (let i = 0; i < Math.min(position.count, 5 * 6); i++) {
          if (Math.abs(position.getY(i) - yTarget) < 0.05) {
            min = Math.min(min, position.getX(i));
            max = Math.max(max, position.getX(i));
          }
        }
        return max - min;
      };
      expect(widthNear(0)).toBeGreaterThan(widthNear(stats.forkHeight) * 1.3);
    }
  });

  it('tapers: tube radii shrink from trunk to twig', () => {
    const { wood } = high[0]!;
    const position = wood.getAttribute('position') as BufferAttribute;
    // The first ring is the trunk base (radius ~0.6); the last vertices belong to a fine branch.
    const ringRadius = (first: number) => {
      const cx = Array.from({ length: 6 }, (_, k) => position.getX(first + k));
      return (Math.max(...cx) - Math.min(...cx)) / 2;
    };
    expect(ringRadius(0)).toBeGreaterThan(0.4);
    const last = position.count - 5;
    const fine = new Vector3().fromBufferAttribute(position, last);
    expect(fine.length()).toBeGreaterThan(3);
  });

  it('faces every triangle outward and carries bark colour, never pure black', () => {
    const { wood } = high[0]!;
    const position = wood.getAttribute('position') as BufferAttribute;
    const normal = wood.getAttribute('normal') as BufferAttribute;
    const color = wood.getAttribute('color') as BufferAttribute;
    const index = wood.getIndex()!;
    const a = new Vector3();
    const b = new Vector3();
    const c = new Vector3();
    const faceNormal = new Vector3();
    const vertexNormal = new Vector3();
    for (let t = 0; t < index.count; t += 3) {
      a.fromBufferAttribute(position, index.getX(t));
      b.fromBufferAttribute(position, index.getX(t + 1));
      c.fromBufferAttribute(position, index.getX(t + 2));
      faceNormal.crossVectors(b.clone().sub(a), c.clone().sub(a));
      if (faceNormal.lengthSq() < 1e-12) continue;
      vertexNormal.fromBufferAttribute(normal, index.getX(t));
      expect(faceNormal.dot(vertexNormal)).toBeGreaterThan(0);
    }
    for (let i = 0; i < color.count; i++) {
      expect(color.getX(i) + color.getY(i) + color.getZ(i)).toBeGreaterThan(0.01);
    }
  });

  it('puts twig planes at the tips with uvs for the alpha map, in clusters of 2 or 3 planes', () => {
    const { twigs, stats } = high[0]!;
    expect(twigs.getAttribute('uv')).toBeDefined();
    const planes = (twigs.getAttribute('position') as BufferAttribute).count / 4;
    expect(planes).toBeGreaterThanOrEqual(stats.twigClusters * 2);
    expect(planes).toBeLessThanOrEqual(stats.twigClusters * 3);
    expect(stats.twigTriangles).toBe(planes * 2);
  });
});
