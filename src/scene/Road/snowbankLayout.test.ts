import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { routeModel } from './route';
import { buildSnowbanks } from './snowbankLayout';

describe('buildSnowbanks', () => {
  const options = { spacing: 6, seed: 11 };
  const banks = buildSnowbanks(routeModel, options);

  it('places a bank on each side every spacing units', () => {
    expect(banks).toHaveLength(Math.floor(routeModel.length / options.spacing) * 2);
  });

  it('is deterministic for a seed and differs between seeds', () => {
    const again = buildSnowbanks(routeModel, options);
    expect(again[7]!.matrix.elements).toEqual(banks[7]!.matrix.elements);
    const other = buildSnowbanks(routeModel, { ...options, seed: 12 });
    expect(other[7]!.matrix.elements).not.toEqual(banks[7]!.matrix.elements);
  });

  it('keeps every bank clear of the road surface and above ground', () => {
    const position = new Vector3();
    for (const bank of banks) {
      position.setFromMatrixPosition(bank.matrix);
      const centre = routeModel.curve.getPointAt(bank.u);
      const lateral = Math.hypot(position.x - centre.x, position.z - centre.z);
      expect(lateral).toBeGreaterThan(routeModel.widthAt(bank.u) / 2);
      expect(position.y).toBeGreaterThan(0);
    }
  });

  it('puts banks on both sides of the road', () => {
    const tangent = routeModel.curve.getTangentAt(banks[0]!.u);
    const position = new Vector3();
    const sides = [banks[0]!, banks[1]!].map((bank) => {
      position.setFromMatrixPosition(bank.matrix);
      const centre = routeModel.curve.getPointAt(bank.u);
      return Math.sign((position.x - centre.x) * tangent.z - (position.z - centre.z) * tangent.x);
    });
    expect(sides[0]).not.toBe(sides[1]);
  });
});
