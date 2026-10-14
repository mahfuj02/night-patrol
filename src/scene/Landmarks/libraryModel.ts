import { BufferGeometry, PlaneGeometry } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { metricBox } from './metricBox';

/**
 * The Millennium Library as a stylized silhouette of its downtown glass front, in local metres: the
 * origin is the centre of the footprint on the ground, +z points away from the road (the front
 * faces -z), and +x runs along the wall to the viewer's left (back along the road), -x to their
 * right (ahead). A wide glazed block under a pale roof slab, with end piers, a canopy over the
 * entrance and plain lettering. No logo, crest or brand mark (CLAUDE.md rule 10).
 */
export const LIBRARY = {
  width: 36,
  depth: 16,
  height: 12,
  /** The roof slab stands a little proud of the glass all round. */
  slab: { overhang: 1, thickness: 1.2 },
  /** The two limestone end piers at either end of the glass. */
  pier: { width: 2, extra: 1 },
  /** The entrance canopy: width, how far it stands out, and its height above the ground. */
  canopy: { width: 10, stand: 3, height: 4.4 },
  /** The lettering band on the glass above the lit lobby. */
  lettering: { width: 16, height: 1.9, bottom: 9.2 },
} as const;

const frontZ = -LIBRARY.depth / 2;
/** Height of the glass roof line, and of the top of the slab. */
export const glassTop = LIBRARY.height;
export const slabTop = LIBRARY.height + LIBRARY.slab.thickness;

function merge(parts: BufferGeometry[]): BufferGeometry {
  const merged = mergeGeometries(parts);
  parts.forEach((part) => part.dispose());
  if (!merged) throw new Error('Nothing to merge');
  return merged;
}

/** The glass block, with metre uvs for the curtain wall shader. */
export function libraryGlassGeometry(): BufferGeometry {
  return metricBox(LIBRARY.width, LIBRARY.height, LIBRARY.depth, 0, 0, 0);
}

/** The pale frame: the roof slab and the two end piers. */
export function libraryFrameGeometry(): BufferGeometry {
  const { width, depth, height, slab, pier } = LIBRARY;
  const pierX = width / 2 + pier.width / 2 - 0.2;
  return merge([
    metricBox(width + slab.overhang * 2, slab.thickness, depth + slab.overhang * 2, 0, height, 0),
    metricBox(pier.width, height, depth + pier.extra, pierX, 0, 0),
    metricBox(pier.width, height, depth + pier.extra, -pierX, 0, 0),
  ]);
}

/** Dark steel: the entrance canopy, its two posts and the door frame. */
export function libraryDetailGeometry(): BufferGeometry {
  const { canopy } = LIBRARY;
  const post = 0.22;
  const z = frontZ - canopy.stand;
  return merge([
    metricBox(canopy.width, 0.3, canopy.stand, 0, canopy.height, frontZ - canopy.stand / 2),
    metricBox(post, canopy.height, post, -canopy.width / 2 + 0.3, 0, z + 0.3),
    metricBox(post, canopy.height, post, canopy.width / 2 - 0.3, 0, z + 0.3),
    metricBox(4.2, 3.2, 0.2, 0, 0, frontZ - 0.1),
  ]);
}

/** The lettering plane on the glass, facing the road, a hair in front of it. */
export function libraryLetteringGeometry(): BufferGeometry {
  const { lettering } = LIBRARY;
  return new PlaneGeometry(lettering.width, lettering.height)
    .rotateY(Math.PI)
    .translate(0, lettering.bottom + lettering.height / 2, frontZ - 0.08);
}
