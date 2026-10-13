import { describe, expect, it } from 'vitest';
import { stops } from '@/content';
import { buildLamps } from './lampLayout';
import { routeModel } from './route';

const lamps = buildLamps(routeModel);
const at = (stopId: string) => stops.find((s) => s.id === stopId)!.t;
const near = (t: number) => lamps.filter((l) => Math.abs(l.u - t) < 0.03);

describe('buildLamps', () => {
  it('lines the route with lamps in order', () => {
    expect(lamps.length).toBeGreaterThan(20);
    lamps.forEach((lamp, i) => {
      if (i > 0) expect(lamp.u).toBeGreaterThan(lamps[i - 1]!.u);
    });
    expect(lamps[lamps.length - 1]!.u).toBeLessThan(1);
  });

  it('is deterministic', () => {
    const again = buildLamps(routeModel);
    expect(again).toHaveLength(lamps.length);
    expect(again[5]!.head.toArray()).toEqual(lamps[5]!.head.toArray());
  });

  it('keeps poles clear of the road and heads over its edge', () => {
    for (const lamp of lamps) {
      const centre = routeModel.curve.getPointAt(lamp.u);
      const poleOffset = Math.hypot(lamp.pole.x - centre.x, lamp.pole.z - centre.z);
      const headOffset = Math.hypot(lamp.head.x - centre.x, lamp.head.z - centre.z);
      expect(poleOffset).toBeGreaterThan(routeModel.widthAt(lamp.u) / 2);
      expect(headOffset).toBeLessThan(poleOffset);
      expect(lamp.head.y).toBe(lamp.height);
    }
  });

  it('follows the zones: sodium in the Exchange, cool LED on the avenue, warm at the Forks', () => {
    expect(near(at('rrc-campus')).every((l) => l.type === 'sodium')).toBe(true);
    // The avenue is cool LED lamps (it hangs off The Forks until the LIILAB stop exists).
    expect(lamps.some((l) => l.type === 'led' && l.u > 0.8 && l.u < 0.9)).toBe(true);
    expect(lamps.some((l) => l.type === 'warm')).toBe(true);
  });

  it('makes LED lamps taller and the residential lamps dimmer than downtown lamps', () => {
    const led = lamps.find((l) => l.type === 'led')!;
    const sodium = lamps.find((l) => l.type === 'sodium')!;
    expect(led.height).toBeGreaterThan(sodium.height);
    const shelter = near(at('dashcam')).find((l) => l.type === 'led')!;
    const downtown = near(at('portage-main'))[0]!;
    expect(shelter.intensity).toBeLessThan(downtown.intensity);
  });

  it('alternates sides for sodium lamps and keeps LED lamps on one side', () => {
    const lateralSign = (lamp: (typeof lamps)[number]) => {
      const centre = routeModel.curve.getPointAt(lamp.u);
      const tangent = routeModel.curve.getTangentAt(lamp.u);
      return Math.sign((lamp.pole.x - centre.x) * tangent.z - (lamp.pole.z - centre.z) * tangent.x);
    };
    const sodium = lamps
      .filter((l) => l.type === 'sodium')
      .slice(0, 6)
      .map(lateralSign);
    expect(new Set(sodium).size).toBe(2);
    const led = lamps.filter((l) => l.type === 'led' && l.u > 0.7 && l.u < 0.8).map(lateralSign);
    expect(new Set(led).size).toBe(1);
  });
});
