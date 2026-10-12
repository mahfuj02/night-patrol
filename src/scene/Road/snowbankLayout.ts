import { Euler, Matrix4, Quaternion, Vector3 } from 'three';
import { createRandom, range } from '@/lib/random';
import type { RouteModel } from './route';

export interface SnowbankInstance {
  matrix: Matrix4;
  /** Arc-length fraction along the route. */
  u: number;
}

interface SnowbankOptions {
  /** Distance along the route between banks, in scene units. */
  spacing: number;
  seed: number;
}

/**
 * Transforms for a unit cube, squashed and scattered along both road edges.
 * Deterministic for a given seed, so the scenery is identical on every load.
 */
export function buildSnowbanks(model: RouteModel, options: SnowbankOptions): SnowbankInstance[] {
  const random = createRandom(options.seed);
  const count = Math.floor(model.length / options.spacing);
  const instances: SnowbankInstance[] = [];
  const position = new Vector3();
  const scale = new Vector3();
  const rotation = new Quaternion();
  const euler = new Euler();

  for (let i = 0; i < count; i++) {
    const u = (i + 0.5) / count;
    const p = model.curve.getPointAt(u);
    const tangent = model.curve.getTangentAt(u);
    const yaw = Math.atan2(tangent.x, tangent.z);
    const halfWidth = model.widthAt(u) / 2;

    for (const side of [-1, 1]) {
      const lengthScale = range(random, 4, 6.5);
      const heightScale = range(random, 0.9, 1.7);
      const depthScale = range(random, 1.8, 3);
      const offset = halfWidth + depthScale / 2 + range(random, 0.1, 0.8);
      // Lateral direction matches the road ribbon: (tangent.z, 0, -tangent.x).
      position.set(
        p.x + tangent.z * offset * side,
        heightScale * 0.12 - 0.04,
        p.z - tangent.x * offset * side,
      );
      euler.set(0, yaw + range(random, -0.15, 0.15), 0);
      rotation.setFromEuler(euler);
      scale.set(depthScale, heightScale, lengthScale);
      instances.push({ matrix: new Matrix4().compose(position, rotation, scale), u });
    }
  }
  return instances;
}
