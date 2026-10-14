import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { stations } from '@/content';
import { headingVector } from '@/lib/parking';
import { lamps } from '../Road/lamps';
import { routeModel } from '../Road/route';
import { buildTrees } from '../Environment/treeLayout';
import { CAR_HALF_LENGTH } from './stationGeometry';
import { stationFrames } from './stationFrames';

const education = stationFrames[0]!;
const { geometry } = education;

/** Signed distance to the right of the route (negative is left) and the half road width there. */
function sideOfRoute(x: number, z: number) {
  const u = geometry.bayU;
  const c = routeModel.curve.getPointAt(u);
  const t = routeModel.curve.getTangentAt(u);
  return {
    across: (x - c.x) * -t.z + (z - c.z) * t.x,
    half: routeModel.widthAt(u) / 2,
  };
}

describe('station geometry', () => {
  it('stops the car facing the wall, nose to wall at the bay depth', () => {
    const [hx, hz] = headingVector(geometry.car.heading);
    // Facing against the wall normal (into the wall).
    expect(hx * geometry.wall.normal.x + hz * geometry.wall.normal.z).toBeCloseTo(-1, 6);
    // The nose is `depth` from the wall plane, measured along the normal.
    const nose = new Vector3(
      geometry.car.x + hx * CAR_HALF_LENGTH,
      0,
      geometry.car.z + hz * CAR_HALF_LENGTH,
    );
    const gap = nose.clone().sub(geometry.wall.centre).setY(0).dot(geometry.wall.normal);
    expect(gap).toBeCloseTo(education.station.bay.depth, 6);
  });

  it('parks on the side the station turns to, clear of the road', () => {
    const { across, half } = sideOfRoute(geometry.car.x, geometry.car.z);
    expect(education.station.bay.turn).toBe('left');
    expect(across).toBeLessThan(0);
    // The car (0.95 m half width) and a margin sit beyond the road edge.
    expect(Math.abs(across)).toBeGreaterThan(half + 1.2);
  });

  it('has a wall rectangle of the right size, facing the road, top above bottom', () => {
    const [tl, tr, br, bl] = geometry.wall.corners;
    expect(tl.distanceTo(tr)).toBeCloseTo(education.station.wall.rect.width, 6);
    expect(tl.y - bl.y).toBeCloseTo(education.station.wall.rect.height, 6);
    expect(tl.y).toBeGreaterThan(br.y);
    // The edge runs along the wall, so it is square to the normal.
    const edge = tr.clone().sub(tl).setY(0).normalize();
    expect(edge.dot(geometry.wall.normal)).toBeCloseTo(0, 6);
    // Seen from the road, top-left is to the viewer's left: moving left to right follows the
    // direction of travel here (the wall is on the left of the route).
    const t = routeModel.curve.getTangentAt(geometry.bayU);
    expect(edge.dot(new Vector3(t.x, 0, t.z))).toBeGreaterThan(0.5);
  });

  it('puts the red light before the bay and the stop, in the right order', () => {
    expect(education.lightT).toBeLessThan(geometry.bayU);
    expect(education.lightT).toBeLessThan(education.stopT);
    // About 20 m before the stop.
    expect((education.stopT - education.lightT) * routeModel.length).toBeCloseTo(20, 0);
  });

  it('puts the bay close to the stop it belongs to', () => {
    expect(Math.abs(geometry.bayU - education.stopT) * routeModel.length).toBeLessThan(6);
  });

  it('clears the road edge round the bay, and that clearing is part of the route', () => {
    expect(geometry.clearing.from).toBeLessThan(geometry.bayU);
    expect(geometry.clearing.to).toBeGreaterThan(geometry.bayU);
    expect(routeModel.clearings.some((c) => c.id === 'education-bay')).toBe(true);
    expect(routeModel.inIntersection(geometry.bayU)).toBe(true);
    // It is not an intersection: those stay the five approved ones.
    expect(routeModel.intersections).toHaveLength(5);
  });

  it('leaves no tree trunk or lamp pole in the bay', () => {
    for (const tree of buildTrees(routeModel, 4)) {
      const d = Math.hypot(tree.base.x - geometry.car.x, tree.base.z - geometry.car.z);
      expect(d).toBeGreaterThan(3);
    }
    for (const lamp of lamps) {
      expect(
        Math.hypot(lamp.pole.x - geometry.car.x, lamp.pole.z - geometry.car.z),
      ).toBeGreaterThan(3);
    }
  });

  it('lays a pad from the road edge to the wall, along the way the car drives in', () => {
    const { pad } = geometry;
    expect(pad.dir.dot(geometry.wall.normal)).toBeCloseTo(-1, 6);
    expect(pad.width).toBeGreaterThan(education.station.bay.width);
    // The pad ends at the wall plane: its far end is as far from the wall as the wall is.
    const end = pad.origin.clone().addScaledVector(pad.dir, pad.length);
    const toWall = end.clone().sub(geometry.wall.centre).setY(0).dot(geometry.wall.normal);
    expect(Math.abs(toWall)).toBeLessThan(0.05);
    // It starts at the road edge, overlapping it a little.
    const { across, half } = sideOfRoute(pad.origin.x, pad.origin.z);
    expect(Math.abs(Math.abs(across) - half)).toBeLessThan(1);
  });

  it('gives every station in the content a frame', () => {
    expect(stationFrames).toHaveLength(stations.length);
  });
});

