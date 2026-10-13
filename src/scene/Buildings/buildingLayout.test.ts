import { describe, expect, it } from 'vitest';
import { buildingStretches, stops } from '@/content';
import { rectsOverlap } from '@/lib/footprint';
import { rectOutline, type Rect } from '@/lib/footprint';
import { crossings } from '../Road/crossings';
import { routeModel } from '../Road/route';
import { buildBuildings, selectBuildingsForTier, stretchRange } from './buildingLayout';

const buildings = buildBuildings(routeModel, buildingStretches);
const distanceAlong = (b: { u: number }) => b.u * routeModel.length;

describe('stretchRange', () => {
  it('starts at the from stop and ends at the to stop, plus offsets', () => {
    const residential = buildingStretches.find((s) => s.id === 'residential')!;
    const [start, end] = stretchRange(routeModel, residential);
    const shelter = routeModel.stopFractions.get('warming-shelter')! * routeModel.length;
    const esplanade = routeModel.stopFractions.get('cmhr-esplanade')! * routeModel.length;
    expect(start).toBeCloseTo(shelter - 70, 6);
    expect(end).toBeCloseTo(esplanade + 60, 6);
  });

  it('keeps the stretches in route order without overlap', () => {
    const ranges = buildingStretches.map((s) => stretchRange(routeModel, s));
    ranges.forEach(([start, end], i) => {
      expect(end).toBeGreaterThan(start);
      if (i > 0) expect(start).toBeGreaterThanOrEqual(ranges[i - 1]![1] - 1e-6);
    });
  });

  it('only uses stops that exist', () => {
    const ids = new Set(stops.map((s) => s.id));
    for (const s of buildingStretches) {
      expect(ids.has(s.from) && ids.has(s.to)).toBe(true);
    }
  });
});

describe('buildBuildings', () => {
  it('is deterministic', () => {
    expect(buildBuildings(routeModel, buildingStretches)).toEqual(buildings);
  });

  it('fills every stretch with its own style', () => {
    for (const stretch of buildingStretches) {
      const own = buildings.filter((b) => b.stretchId === stretch.id);
      expect(own.length).toBeGreaterThan(4);
      expect(own.every((b) => b.style === stretch.style)).toBe(true);
    }
  });

  it('stays inside the stretch and within the size ranges', () => {
    for (const b of buildings) {
      const stretch = buildingStretches.find((s) => s.id === b.stretchId)!;
      const [start, end] = stretchRange(routeModel, stretch);
      expect(distanceAlong(b)).toBeGreaterThanOrEqual(start);
      expect(distanceAlong(b)).toBeLessThanOrEqual(end);
      // Lots next to an intersection or the stretch end are shortened (down to half the minimum).
      expect(b.footprint.width).toBeGreaterThanOrEqual(stretch.lotWidth[0] * 0.5);
      expect(b.footprint.width).toBeLessThanOrEqual(stretch.lotWidth[1] + 1.2);
      expect(b.footprint.depth).toBeGreaterThanOrEqual(stretch.depth[0]);
      expect(b.height).toBeLessThanOrEqual(stretch.height[1]);
    }
  });

  it('leaves the intersections clear', () => {
    for (const b of buildings) {
      const half = b.footprint.width / 2 / routeModel.length;
      for (const x of [b.u - half, b.u, b.u + half]) {
        expect(routeModel.intersections.some((g) => x >= g.from && x <= g.to)).toBe(false);
      }
    }
  });

  it('sets every stretch back behind the plowed ridge and the tree row', () => {
    for (const stretch of buildingStretches) {
      expect(stretch.setback).toBeGreaterThanOrEqual(6.5);
    }
  });

  it('only overlaps where neighbours on one side form an attached street wall', () => {
    const items = buildings.flatMap((b) => [
      { b, rect: b.footprint },
      ...(b.garage ? [{ b, rect: b.garage }] : []),
    ]);
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i]!;
        const c = items[j]!;
        const attachedPair =
          a.b.attached && c.b.attached && a.b.stretchId === c.b.stretchId && a.b.side === c.b.side;
        if (attachedPair) continue;
        expect(rectsOverlap(a.rect, c.rect)).toBe(false);
      }
    }
  });

  it('builds a continuous street wall in the Exchange District, broken only at intersections', () => {
    const wall = buildings.filter((b) => b.stretchId === 'exchange-warehouses');
    for (const side of [-1, 1]) {
      const row = wall.filter((b) => b.side === side).sort((a, b) => a.u - b.u);
      expect(row.length).toBeGreaterThan(4);
      row.slice(1).forEach((b, i) => {
        const previous = row[i]!;
        const along = (b.u - previous.u) * routeModel.length;
        const gap = along - (b.footprint.width + previous.footprint.width) / 2;
        const crossing = routeModel.intersections.some((x) => x.to >= previous.u && x.from <= b.u);
        if (!crossing) expect(gap).toBeLessThan(0.5);
      });
    }
  });

  it('keeps the downtown frontage near-continuous and the houses spaced', () => {
    const downtown = buildings.filter((b) => b.stretchId === 'downtown-towers');
    const houses = buildings.filter((b) => b.stretchId === 'residential');
    const gaps = (list: typeof buildings) =>
      [-1, 1].flatMap((side) => {
        const row = list.filter((b) => b.side === side).sort((a, b) => a.u - b.u);
        return row.slice(1).map((b, i) => {
          const previous = row[i]!;
          return (
            (b.u - previous.u) * routeModel.length -
            (b.footprint.width + previous.footprint.width) / 2
          );
        });
      });
    const downtownGaps = gaps(downtown).filter((g) => g < 20);
    expect(Math.max(...downtownGaps)).toBeLessThan(2);
    expect(Math.min(...gaps(houses))).toBeGreaterThan(1.5);
  });

  it('gives most houses a porch light and nothing else', () => {
    const houses = buildings.filter((b) => b.style === 'house');
    expect(houses.filter((b) => b.porch).length).toBeGreaterThan(houses.length / 2);
    expect(buildings.filter((b) => b.porch).every((b) => b.style === 'house')).toBe(true);
    for (const b of houses) {
      if (b.porch) expect(b.porch.y).toBeGreaterThan(1.5);
    }
  });

  it('puts garages only behind houses', () => {
    const garages = buildings.filter((b) => b.garage);
    expect(garages.length).toBeGreaterThan(0);
    expect(garages.every((b) => b.style === 'house')).toBe(true);
  });

  it('gives only houses gable roofs, and only towers crowns', () => {
    for (const b of buildings) {
      if (b.roof.kind === 'gable') expect(b.style).toBe('house');
      if (b.crown) expect(b.style).toBe('tower');
    }
    expect(buildings.some((b) => b.roof.kind === 'gable')).toBe(true);
    expect(buildings.some((b) => b.crown)).toBe(true);
  });

  it('lights windows from the zone: the shelter has warm windows only', () => {
    const shelter = routeModel.stopFractions.get('warming-shelter')! * routeModel.length;
    const near = buildings.filter((b) => Math.abs(distanceAlong(b) - shelter) < 14);
    expect(near.length).toBeGreaterThan(0);
    for (const b of near) {
      expect(b.warm).toBeGreaterThan(0);
      expect(b.cool).toBe(0);
    }
  });

  it('shows fewer lit windows on houses than on towers', () => {
    const mean = (list: number[]) => list.reduce((a, b) => a + b, 0) / list.length;
    const houses = buildings.filter((b) => b.style === 'house').map((b) => b.warm + b.cool);
    const towers = buildings.filter((b) => b.style === 'tower').map((b) => b.warm + b.cool);
    expect(mean(houses)).toBeLessThan(mean(towers));
  });
});

