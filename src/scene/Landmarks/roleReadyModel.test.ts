import { describe, expect, it } from 'vitest';
import { roleReadyPlacement } from './placement';
import {
  ROLE_TOWER,
  boardFaceGeometry,
  boardFrameGeometry,
  podiumFrontZ,
  podiumGeometry,
  podiumTop,
  towerFrontZ,
  towerGeometry,
  towerTop,
} from './roleReadyModel';

const box = (g: ReturnType<typeof towerGeometry>) => {
  g.computeBoundingBox();
  return g.boundingBox!;
};

describe('RoleReady tower model', () => {
  it('stands a tall glass tower on a low podium, set back from the podium front', () => {
    expect(towerTop).toBeGreaterThan(podiumTop * 3);
    expect(towerFrontZ).toBeGreaterThan(podiumFrontZ);
    const t = box(towerGeometry());
    expect(t.min.y).toBeCloseTo(podiumTop, 6);
    expect(t.max.y).toBeCloseTo(towerTop + 2.4, 5);
    const p = box(podiumGeometry());
    expect(p.min.y).toBeCloseTo(0, 6);
    expect(p.max.y).toBeCloseTo(podiumTop + 0.4, 5);
  });

  it('keeps everything inside the reserved ground', () => {
    const { min, max } = roleReadyPlacement.reserved;
    for (const g of [towerGeometry(), podiumGeometry(), boardFrameGeometry()]) {
      const b = box(g);
      expect(b.min.x).toBeGreaterThanOrEqual(min - 1);
      expect(b.max.x).toBeLessThanOrEqual(max + 1);
    }
  });

  it('hangs the sign board on the tower front, above the podium, facing the road', () => {
    const face = box(boardFaceGeometry());
    expect(face.min.y).toBeGreaterThan(podiumTop);
    expect(face.max.y).toBeLessThan(towerTop);
    expect(face.max.z).toBeLessThan(towerFrontZ);
    expect(face.max.x - face.min.x).toBeCloseTo(ROLE_TOWER.board.width, 5);
    const frame = box(boardFrameGeometry());
    expect(face.min.z).toBeLessThan(frame.min.z);
  });
});