describe.each(stationFrames.map((frame) => [frame.station.id, frame] as const))(
  'the %s station, whichever side it is on',
  (_id, frame) => {
    const { geometry: g, station } = frame;
    const side = station.bay.turn === 'left' ? -1 : 1;
    const across = () => {
      const c = routeModel.curve.getPointAt(g.bayU);
      const t = routeModel.curve.getTangentAt(g.bayU);
      return {
        across: (g.car.x - c.x) * -t.z + (g.car.z - c.z) * t.x,
        half: routeModel.widthAt(g.bayU) / 2,
      };
    };

    it('parks on the side it turns to, clear of the road, facing the wall', () => {
      const a = across();
      expect(Math.sign(a.across)).toBe(side);
      expect(Math.abs(a.across)).toBeGreaterThan(a.half + 1.2);
      const [hx, hz] = headingVector(g.car.heading);
      expect(hx * g.wall.normal.x + hz * g.wall.normal.z).toBeCloseTo(-1, 6);
    });

    it('puts the red light before the bay and the stop, 20 m or more before the stop', () => {
      expect(frame.lightT).toBeLessThan(g.bayU);
      expect(frame.lightT).toBeLessThan(frame.stopT);
      const metres = (frame.stopT - frame.lightT) * routeModel.length;
      expect(metres).toBeGreaterThanOrEqual(20 - 1e-6);
      expect(metres).toBeLessThanOrEqual(25);
    });

    it('leaves no tree trunk or lamp pole in the bay, and clears the road edge round it', () => {
      for (const tree of buildTrees(routeModel, 4)) {
        expect(Math.hypot(tree.base.x - g.car.x, tree.base.z - g.car.z)).toBeGreaterThan(3);
      }
      for (const lamp of lamps) {
        expect(Math.hypot(lamp.pole.x - g.car.x, lamp.pole.z - g.car.z)).toBeGreaterThan(3);
      }
      expect(routeModel.clearings.some((c) => c.id === `${station.id}-bay`)).toBe(true);
    });

    it('lays its pad from the road edge to the wall', () => {
      expect(g.pad.dir.dot(g.wall.normal)).toBeCloseTo(-1, 6);
      const end = g.pad.origin.clone().addScaledVector(g.pad.dir, g.pad.length);
      const toWall = end.clone().sub(g.wall.centre).setY(0).dot(g.wall.normal);
      expect(Math.abs(toWall)).toBeLessThan(0.05);
    });
  },
);
