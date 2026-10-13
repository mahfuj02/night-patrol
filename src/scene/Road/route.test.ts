import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { driveOffset } from '@/lib/lanes';
import { route, stops } from '@/content';
import { createRouteModel, routeModel } from './route';

describe('route model', () => {
  it('has a plausible length and passes through the control points', () => {
    expect(routeModel.length).toBeGreaterThan(500);
    const start = routeModel.curve.getPointAt(0);
    const end = routeModel.curve.getPointAt(1);
    expect([start.x, start.z]).toEqual([route.points[0]!.x, route.points[0]!.z]);
    const last = route.points[route.points.length - 1]!;
    expect(end.x).toBeCloseTo(last.x, 3);
    expect(end.z).toBeCloseTo(last.z, 3);
  });

  it('keeps control point fractions strictly increasing from 0 to 1', () => {
    const { fractions } = routeModel;
    expect(fractions[0]).toBe(0);
    expect(fractions[fractions.length - 1]).toBeCloseTo(1, 10);
    fractions.forEach((f, i) => {
      if (i > 0) expect(f).toBeGreaterThan(fractions[i - 1]!);
    });
  });

  it('keeps stop t values in sync with the route curve', () => {
    for (const stop of stops) {
      const fraction = routeModel.stopFractions.get(stop.id);
      expect(fraction, `route point for ${stop.id}`).toBeDefined();
      // stops.ts stores three decimals, so allow half a unit in the last place
      expect(
        Math.abs(stop.t - fraction!),
        `stops.ts: ${stop.id} should have t: ${fraction!.toFixed(3)} (has ${stop.t})`,
      ).toBeLessThan(0.0006);
    }
  });

  it('is gentle: no sharp kinks along the road', () => {
    const samples = 800;
    let previous = routeModel.curve.getTangentAt(0);
    for (let i = 1; i <= samples; i++) {
      const tangent = routeModel.curve.getTangentAt(i / samples);
      expect(previous.angleTo(tangent)).toBeLessThan(0.25);
      previous = tangent;
    }
  });

  it('stays flat', () => {
    for (let i = 0; i <= 50; i++) {
      expect(routeModel.curve.getPointAt(i / 50).y).toBe(0);
    }
  });

  it('is wider on the Portage straight than in the Exchange', () => {
    const exchange = routeModel.widthAt(routeModel.stopFractions.get('rrc-campus')!);
    const portage = routeModel.widthAt(routeModel.stopFractions.get('portage-main')!);
    expect(portage).toBeGreaterThan(exchange);
  });

  it('finds the five approved intersections, apart and in order', () => {
    expect(routeModel.intersections.map((x) => x.id)).toEqual([
      'princess-st',
      'portage-main',
      'residential-a',
      'residential-b',
      'residential-c',
    ]);
    const crossings = [...routeModel.intersections].sort((a, b) => a.from - b.from);
    crossings.forEach((x, i) => {
      expect(x.from).toBeGreaterThanOrEqual(0);
      expect(x.to).toBeLessThanOrEqual(1);
      if (i > 0) expect(x.from).toBeGreaterThan(crossings[i - 1]!.to);
    });
  });

  it('centres Portage & Main on its stop and measures offsets in metres', () => {
    const { from, to } = routeModel.intersections.find((x) => x.id === 'portage-main')!;
    const centre = routeModel.stopFractions.get('portage-main')!;
    expect(from).toBeLessThan(centre);
    expect(to).toBeGreaterThan(centre);
    expect((to - from) * routeModel.length).toBeCloseTo(44, 3);
    expect(routeModel.inIntersection(centre)).toBe(true);
    expect(routeModel.inIntersection(0.001)).toBe(false);
    const princess = routeModel.intersections.find((x) => x.id === 'princess-st')!;
    const rrc = routeModel.stopFractions.get('rrc-campus')!;
    expect(((princess.from + princess.to) / 2 - rrc) * routeModel.length).toBeCloseTo(16, 3);
    expect(routeModel.inIntersection(to + 2 / routeModel.length, 4)).toBe(true);
  });

  it('puts the car lane to the right of the centre line, by the drive offset', () => {
    for (const u of [0.05, 0.3, 0.6, 0.9]) {
      const centre = routeModel.curve.getPointAt(u);
      const tangent = routeModel.curve.getTangentAt(u);
      const lane = routeModel.lanePointAt(u);
      const offset = lane.clone().sub(centre);
      expect(offset.length()).toBeCloseTo(driveOffset(routeModel.widthAt(u)), 6);
      // Right of travel: cross(tangent, up) points right.
      expect(offset.dot(new Vector3(-tangent.z, 0, tangent.x))).toBeGreaterThan(0);
      expect(offset.dot(tangent)).toBeCloseTo(0, 6);
    }
  });

  it('has a route length in content that matches the real curve', () => {
    expect(Math.abs(route.lengthMetres - routeModel.length)).toBeLessThan(0.5);
  });

  it('uses the default width when a point has none', () => {
    const model = createRouteModel({
      lengthMetres: 10,
      points: [
        { x: 0, z: 0 },
        { x: 10, z: 0 },
      ],
    });
    expect(model.widths).toEqual([8, 8]);
    expect(model.widthAt(0.5)).toBe(8);
    expect(model.stopFractions.size).toBe(0);
    expect(model.intersections).toEqual([]);
    expect(model.inIntersection(0.5)).toBe(false);
  });
});
