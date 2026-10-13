import { BufferGeometry, CylinderGeometry, Float32BufferAttribute } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { createGableGeometry } from '../Buildings/buildingGeometry';
import { metricBox } from './metricBox';

/**
 * Scenery on the route: lit buildings with no stop and no panel (docs/scenery.md). All are stylized
 * silhouettes in local metres: the origin is the centre of the footprint on the ground, +z points
 * away from the road (the fronts face -z), and +x runs along the wall to the viewer's left (back
 * along the road), -x to their right (ahead). None of them carries any lettering.
 */
export const WARM_HOUSE = {
  width: 16,
  depth: 9,
  /** Two storeys of this height. */
  storey: 3.1,
  floors: 2,
  roofRise: 2.6,
  porch: { x: -3.2, width: 3.6, depth: 2.2, height: 2.7 },
} as const;

export const MUSEUM = {
  /** The low stone base along the wall. */
  base: { width: 40, depth: 22, height: 9 },
  /** The glass tower: half widths at the bottom and top, height, and where it stands on the base. */
  tower: { bottom: 4.2, top: 2.2, height: 36, x: -9, z: 3 },
} as const;

export const ESPLANADE = {
  /** The bridge deck along the wall and the spire standing on it. */
  deck: { width: 34, height: 0.7, depth: 4, y: 3.5 },
  spire: { bottom: 1, top: 0.22, height: 34 },
  /** Heights on the spire where the cables leave it, and how far apart they land on the deck. */
  cableHeights: [14, 19, 24, 29],
  cableSpacing: 3.2,
} as const;

function merge(parts: BufferGeometry[]): BufferGeometry {
  const merged = mergeGeometries(parts);
  parts.forEach((part) => part.dispose());
  if (!merged) throw new Error('Nothing to merge');
  return merged;
}

/** A four-sided tapering tower, `bottom` and `top` being half widths, standing on y = 0. */
function taperedTower(
  bottom: number,
  top: number,
  height: number,
  x: number,
  z: number,
): BufferGeometry {
  // A four-sided cylinder has its corners at the radius, so scale the half width up by sqrt 2.
  const geometry = new CylinderGeometry(top * Math.SQRT2, bottom * Math.SQRT2, height, 4, 1, false)
    .rotateY(Math.PI / 4)
    .translate(x, height / 2, z);
  // Index-free, uv-free: it merges with other solid parts that have a uv, so give it one.
  const count = geometry.getAttribute('position').count;
  geometry.setAttribute('uv', new Float32BufferAttribute(new Float32Array(count * 2), 2));
  return geometry.toNonIndexed();
}

// ---------- the warm-windowed house ----------

/** The house body, with metre uvs for the window shader. */
export function houseBodyGeometry(): BufferGeometry {
  const { width, depth, storey, floors } = WARM_HOUSE;
  return metricBox(width, storey * floors, depth, 0, 0, 0);
}

/** The gabled roof (ridge along the wall), on its own because it has no uvs. */
export function houseRoofGeometry(): BufferGeometry {
  const { width, depth, storey, floors, roofRise } = WARM_HOUSE;
  return createGableGeometry()
    .scale(width + 0.8, roofRise, depth + 0.8)
    .translate(0, storey * floors, 0);
}

/** The porch: a slab roof on two posts, a step and the door. */
export function houseDetailGeometry(): BufferGeometry {
  const { porch, depth } = WARM_HOUSE;
  const frontZ = -depth / 2;
  const post = 0.16;
  return merge([
    metricBox(porch.width, 0.2, porch.depth, porch.x, porch.height, frontZ - porch.depth / 2),
    metricBox(
      post,
      porch.height,
      post,
      porch.x - porch.width / 2 + 0.2,
      0,
      frontZ - porch.depth + 0.2,
    ),
    metricBox(
      post,
      porch.height,
      post,
      porch.x + porch.width / 2 - 0.2,
      0,
      frontZ - porch.depth + 0.2,
    ),
    metricBox(porch.width - 0.6, 0.3, 0.9, porch.x, 0, frontZ - porch.depth - 0.4),
    metricBox(1.1, 2.1, 0.1, porch.x, 0.3, frontZ - 0.05),
  ]);
}

// ---------- the museum ----------

/** The stone base, with metre uvs for the window shader. */
export function museumBaseGeometry(): BufferGeometry {
  const { base } = MUSEUM;
  return merge([
    metricBox(base.width, base.height, base.depth, 0, 0, 0),
    metricBox(base.width + 0.8, 0.4, base.depth + 0.8, 0, base.height, 0),
  ]);
}

/** The glass tower, lit from inside. */
export function museumTowerGeometry(): BufferGeometry {
  const { tower } = MUSEUM;
  return taperedTower(tower.bottom, tower.top, tower.height, tower.x, tower.z).translate(
    0,
    MUSEUM.base.height,
    0,
  );
}

/** Top of the museum tower above the ground. */
export const museumTowerTop = MUSEUM.base.height + MUSEUM.tower.height;

// ---------- the bridge ----------

/** The bridge deck and its spire, one dark steel mesh with a lit finish. */
export function bridgeSteelGeometry(): BufferGeometry {
  const { deck, spire } = ESPLANADE;
  const tower = taperedTower(spire.bottom, spire.top, spire.height, 0, 0).translate(
    0,
    deck.y + deck.height,
    0,
  );
  return merge([
    metricBox(deck.width, deck.height, deck.depth, 0, deck.y, 0),
    // Two stubby piers under the deck at either end.
    metricBox(1.6, deck.y, deck.depth - 1, -deck.width / 2 + 2, 0, 0),
    metricBox(1.6, deck.y, deck.depth - 1, deck.width / 2 - 2, 0, 0),
    tower,
  ]);
}

/** Height of the spire tip above the ground. */
export const spireTop = ESPLANADE.deck.y + ESPLANADE.deck.height + ESPLANADE.spire.height;

/** The cable stays: line segments from the spire down to the deck, fanning both ways. */
export function bridgeCableGeometry(): BufferGeometry {
  const { deck, cableHeights, cableSpacing } = ESPLANADE;
  const deckTop = deck.y + deck.height;
  const positions: number[] = [];
  cableHeights.forEach((height, i) => {
    const from = deck.y + deck.height + height;
    const reach = cableSpacing * (i + 1);
    for (const side of [-1, 1]) {
      positions.push(0, from, 0, side * reach, deckTop, 0);
    }
  });
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  return geometry;
}
