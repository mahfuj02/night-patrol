import { SphereGeometry, type BufferGeometry } from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Value noise from a position hash: deterministic, so seam vertices get the same displacement. */
function hash(x: number, y: number, z: number): number {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return h - Math.floor(h);
}

function smoothNoise(x: number, y: number, z: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const fade = (t: number) => t * t * (3 - 2 * t);
  const fx = fade(x - xi);
  const fy = fade(y - yi);
  const fz = fade(z - zi);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const corner = (dx: number, dy: number, dz: number) => hash(xi + dx, yi + dy, zi + dz);
  return lerp(
    lerp(
      lerp(corner(0, 0, 0), corner(1, 0, 0), fx),
      lerp(corner(0, 1, 0), corner(1, 1, 0), fx),
      fy,
    ),
    lerp(
      lerp(corner(0, 0, 1), corner(1, 0, 1), fx),
      lerp(corner(0, 1, 1), corner(1, 1, 1), fx),
      fy,
    ),
    fz,
  );
}

/**
 * A soft, lumpy mound for snowbanks: a squashed sphere (diameter 1) with noise on the surface,
 * flat-bottomed so it sits on the ground. Instances scale it into long, low banks. `detail` sets
 * the segment count: more for high and medium tiers, fewer for low.
 */
export function createSnowbankGeometry(detail: 'high' | 'low'): BufferGeometry {
  const [widthSegments, heightSegments] = detail === 'high' ? [12, 8] : [8, 6];
  const sphere = new SphereGeometry(0.5, widthSegments, heightSegments);
  const position = sphere.getAttribute('position');
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const lump = 1 + 0.32 * (smoothNoise(x * 3.1 + 7, y * 3.1, z * 3.1) - 0.5);
    position.setXYZ(i, x * lump, Math.max(y, -0.12) * lump, z * lump);
  }
  // Drop the sphere's UVs and normals so coincident seam vertices merge, then recompute smooth
  // normals: the banks are shaded in world space and need no UVs.
  sphere.deleteAttribute('uv');
  sphere.deleteAttribute('normal');
  const merged = mergeVertices(sphere, 1e-4);
  sphere.dispose();
  merged.computeVertexNormals();
  merged.computeBoundingSphere();
  return merged;
}
