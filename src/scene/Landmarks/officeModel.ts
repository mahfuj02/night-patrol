import { BufferGeometry, PlaneGeometry } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { metricBox } from './metricBox';

/**
 * The LIILAB office as a stylized blockout of a small glass office, in local metres: the origin is
 * the centre of the footprint on the ground, +z points away from the road (the front faces -z), and
 * +x runs along the wall. A three-storey glass front under a pale roof slab, an entrance canopy, a
 * sign in plain lettering, and rows of lit "monitors" at desk height behind the glass. No logo.
 */
export const OFFICE = {
  width: 20,
  depth: 14,
  storey: 3.6,
  floors: 3,
  slab: { overhang: 0.6, thickness: 0.8 },
  canopy: { width: 8, stand: 2.4, height: 4 },
  /** The sign on the glass, above the lit wall the station uses. */
  sign: { width: 17, height: 1.8, bottom: 8.4 },
  /** The monitors: how many in a row, their size, and the height of each row. */
  monitors: { count: 7, width: 1.3, height: 0.8, spacing: 2.5, rows: [1.0, 4.6] as const },
} as const;

const frontZ = -OFFICE.depth / 2;
/** Height of the glass, and of the top of the roof slab. */
export const glassTop = OFFICE.storey * OFFICE.floors;
export const slabTop = glassTop + OFFICE.slab.thickness;

function merge(parts: BufferGeometry[]): BufferGeometry {
  const merged = mergeGeometries(parts);
  parts.forEach((part) => part.dispose());
  if (!merged) throw new Error('Nothing to merge');
  return merged;
}

/** The glass block, with metre uvs for the curtain wall shader. */
export function officeGlassGeometry(): BufferGeometry {
  return metricBox(OFFICE.width, glassTop, OFFICE.depth, 0, 0, 0);
}

/** The pale roof slab, a little proud of the glass. */
export function officeFrameGeometry(): BufferGeometry {
  const { width, depth, slab } = OFFICE;
  return metricBox(
    width + slab.overhang * 2,
    slab.thickness,
    depth + slab.overhang * 2,
    0,
    glassTop,
    0,
  );
}

/** Dark steel: the entrance canopy, its posts and the door. */
export function officeDetailGeometry(): BufferGeometry {
  const { canopy } = OFFICE;
  const post = 0.2;
  const z = frontZ - canopy.stand;
  return merge([
    metricBox(canopy.width, 0.3, canopy.stand, 0, canopy.height, frontZ - canopy.stand / 2),
    metricBox(post, canopy.height, post, -canopy.width / 2 + 0.3, 0, z + 0.3),
    metricBox(post, canopy.height, post, canopy.width / 2 - 0.3, 0, z + 0.3),
    metricBox(3.6, 3, 0.2, 0, 0, frontZ - 0.1),
  ]);
}

/** The sign plane on the glass, facing the road, a hair in front of it. */
export function officeSignGeometry(): BufferGeometry {
  const { sign } = OFFICE;
  return new PlaneGeometry(sign.width, sign.height)
    .rotateY(Math.PI)
    .translate(0, sign.bottom + sign.height / 2, frontZ - 0.08);
}

/** X positions of the monitors in a row, centred on the front. */
export function monitorXs(): number[] {
  const { count, spacing } = OFFICE.monitors;
  return Array.from({ length: count }, (_, i) => (i - (count - 1) / 2) * spacing);
}

/** The lit monitor panes behind the glass: a row at desk height on each of two floors. */
export function officeMonitorsGeometry(): BufferGeometry {
  const { monitors } = OFFICE;
  return merge(
    monitors.rows.flatMap((y) =>
      monitorXs().map((x) => metricBox(monitors.width, monitors.height, 0.1, x, y, frontZ - 0.1)),
    ),
  );
}
