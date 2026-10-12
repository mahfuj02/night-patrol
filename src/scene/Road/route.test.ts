import { describe, expect, it } from 'vitest';
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

  it('uses the default width when a point has none', () => {
    const model = createRouteModel({
      points: [
        { x: 0, z: 0 },
        { x: 10, z: 0 },
      ],
    });
    expect(model.widths).toEqual([8, 8]);
    expect(model.widthAt(0.5)).toBe(8);
    expect(model.stopFractions.size).toBe(0);
  });
});
