import { describe, expect, it } from 'vitest';
import { buildingStretches, stops } from '@/content';
import { rectsOverlap } from '@/lib/footprint';
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
      expect(b.footprint.width).toBeGreaterThanOrEqual(stretch.lotWidth[0]);
      expect(b.footprint.width).toBeLessThanOrEqual(stretch.lotWidth[1]);
      expect(b.footprint.depth).toBeGreaterThanOrEqual(stretch.depth[0]);
      expect(b.height).toBeLessThanOrEqual(stretch.height[1]);
    }
  });

  it('leaves the intersections clear', () => {
    for (const b of buildings) {
      const half = b.footprint.width / 2 / routeModel.length;
      for (const x of [b.u - half, b.u, b.u + half]) {
        expect(routeModel.inIntersection(x)).toBe(false);
      }
    }
  });

  it('sets every stretch back behind the plowed ridge and the tree row', () => {
    for (const stretch of buildingStretches) {
      expect(stretch.setback).toBeGreaterThanOrEqual(6.5);
    }
  });

  it('never overlaps another building or garage', () => {
    const rects = buildings.flatMap((b) => (b.garage ? [b.footprint, b.garage] : [b.footprint]));
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        expect(rectsOverlap(rects[i]!, rects[j]!)).toBe(false);
      }
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

describe('selectBuildingsForTier', () => {
  it('builds half as many on low and all on high and medium', () => {
    expect(selectBuildingsForTier(buildings, 'high')).toHaveLength(buildings.length);
    expect(selectBuildingsForTier(buildings, 'medium')).toHaveLength(buildings.length);
    expect(selectBuildingsForTier(buildings, 'low')).toHaveLength(Math.ceil(buildings.length / 2));
  });
});
