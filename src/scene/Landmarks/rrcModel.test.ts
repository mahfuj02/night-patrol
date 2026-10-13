import { describe, expect, it } from 'vitest';
import { rrcPlacement } from './placement';
import {
  RRC,
  brickGeometry,
  campusGlassGeometry,
  campusTop,
  heritagePanelGeometry,
  limestoneGeometry,
  signFrameGeometry,
  signPlaneGeometry,
} from './rrcModel';

const box = (g: ReturnType<typeof campusGlassGeometry>) => {
  g.computeBoundingBox();
  return g.boundingBox!;
};

describe('RRC campus model', () => {
  it('is five storeys of glass with a lower step on the viewer\u2019s left (+x)', () => {
    const b = box(campusGlassGeometry());
    expect(campusTop).toBeCloseTo(RRC.floor * RRC.floors, 10);
    expect(b.min.y).toBeCloseTo(0, 6);
    expect(b.max.y).toBeCloseTo(campusTop, 6);
    // The block spans -9..9 and the step runs on to +17.
    expect(b.min.x).toBeCloseTo(-RRC.width / 2, 6);
    expect(b.max.x).toBeCloseTo(RRC.width / 2 + RRC.step.width, 6);
    expect(b.min.z).toBeCloseTo(-RRC.depth / 2, 6);
  });

  it('recesses the ground floor behind the overhanging upper floors', () => {
    const geometry = campusGlassGeometry();
    const position = geometry.getAttribute('position');
    let frontLow = Infinity;
    let frontHigh = Infinity;
    for (let i = 0; i < position.count; i++) {
      if (Math.abs(position.getX(i)) > RRC.width / 2 + 0.01) continue;
      const z = position.getZ(i);
      if (position.getY(i) < RRC.floor - 0.01) frontLow = Math.min(frontLow, z);
      else frontHigh = Math.min(frontHigh, z);
    }
    expect(frontLow - frontHigh).toBeCloseTo(RRC.recess, 6);
  });

  it('has metre uvs, so a floor is one storey high on the wall', () => {
    const geometry = campusGlassGeometry();
    const uv = geometry.getAttribute('uv');
    const position = geometry.getAttribute('position');
    let maxV = 0;
    for (let i = 0; i < uv.count; i++) {
      if (Math.abs(position.getX(i)) <= RRC.width / 2 && position.getY(i) > RRC.floor) {
        maxV = Math.max(maxV, uv.getY(i));
      }
    }
    expect(maxV).toBeCloseTo(RRC.floor * (RRC.floors - 1), 6);
  });

  it('puts the heritage panel on the front, on the viewer\u2019s right (-x), proud of the wall', () => {
    const b = box(heritagePanelGeometry());
    expect(b.max.x).toBeLessThan(0);
    expect(b.min.z).toBeLessThan(-RRC.depth / 2);
    expect(b.max.y).toBeLessThan(campusTop);
    expect(b.min.y).toBeGreaterThan(RRC.floor);
  });

  it('carries the rooftop lettering on a frame above the roof, in front of the roof edge line', () => {
    const letters = box(signPlaneGeometry());
    const frame = box(signFrameGeometry());
    expect(letters.min.y).toBeGreaterThan(campusTop);
    expect(frame.min.y).toBeCloseTo(campusTop, 6);
    expect(frame.max.y).toBeGreaterThan(letters.max.y);
    expect(letters.max.x - letters.min.x).toBeLessThan(RRC.width);
  });

  it('lines up the neighbours along the wall: step, limestone, then red brick', () => {
    const limestone = box(limestoneGeometry());
    const brick = box(brickGeometry());
    const stepEnd = RRC.width / 2 + RRC.step.width;
    // The cornice overhangs the limestone body by 0.35 m each side.
    expect(limestone.min.x).toBeCloseTo(stepEnd - 0.35, 5);
    expect(brick.min.x).toBeCloseTo(stepEnd + RRC.limestone.width, 5);
    // The whole run stays inside the ground reserved for the landmark.
    expect(brick.max.x).toBeLessThanOrEqual(rrcPlacement.reserved.max);
    expect(-RRC.width / 2).toBeGreaterThanOrEqual(rrcPlacement.reserved.min);
  });

  it('gives the neighbours the attributes their materials need', () => {
    for (const geometry of [limestoneGeometry(), brickGeometry(), campusGlassGeometry()]) {
      expect(geometry.getAttribute('position')).toBeDefined();
      expect(geometry.getAttribute('normal')).toBeDefined();
      expect(geometry.getAttribute('uv')).toBeDefined();
    }
    expect(brickGeometry().getAttribute('color')).toBeDefined();
    expect(limestoneGeometry().getAttribute('color')).toBeUndefined();
  });
});
