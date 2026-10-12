import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { route } from '@/content/route';
import { buildSnowRidge } from './ridgeGeometry';
import { createRouteModel, routeModel } from './route';

const options = { step: 1.5, profile: 6, seed: 4 };
const ridge = buildSnowRidge(routeModel, options);
const position = ridge.getAttribute('position');
const normal = ridge.getAttribute('normal');
const triangles = ridge.getIndex()!.count / 3;

describe('buildSnowRidge', () => {
  it('is one indexed mesh with smooth normals and a plausible triangle count', () => {
    expect(ridge.getIndex()).not.toBeNull();
    expect(normal.count).toBe(position.count);
    expect(triangles).toBeGreaterThan(8000);
    expect(triangles).toBeLessThan(30000);
  });

  it('uses far fewer triangles on the low tier', () => {
    const low = buildSnowRidge(routeModel, { step: 3, profile: 4, seed: 4 });
    expect(low.getIndex()!.count / 3).toBeLessThan(triangles / 2);
  });

  it('is deterministic and varies with the seed', () => {
    const again = buildSnowRidge(routeModel, options);
    expect(again.getAttribute('position').array.slice(0, 60)).toEqual(position.array.slice(0, 60));
    const other = buildSnowRidge(routeModel, { ...options, seed: 5 });
    expect(other.getAttribute('position').array.slice(0, 60)).not.toEqual(
      position.array.slice(0, 60),
    );
  });

  it('faces up overall and has no negative heights', () => {
    let up = 0;
    for (let i = 0; i < normal.count; i++) up += normal.getY(i);
    expect(up / normal.count).toBeGreaterThan(0.2);
    for (let i = 0; i < position.count; i++) expect(position.getY(i)).toBeGreaterThanOrEqual(0);
  });

  it('stays beside the road, never on it', () => {
    const centreline = Array.from({ length: 1200 }, (_, i) => {
      const u = i / 1199;
      return { u, point: routeModel.curve.getPointAt(u) };
    });
    const probe = new Vector3();
    for (let i = 0; i < position.count; i += 23) {
      probe.fromBufferAttribute(position, i);
      let nearest = centreline[0]!;
      let best = Infinity;
      for (const sample of centreline) {
        const d = Math.hypot(probe.x - sample.point.x, probe.z - sample.point.z);
        if (d < best) {
          best = d;
          nearest = sample;
        }
      }
      expect(best).toBeGreaterThan(routeModel.widthAt(nearest.u) / 2 - 0.3);
    }
  });

  it('is a continuous ridge: crest height varies gently, never dropping to nothing mid-road', () => {
    const peak = (u: number) => {
      const target = routeModel.curve.getPointAt(u);
      let max = 0;
      for (let i = 0; i < position.count; i++) {
        if (Math.hypot(position.getX(i) - target.x, position.getZ(i) - target.z) < 9) {
          max = Math.max(max, position.getY(i));
        }
      }
      return max;
    };
    for (const u of [0.1, 0.25, 0.35, 0.55, 0.7, 0.9]) {
      expect(peak(u)).toBeGreaterThan(0.3);
      expect(peak(u)).toBeLessThan(1.6);
    }
  });

  it('is broken only at the intersection', () => {
    const noGap = createRouteModel({ points: route.points });
    const unbroken = buildSnowRidge(noGap, options);
    expect(triangles).toBeLessThan(unbroken.getIndex()!.count / 3);

    const centre = routeModel.curve.getPointAt(routeModel.stopFractions.get('portage-main')!);
    for (let i = 0; i < position.count; i++) {
      if (Math.hypot(position.getX(i) - centre.x, position.getZ(i) - centre.z) < 12) {
        expect(position.getY(i)).toBeLessThan(0.06);
      }
    }
  });
});
