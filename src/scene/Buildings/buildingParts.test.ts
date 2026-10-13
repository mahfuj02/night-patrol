import { describe, expect, it } from 'vitest';
import { buildingStretches } from '@/content';
import { routeModel } from '../Road/route';
import { buildBuildings } from './buildingLayout';
import { CAP_HEIGHT, buildParts, WINDOW_GRID } from './buildingParts';

const buildings = buildBuildings(routeModel, buildingStretches);
const parts = buildParts(buildings);

describe('buildParts', () => {
  it('draws one body per building, plus a crown or garage where there is one', () => {
    const extras = buildings.filter((b) => b.crown || b.garage).length;
    expect(parts.bodies.length).toBeGreaterThanOrEqual(buildings.length);
    expect(parts.bodies.length).toBeLessThanOrEqual(buildings.length + extras);
    expect(parts.bodies.length).toBe(
      buildings.length +
        buildings.filter((b) => b.crown).length +
        buildings.filter((b) => b.garage).length,
    );
  });

  it('puts a gable on every gabled house and a snow slab on every flat roof', () => {
    const gabled = buildings.filter((b) => b.roof.kind === 'gable' && !b.crown).length;
    expect(parts.gables).toHaveLength(gabled);
    expect(parts.caps.length).toBeGreaterThan(0);
    expect(CAP_HEIGHT).toBeGreaterThan(0);
  });

  it('never gives garages windows, and gives every window part a positive grid', () => {
    for (const body of parts.bodies) {
      expect(body.grid.bay).toBeGreaterThan(0);
      expect(body.grid.floor).toBeGreaterThan(0);
    }
    expect(
      parts.bodies.filter((b) => b.grid === WINDOW_GRID.garage).every((b) => b.warm === 0),
    ).toBe(true);
  });

  it('stacks a crown on top of its tower', () => {
    const crowns = parts.bodies.filter((b) => b.y > 0);
    expect(crowns.length).toBe(buildings.filter((b) => b.crown).length);
    for (const crown of crowns) expect(crown.height).toBeGreaterThanOrEqual(3);
  });

  it('keeps warm and cool shares in range', () => {
    for (const body of parts.bodies) {
      expect(body.warm + body.cool).toBeLessThanOrEqual(1.0001);
      expect(body.warm).toBeGreaterThanOrEqual(0);
    }
  });
});
