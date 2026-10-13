import { BufferGeometry, Float32BufferAttribute } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Arm } from './crossStreets';
import { buildSnowRidge, type RidgeOptions } from './ridgeGeometry';

/** Segments along an arm. Cross streets are straight, so a few are enough. */
const ARM_SEGMENTS = 24;

/**
 * Flat road strips for cross-street arms, merged into one geometry (one draw call). Carries the
 * same attributes as the route ribbon, so the road shader draws the same packed snow and ruts:
 * `uv` and `aRoad` as (lateral offset, distance along the arm, ...) in metres. Also used for the
 * station bay pads, which are short strips from the road edge to a wall.
 */
/** What a flat road strip needs: where it starts, which way it runs, and its size. */
export type Strip = Pick<Arm, 'origin' | 'dir' | 'length' | 'width'>;

export function buildArmRibbons(arms: readonly Strip[], y: number): BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const road: number[] = [];
  const indices: number[] = [];

  for (const arm of arms) {
    const half = arm.width / 2;
    // Lateral direction matches the route ribbon: (dir.z, 0, -dir.x).
    const nx = arm.dir.z;
    const nz = -arm.dir.x;
    const base = positions.length / 3;
    for (let i = 0; i <= ARM_SEGMENTS; i++) {
      const along = (i / ARM_SEGMENTS) * arm.length;
      const px = arm.origin.x + arm.dir.x * along;
      const pz = arm.origin.z + arm.dir.z * along;
      for (const lateral of [-half, half]) {
        positions.push(px + nx * lateral, y, pz + nz * lateral);
        uvs.push(lateral, along);
        road.push(lateral, along, half);
      }
    }
    for (let i = 0; i < ARM_SEGMENTS; i++) {
      const a = base + i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  const normals = new Float32Array(positions.length);
  for (let i = 1; i < normals.length; i += 3) normals[i] = 1;
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('aRoad', new Float32BufferAttribute(road, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

/** The plowed ridges along every arm, merged into one geometry. */
export function buildArmRidges(arms: readonly Arm[], options: RidgeOptions): BufferGeometry {
  const parts = arms.map((arm, i) =>
    buildSnowRidge(arm.model, { ...options, seed: options.seed + i * 11 }),
  );
  const merged = mergeGeometries(parts);
  parts.forEach((part) => part.dispose());
  if (!merged) throw new Error('No cross-street ridges to merge');
  merged.computeBoundingSphere();
  return merged;
}
