import { BufferGeometry } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { metricBox } from './metricBox';

/**
 * The Skills building as a stylized blockout of a tech building, in local metres: the origin is the
 * centre of the footprint on the ground, +z points away from the road (the front faces -z), and +x
 * runs along the wall. A dark glass block with a rooftop plant and mast, an entrance canopy and a
 * band of cool accent light along the roofline. It carries no lettering and no logo.
 */
export const SKILLS = {
  width: 24,
  depth: 16,
  height: 19,
  /** The entrance canopy: width, how far it stands out, and its height above the ground. */
  canopy: { width: 9, stand: 2.6, height: 4.2 },
  /** The rooftop plant box and the mast. */
  plant: { width: 8, depth: 6, height: 2.8, x: -5 },
  mast: { x: 6, height: 11, size: 0.4 },
  /** The accent band along the front of the roofline, and the corner strips. */
  band: { height: 0.5, inset: 1.6 },
} as const;

const frontZ = -SKILLS.depth / 2;
/** Height of the roof, and of the top of the mast. */
export const roofTop = SKILLS.height;
export const mastTop = SKILLS.height + SKILLS.mast.height;

function merge(parts: BufferGeometry[]): BufferGeometry {
  const merged = mergeGeometries(parts);
  parts.forEach((part) => part.dispose());
  if (!merged) throw new Error('Nothing to merge');
  return merged;
}

/** The glass block, with metre uvs for the curtain wall shader. */
export function skillsGlassGeometry(): BufferGeometry {
  return metricBox(SKILLS.width, SKILLS.height, SKILLS.depth, 0, 0, 0);
}

/** Dark steel: the canopy and its posts, the door, the rooftop plant and the mast. */
export function skillsDetailGeometry(): BufferGeometry {
  const { canopy, plant, mast } = SKILLS;
  const post = 0.22;
  const z = frontZ - canopy.stand;
  return merge([
    metricBox(canopy.width, 0.3, canopy.stand, 0, canopy.height, frontZ - canopy.stand / 2),
    metricBox(post, canopy.height, post, -canopy.width / 2 + 0.3, 0, z + 0.3),
    metricBox(post, canopy.height, post, canopy.width / 2 - 0.3, 0, z + 0.3),
    metricBox(4, 3.2, 0.2, 0, 0, frontZ - 0.1),
    metricBox(plant.width, plant.height, plant.depth, plant.x, roofTop, 2),
    metricBox(mast.size, mast.height, mast.size, mast.x, roofTop, 2),
  ]);
}

/** The lit accent strips: a band along the roofline of the front, two corner strips and the mast tip. */
export function skillsAccentGeometry(): BufferGeometry {
  const { band, mast, width, height } = SKILLS;
  const half = width / 2;
  return merge([
    metricBox(width - band.inset * 2, band.height, 0.2, 0, height - 1.2, frontZ - 0.12),
    metricBox(0.3, height - 3, 0.2, -half + 0.6, 1.5, frontZ - 0.12),
    metricBox(0.3, height - 3, 0.2, half - 0.6, 1.5, frontZ - 0.12),
    metricBox(0.9, 0.9, 0.9, mast.x, mastTop, 2),
  ]);
}
