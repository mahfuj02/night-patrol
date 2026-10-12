import { describe, expect, it } from 'vitest';
import { lamps } from '../Road/lamps';
import { routeModel } from '../Road/route';
import { buildElms, selectElmsForTier } from './elmLayout';

const elms = buildElms(routeModel);
const count = (from: number, to: number) => elms.filter((e) => e.u >= from && e.u <= to).length;

describe('buildElms', () => {
  it('plants a few dozen elms', () => {
    expect(elms.length).toBeGreaterThan(20);
    expect(elms.length).toBeLessThan(140);
  });

  it('is deterministic', () => {
    const again = buildElms(routeModel);
    expect(again).toHaveLength(elms.length);
    expect(again[3]!.base.toArray()).toEqual(elms[3]!.base.toArray());
  });

  it('follows the zone density: many on the avenue, almost none downtown', () => {
    const avenue = count(0.738, 0.798);
    const downtown = count(0.44, 0.61);
    expect(avenue).toBeGreaterThan(downtown);
    expect(avenue).toBeGreaterThanOrEqual(3);
    expect(downtown).toBeLessThanOrEqual(3);
  });

  it('keeps trunks off the road and its banks', () => {
    for (const elm of elms) {
      const centre = routeModel.curve.getPointAt(elm.u);
      const offset = Math.hypot(elm.base.x - centre.x, elm.base.z - centre.z);
      expect(offset).toBeGreaterThan(routeModel.widthAt(elm.u) / 2 + 3);
      expect(elm.base.y).toBe(0);
    }
  });

  it('keeps trunks clear of lamp poles', () => {
    for (const elm of elms) {
      for (const lamp of lamps) {
        expect(
          Math.hypot(lamp.pole.x - elm.base.x, lamp.pole.z - elm.base.z),
        ).toBeGreaterThanOrEqual(3.5);
      }
    }
  });

  it('leans each canopy toward the road', () => {
    for (const elm of elms.slice(0, 20)) {
      const centre = routeModel.curve.getPointAt(elm.u);
      const before = Math.hypot(elm.base.x - centre.x, elm.base.z - centre.z);
      const after = Math.hypot(
        elm.base.x + elm.lean.x - centre.x,
        elm.base.z + elm.lean.z - centre.z,
      );
      expect(after).toBeLessThan(before);
    }
  });

  it('gives sensible sizes', () => {
    for (const elm of elms) {
      expect(elm.height).toBeGreaterThanOrEqual(11);
      expect(elm.height).toBeLessThanOrEqual(15);
      expect(elm.canopyWidth).toBeGreaterThanOrEqual(11);
    }
  });
});

describe('selectElmsForTier', () => {
  it('keeps all trees on high and medium and half on low', () => {
    expect(selectElmsForTier(elms, 'high')).toHaveLength(elms.length);
    expect(selectElmsForTier(elms, 'medium')).toHaveLength(elms.length);
    expect(selectElmsForTier(elms, 'low')).toHaveLength(Math.ceil(elms.length / 2));
  });
});