describe('buildings along cross streets', () => {
  const withStreets = buildBuildings(routeModel, buildingStretches, crossings);
  const arms = withStreets.filter((b) => b.armOf);
  const main = withStreets.filter((b) => !b.armOf);

  it('leaves the main layout exactly as it was', () => {
    expect(main).toEqual(buildings);
  });

  it('lines every cross street, in the style of the stretch it crosses', () => {
    for (const crossing of crossings) {
      const own = arms.filter((b) => b.armOf === crossing.id);
      expect(own.length).toBeGreaterThan(2);
      const nearest = main.reduce((best, b) =>
        Math.abs(b.u - crossing.u) < Math.abs(best.u - crossing.u) ? b : best,
      );
      expect(own.every((b) => b.style === nearest.style)).toBe(true);
    }
    expect(crossings.some((c) => arms.some((b) => b.armOf === c.id && b.style === 'house'))).toBe(
      true,
    );
  });

  it('keeps clear of the main road, the cross streets and every other building', () => {
    for (const b of arms) {
      const crossing = crossings.find((c) => c.id === b.armOf)!;
      for (const [x, z] of rectOutline(b.footprint)) {
        // Distance from the cross street's centre line, and from the main road's.
        const dx = x - crossing.centre.x;
        const dz = z - crossing.centre.z;
        const alongMain = Math.abs(dx * crossing.tangent.x + dz * crossing.tangent.z);
        const acrossMain = Math.abs(dx * crossing.right.x + dz * crossing.right.z);
        expect(alongMain).toBeGreaterThanOrEqual(crossing.street.width / 2 + 2);
        expect(acrossMain).toBeGreaterThanOrEqual(crossing.mainHalf + 2);
      }
    }
    const rects = arms.map((b) => b.footprint);
    const others = main.map((b) => b.footprint);
    for (const rect of rects) {
      for (const other of others) expect(rectsOverlap(rect, other)).toBe(false);
    }
  });

  it('shares the zone lighting of its crossing', () => {
    const shelterStreet = arms.filter((b) => b.armOf === 'residential-b');
    expect(shelterStreet.length).toBeGreaterThan(0);
    for (const b of shelterStreet) expect(b.warm).toBeGreaterThan(0);
  });
});

describe('selectBuildingsForTier', () => {
  it('keeps every building on high and medium, and thins only the unattached ones on low', () => {
    expect(selectBuildingsForTier(buildings, 'high')).toHaveLength(buildings.length);
    expect(selectBuildingsForTier(buildings, 'medium')).toHaveLength(buildings.length);
    const low = selectBuildingsForTier(buildings, 'low');
    expect(low.length).toBeLessThan(buildings.length);
    expect(low.filter((b) => b.attached)).toHaveLength(buildings.filter((b) => b.attached).length);
    expect(low.filter((b) => b.style === 'house').length).toBeLessThan(
      buildings.filter((b) => b.style === 'house').length,
    );
  });
});

describe('reserved ground', () => {
  it('leaves ground held for a landmark free of buildings', () => {
    const reserved: Rect = {
      x: buildings[0]!.footprint.x,
      z: buildings[0]!.footprint.z,
      yaw: buildings[0]!.footprint.yaw,
      width: 30,
      depth: 30,
    };
    const without = buildBuildings(routeModel, buildingStretches, crossings, [reserved]);
    expect(without.length).toBeLessThan(
      buildBuildings(routeModel, buildingStretches, crossings).length,
    );
    for (const b of without) expect(rectsOverlap(b.footprint, reserved)).toBe(false);
  });
});
