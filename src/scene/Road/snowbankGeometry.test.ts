import { describe, expect, it } from 'vitest';
import { createSnowbankGeometry } from './snowbankGeometry';

describe('createSnowbankGeometry', () => {
  const high = createSnowbankGeometry('high');
  const low = createSnowbankGeometry('low');

  it('is indexed, smooth and has no uv attribute', () => {
    expect(high.getIndex()).not.toBeNull();
    expect(high.getAttribute('normal')).toBeDefined();
    expect(high.getAttribute('uv')).toBeUndefined();
  });

  it('merges seam vertices, so it has fewer vertices than faces would suggest', () => {
    const faces = high.getIndex()!.count / 3;
    expect(high.getAttribute('position').count).toBeLessThan(faces * 3);
  });

  it('uses fewer triangles on the low tier', () => {
    expect(low.getIndex()!.count).toBeLessThan(high.getIndex()!.count);
    expect(high.getIndex()!.count / 3).toBeLessThan(300);
  });

  it('is deterministic', () => {
    const again = createSnowbankGeometry('high');
    expect(again.getAttribute('position').array.slice(0, 30)).toEqual(
      high.getAttribute('position').array.slice(0, 30),
    );
  });

  it('is flat-bottomed, roughly unit-sized and lumpy', () => {
    const position = high.getAttribute('position');
    let minY = Infinity;
    let maxY = -Infinity;
    const radii = new Set<number>();
    for (let i = 0; i < position.count; i++) {
      minY = Math.min(minY, position.getY(i));
      maxY = Math.max(maxY, position.getY(i));
      radii.add(Math.round(Math.hypot(position.getX(i), position.getZ(i)) * 100));
    }
    expect(minY).toBeGreaterThan(-0.2);
    expect(minY).toBeLessThan(-0.05);
    expect(maxY).toBeGreaterThan(0.35);
    expect(maxY).toBeLessThan(0.7);
    expect(radii.size).toBeGreaterThan(4);
  });
});
