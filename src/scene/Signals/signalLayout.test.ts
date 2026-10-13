import { describe, expect, it } from 'vitest';
import { driveOffset } from '@/lib/lanes';
import { crossings } from '../Road/crossings';
import { buildFurniture } from './signalLayout';

const furniture = buildFurniture(crossings);
const signalled = crossings.filter((c) => c.control === 'signals');
const stopped = crossings.filter((c) => c.control === 'stop');

type Crossing = (typeof crossings)[number];

/** Distances of a point from a crossing centre: along the route, and across it (to the right). */
function around(crossing: Crossing, x: number, z: number) {
  const dx = x - crossing.centre.x;
  const dz = z - crossing.centre.z;
  return {
    along: dx * crossing.tangent.x + dz * crossing.tangent.z,
    across: dx * crossing.right.x + dz * crossing.right.z,
  };
}

const near = (crossing: Crossing, x: number, z: number) =>
  Math.hypot(x - crossing.centre.x, z - crossing.centre.z) < 30;

describe('buildFurniture', () => {
  it('puts lights at Princess St and Portage & Main and stop signs at the residential crossings', () => {
    expect(signalled.map((c) => c.id)).toEqual(['princess-st', 'portage-main']);
    expect(stopped.map((c) => c.id)).toEqual(['residential-a', 'residential-b', 'residential-c']);
  });

  it('builds four mast arms and eight heads at each signalled crossing', () => {
    expect(furniture.masts).toHaveLength(signalled.length * 4);
    expect(furniture.heads).toHaveLength(signalled.length * 8);
  });

  it('lights green along the route and red on the cross street', () => {
    const green = furniture.heads.filter((h) => h.lit === 'green');
    const red = furniture.heads.filter((h) => h.lit === 'red');
    expect(green).toHaveLength(signalled.length * 4);
    expect(red).toHaveLength(signalled.length * 4);
  });

  it('hangs route heads over the driving lanes, facing along the route', () => {
    for (const crossing of signalled) {
      const lane = driveOffset(crossing.mainHalf * 2);
      const heads = furniture.heads.filter((h) => h.lit === 'green' && near(crossing, h.x, h.z));
      expect(heads).toHaveLength(4);
      for (const head of heads) {
        const { across } = around(crossing, head.x, head.z);
        expect(Math.abs(Math.abs(across) - lane)).toBeLessThan(1e-6);
        const face = { x: Math.sin(head.yaw), z: Math.cos(head.yaw) };
        expect(Math.abs(face.x * crossing.tangent.x + face.z * crossing.tangent.z)).toBeCloseTo(
          1,
          6,
        );
      }
    }
  });

  it('faces the heads before the crossing back at the traffic that drives up to it', () => {
    for (const crossing of signalled) {
      const before = furniture.heads.filter(
        (h) =>
          h.lit === 'green' && near(crossing, h.x, h.z) && around(crossing, h.x, h.z).along < 0,
      );
      expect(before).toHaveLength(2);
      for (const head of before) {
        const face = { x: Math.sin(head.yaw), z: Math.cos(head.yaw) };
        expect(face.x * crossing.tangent.x + face.z * crossing.tangent.z).toBeCloseTo(-1, 6);
      }
    }
  });

  it('stands every pole beside the road and inside the intersection gap', () => {
    for (const crossing of signalled) {
      const poles = furniture.masts.filter((m) => near(crossing, m.x, m.z));
      expect(poles).toHaveLength(4);
      for (const m of poles) {
        const { along, across } = around(crossing, m.x, m.z);
        // Off the main road and off the cross street.
        expect(
          Math.abs(across) > crossing.mainHalf || Math.abs(along) > crossing.street.width / 2,
        ).toBe(true);
        expect(m.height).toBeGreaterThan(5);
        expect(m.arm.from.y).toBeLessThan(m.height);
        expect(m.arm.to.y).toBe(m.arm.from.y);
      }
    }
  });

  it('gives every end of every residential cross street a stop sign facing traffic', () => {
    expect(furniture.signs).toHaveLength(stopped.length * 2);
    for (const crossing of stopped) {
      for (const arm of crossing.arms) {
        const sign = furniture.signs.find((s) => {
          const x = s.x - crossing.centre.x;
          const z = s.z - crossing.centre.z;
          return x * arm.dir.x + z * arm.dir.z > 0 && Math.hypot(x, z) < 12;
        })!;
        expect(sign).toBeDefined();
        const face = { x: Math.sin(sign.yaw), z: Math.cos(sign.yaw) };
        expect(face.x * arm.dir.x + face.z * arm.dir.z).toBeCloseTo(1, 6);
        const to = { x: sign.x - crossing.centre.x, z: sign.z - crossing.centre.z };
        expect(to.x * arm.dir.x + to.z * arm.dir.z).toBeGreaterThan(crossing.mainHalf);
        expect(sign.post).toBeGreaterThan(sign.y);
      }
    }
  });

  it('builds nothing for crossings without control', () => {
    expect(buildFurniture(crossings.map((c) => ({ ...c, control: 'none' as const })))).toEqual({
      masts: [],
      heads: [],
      signs: [],
    });
  });
});
