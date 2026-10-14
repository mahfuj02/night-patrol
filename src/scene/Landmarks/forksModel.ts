import { BufferGeometry, Float32BufferAttribute } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { createGableGeometry } from '../Buildings/buildingGeometry';
import { metricBox } from './metricBox';

/**
 * The market building at The Forks as a stylized blockout, in local metres: the origin is the
 * centre of the footprint on the ground, +z points away from the road (the front faces -z), and +x
 * runs along the wall. A long low brick hall with a taller glazed market hall behind its middle
 * under a snowy gable, and a string of warm lights along the eaves. No lettering and no logo.
 */
export const FORKS = {
  /** The long brick hall along the wall. */
  base: { width: 30, depth: 12, height: 6 },
  /** The glazed market hall behind the middle of it: width, depth, wall height, roof rise. */
  hall: { width: 14, depth: 10, height: 10, rise: 3.2, z: 2.5 },
  /** The string of lights along the front eave: how many bulbs, their spacing and height. */
  lights: { count: 24, spacing: 1.2, size: 0.28, height: 6.4 },
} as const;

const frontZ = -FORKS.base.depth / 2;
/** Height of the top of the roof ridge. */
export const ridgeTop = FORKS.hall.height + FORKS.hall.rise;

function merge(parts: BufferGeometry[]): BufferGeometry {
  const merged = mergeGeometries(parts);
  parts.forEach((part) => part.dispose());
  if (!merged) throw new Error('Nothing to merge');
  return merged;
}

/** The brick hall and a cornice, with metre uvs and white vertex colours for the brick shader. */
export function forksBaseGeometry(): BufferGeometry {
  const { base } = FORKS;
  const geometry = merge([
    metricBox(base.width, base.height, base.depth, 0, 0, 0),
    metricBox(base.width + 0.6, 0.4, base.depth + 0.6, 0, base.height, 0),
  ]);
  const count = geometry.getAttribute('position').count;
  geometry.setAttribute(
    'color',
    new Float32BufferAttribute(new Float32Array(count * 3).fill(1), 3),
  );
  return geometry;
}

/** The glazed market hall, with metre uvs for the curtain wall shader. */
export function forksHallGeometry(): BufferGeometry {
  const { hall } = FORKS;
  return metricBox(hall.width, hall.height, hall.depth, 0, 0, hall.z);
}

/** The snowy gabled roof over the market hall (ridge along the wall). It has no uvs. */
export function forksRoofGeometry(): BufferGeometry {
  const { hall } = FORKS;
  return createGableGeometry()
    .scale(hall.width + 1, hall.rise, hall.depth + 1)
    .translate(0, hall.height, hall.z);
}

/** X positions of the eave lights, centred on the front. */
export function lightXs(): number[] {
  const { count, spacing } = FORKS.lights;
  return Array.from({ length: count }, (_, i) => (i - (count - 1) / 2) * spacing);
}

/** The string of warm lights along the front eave of the brick hall. */
export function forksLightsGeometry(): BufferGeometry {
  const { lights } = FORKS;
  return merge(
    lightXs().map((x) =>
      metricBox(lights.size, lights.size, lights.size, x, lights.height, frontZ - 0.3),
    ),
  );
}
