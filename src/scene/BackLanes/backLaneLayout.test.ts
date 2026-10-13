import { describe, expect, it } from 'vitest';
import { backLanes, buildingStretches } from '@/content';
import { rectsOverlap, type Rect } from '@/lib/footprint';
import { buildBuildings } from '../Buildings/buildingLayout';
import { crossings } from '../Road/crossings';
import { routeModel } from '../Road/route';
import { buildBackLanes, selectBackLanesForTier } from './backLaneLayout';

const buildings = buildBuildings(routeModel, buildingStretches, crossings);
const props = buildBackLanes(routeModel, buildings, buildingStretches, backLanes);
const solids: Rect[] = buildings.flatMap((b) =>
  b.garage ? [b.footprint, b.garage] : [b.footprint],
);

const asRect = (x: number, z: number, yaw: number, width: number, depth: number): Rect => ({
  x,
  z,
  yaw,
  width,
  depth,
});

describe('buildBackLanes', () => {
  it('is deterministic', () => {
    expect(buildBackLanes(routeModel, buildings, buildingStretches, backLanes)).toEqual(props);
  });

  it('puts power poles behind the houses, on both sides, and nowhere else', () => {
    expect(props.poles.length).toBeGreaterThanOrEqual(10);
    const [from, to] = buildingStretches
      .filter((s) => s.style === 'house')
      .map((s) => {
        const start =
          routeModel.stopFractions.get(s.from)! * routeModel.length + (s.fromOffset ?? 0);
        const end = routeModel.stopFractions.get(s.to)! * routeModel.length + (s.toOffset ?? 0);
        return [start, end] as const;
      })[0]!;
    const sides = new Set<number>();
    for (const pole of props.poles) {
      // The distance from the route centre line, and where along the route the pole stands.
      let best = Infinity;
      let at = 0;
      for (let i = 0; i <= 400; i++) {
        const u = i / 400;
        const p = routeModel.curve.getPointAt(u);
        const d = Math.hypot(p.x - pole.x, p.z - pole.z);
        if (d < best) {
          best = d;
          at = u * routeModel.length;
        }
      }
      expect(best).toBeGreaterThan(backLanes.poleOffset);
      expect(at).toBeGreaterThan(from - 10);
      expect(at).toBeLessThan(to + 10);
      const p = routeModel.curve.getPointAt(at / routeModel.length);
      const t = routeModel.curve.getTangentAt(at / routeModel.length);
      sides.add(Math.sign((pole.x - p.x) * -t.z + (pole.z - p.z) * t.x));
    }
    expect([...sides].sort()).toEqual([-1, 1]);
  });

  it('keeps every pole out of the buildings and the cross streets', () => {
    for (const pole of props.poles) {
      for (const solid of solids) {
        expect(rectsOverlap(asRect(pole.x, pole.z, pole.yaw, 0.6, 0.6), solid)).toBe(false);
      }
      for (const crossing of crossings) {
        for (const arm of crossing.arms) {
          // Distance from the cross street centre line.
          const dx = pole.x - crossing.centre.x;
          const dz = pole.z - crossing.centre.z;
          const along = dx * crossing.tangent.x + dz * crossing.tangent.z;
          const across = dx * crossing.right.x + dz * crossing.right.z;
          if (dx * arm.dir.x + dz * arm.dir.z > 0) {
            expect(Math.abs(along)).toBeGreaterThan(arm.width / 2 + 2);
          }
          expect(Math.abs(across) > crossing.mainHalf || Math.abs(along) > arm.width / 2).toBe(
            true,
          );
        }
      }
    }
  });

  it('strings three wires between neighbouring poles, sagging below the arms', () => {
    expect(props.wires.length).toBeGreaterThanOrEqual(3 * 6 * 6 * 6);
    // Each wire is six segments of six numbers.
    expect(props.wires.length % (3 * 6 * 6)).toBe(0);
    for (let i = 1; i < props.wires.length; i += 3) {
      expect(props.wires[i]).toBeLessThanOrEqual(backLanes.poleHeight);
      expect(props.wires[i]).toBeGreaterThan(backLanes.poleHeight - 2);
    }
  });

  it('puts fences and bins at the houses, clear of every building and garage', () => {
    const houses = buildings.filter((b) => b.style === 'house');
    expect(props.fences.length).toBeGreaterThan(houses.length / 2);
    expect(props.bins.length).toBeGreaterThan(houses.length / 2);
    expect(props.fences.length).toBeLessThanOrEqual(houses.length * 2);
    for (const fence of props.fences) {
      const rect = asRect(fence.x, fence.z, fence.yaw, fence.length, 0.15);
      for (const solid of solids) expect(rectsOverlap(rect, solid)).toBe(false);
    }
    for (const bin of props.bins) {
      const rect = asRect(bin.x, bin.z, bin.yaw, 0.7, 0.8);
      for (const solid of solids) expect(rectsOverlap(rect, solid)).toBe(false);
    }
  });

  it('only decorates houses', () => {
    const nearHouse = (x: number, z: number, reach: number) =>
      buildings.some(
        (b) => b.style === 'house' && Math.hypot(b.footprint.x - x, b.footprint.z - z) < reach,
      );
    for (const fence of props.fences) expect(nearHouse(fence.x, fence.z, 20)).toBe(true);
    for (const bin of props.bins) expect(nearHouse(bin.x, bin.z, 10)).toBe(true);
  });
});

describe('selectBackLanesForTier', () => {
  it('keeps everything on high and medium and thins fences and bins on low', () => {
    expect(selectBackLanesForTier(props, 'high')).toBe(props);
    expect(selectBackLanesForTier(props, 'medium')).toBe(props);
    const low = selectBackLanesForTier(props, 'low');
    expect(low.poles).toHaveLength(props.poles.length);
    expect(low.wires).toHaveLength(props.wires.length);
    expect(low.fences).toHaveLength(Math.ceil(props.fences.length / 2));
    expect(low.bins).toHaveLength(Math.ceil(props.bins.length / 2));
  });
});
