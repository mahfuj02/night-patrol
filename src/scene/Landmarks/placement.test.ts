import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { rectOutline } from '@/lib/footprint';
import { routeModel } from '../Road/route';
import { landmarkFrame, reservedRect, rrcPlacement } from './placement';

const frame = landmarkFrame(routeModel, rrcPlacement);
/** World position of a point at local (x, z) in the landmark frame. */
const world = (x: number, z: number) =>
  new Vector3(
    frame.position.x + Math.cos(frame.yaw) * x + Math.sin(frame.yaw) * z,
    0,
    frame.position.z - Math.sin(frame.yaw) * x + Math.cos(frame.yaw) * z,
  );

/** Distance along the route (metres) and across it (positive to the right) of a world point. */
function onRoute(p: Vector3) {
  let best = { along: 0, across: 0, dist: Infinity };
  for (let i = 0; i <= 2000; i++) {
    const u = i / 2000;
    const c = routeModel.curve.getPointAt(u);
    const d = Math.hypot(c.x - p.x, c.z - p.z);
    if (d < best.dist) {
      const t = routeModel.curve.getTangentAt(u);
      best = {
        along: u * routeModel.length,
        across: (p.x - c.x) * -t.z + (p.z - c.z) * t.x,
        dist: d,
      };
    }
  }
  return best;
}

describe('landmarkFrame', () => {
  it('puts the RRC campus on the left of the route, set back from the road edge', () => {
    const centre = onRoute(frame.position);
    expect(centre.across).toBeLessThan(0);
    const half = routeModel.widthAt(routeModel.stopFractions.get('rrc-campus')!) / 2;
    expect(Math.abs(centre.across)).toBeGreaterThanOrEqual(
      half + rrcPlacement.setback + rrcPlacement.depth / 2 - 0.5,
    );
  });

  it('points local +z away from the road and local -z at it', () => {
    const front = onRoute(world(0, -rrcPlacement.depth / 2));
    const back = onRoute(world(0, rrcPlacement.depth / 2));
    expect(Math.abs(front.across)).toBeLessThan(Math.abs(back.across));
  });

  it('runs local +x back along the road, away from the intersection', () => {
    const ahead = onRoute(world(-9, 0));
    const centre = onRoute(world(0, 0));
    const behind = onRoute(world(30, 0));
    expect(ahead.along).toBeGreaterThan(centre.along);
    expect(behind.along).toBeLessThan(centre.along);
  });

  it('keeps the campus block before the Princess St intersection', () => {
    const gap = routeModel.intersections.find((x) => x.id === 'princess-st')!;
    const stop = routeModel.stopFractions.get('rrc-campus')! * routeModel.length;
    const aheadEnd = onRoute(world(-9, 0)).along;
    expect(aheadEnd).toBeLessThan(gap.from * routeModel.length);
    // The campus is centred a little before the stop, as agreed.
    expect(onRoute(world(0, 0)).along).toBeCloseTo(stop + rrcPlacement.offset, 0);
  });

  it('knows the stop it belongs to', () => {
    expect(frame.stopT).toBeCloseTo(0.081, 6);
    expect(() => landmarkFrame(routeModel, { ...rrcPlacement, stopId: 'nowhere' })).toThrow();
  });
});

describe('reservedRect', () => {
  it('covers the campus, its step and the neighbours along the wall', () => {
    const rect = reservedRect(frame, rrcPlacement);
    expect(rect.width).toBe(rrcPlacement.reserved.max - rrcPlacement.reserved.min);
    expect(rect.depth).toBe(rrcPlacement.depth);
    const corners = rectOutline(rect);
    // The campus centre and the far neighbour both lie inside it.
    for (const local of [0, 40]) {
      const p = world(local, 0);
      const inside = corners.some(
        ([x, z]) => Math.hypot(x - p.x, z - p.z) < Math.hypot(rect.width, rect.depth),
      );
      expect(inside).toBe(true);
    }
  });
});
