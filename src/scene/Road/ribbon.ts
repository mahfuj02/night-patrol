import { BufferGeometry, Float32BufferAttribute } from 'three';
import type { RouteModel } from './route';

interface RibbonOptions {
  /** Number of samples along the whole route. */
  samples: number;
  /** Lateral extent for a given road width, as [from, to] offsets from the centre line. */
  extent: (roadWidth: number) => [number, number];
  y: number;
  /** Draw only `on` of every `on + off` quads, for dashed lines. */
  dash?: { on: number; off: number };
}

/** Flat strip following the route curve, facing up. The caller owns (and disposes) the geometry. */
export function buildRibbon(model: RouteModel, options: RibbonOptions): BufferGeometry {
  const { samples, extent, y, dash } = options;
  const positions = new Float32Array((samples + 1) * 2 * 3);
  const normals = new Float32Array((samples + 1) * 2 * 3);

  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    const p = model.curve.getPointAt(u);
    const tangent = model.curve.getTangentAt(u);
    // Lateral direction in the ground plane.
    const nx = tangent.z;
    const nz = -tangent.x;
    const [from, to] = extent(model.widthAt(u));
    const a = i * 6;
    positions.set([p.x + nx * from, y, p.z + nz * from, p.x + nx * to, y, p.z + nz * to], a);
    normals.set([0, 1, 0, 0, 1, 0], a);
  }

  const indices: number[] = [];
  for (let i = 0; i < samples; i++) {
    if (dash && i % (dash.on + dash.off) >= dash.on) continue;
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, c, b, b, c, d);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}
