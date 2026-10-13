import { BufferGeometry, Float32BufferAttribute } from 'three';
import { noise1 } from '@/lib/noise';
import type { RouteModel } from './route';

export interface RidgeOptions {
  /** Distance between cross-sections along the road, in metres. */
  step: number;
  /** Segments across the ridge, from the road edge to the outer foot. */
  profile: number;
  seed: number;
}

/** Metres over which the ridge ramps down to nothing at each end of an intersection. */
const TAPER = 5;

/** Distance in metres from `u` to the nearest intersection (0 inside one). Infinity if none. */
function distanceToIntersection(model: RouteModel, u: number): number {
  let best = Infinity;
  for (const { from, to } of model.intersections) {
    const gap = u < from ? from - u : u > to ? u - to : 0;
    best = Math.min(best, gap * model.length);
  }
  return best;
}

const smoothstep = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

/**
 * One continuous plowed ridge of snow along each edge of the road, as a single mesh. Height and
 * width vary gently and smoothly along the way; the crest sits nearer the road, as plowed snow
 * does. The ridge is broken (tapering to nothing) only where `model.intersections` say side
 * streets cross. The caller owns (and disposes) the geometry.
 */
export function buildSnowRidge(model: RouteModel, options: RidgeOptions): BufferGeometry {
  const { step, profile, seed } = options;
  const samples = Math.max(2, Math.round(model.length / step));
  const columns = profile + 1;
  const positions: number[] = [];
  const indices: number[] = [];

  for (const side of [-1, 1]) {
    const start = positions.length / 3;
    const alive: boolean[] = [];

    for (let i = 0; i <= samples; i++) {
      const u = i / samples;
      const along = u * model.length;
      const p = model.curve.getPointAt(u);
      const tangent = model.curve.getTangentAt(u);
      // Lateral direction matches the road ribbon: (tangent.z, 0, -tangent.x).
      const lx = tangent.z * side;
      const lz = -tangent.x * side;
      const half = model.widthAt(u) / 2;

      const lumpy =
        0.55 +
        0.4 * noise1(along / 9, seed + side) +
        0.24 * (noise1(along / 2.3, seed + 7 + side) - 0.5);
      const width = 1.9 + 0.8 * noise1(along / 14, seed + 3 + side * 5);
      const taper = smoothstep(distanceToIntersection(model, u) / TAPER);
      const height = Math.max(0.25, lumpy) * taper;
      alive.push(taper > 0.001);

      for (let k = 0; k < columns; k++) {
        const across = k / profile;
        const offset = half + 0.1 + across * width;
        // Crest at about 38% of the way across, nearer the road.
        const y = Math.sin(Math.PI * Math.pow(across, 0.7)) * height;
        positions.push(p.x + lx * offset, y, p.z + lz * offset);
      }
    }

    for (let i = 0; i < samples; i++) {
      if (!alive[i] && !alive[i + 1]) continue;
      for (let k = 0; k < profile; k++) {
        const a = start + i * columns + k;
        const b = a + 1;
        const c = a + columns;
        const d = c + 1;
        // The two sides mirror each other, so one needs the opposite winding to face up.
        if (side === 1) indices.push(a, c, b, b, c, d);
        else indices.push(a, b, c, b, d, c);
      }
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}
