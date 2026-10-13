import { BufferGeometry, Float32BufferAttribute, PlaneGeometry } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { metricBox } from './metricBox';

/**
 * The City services building as a stylized blockout, in local metres: the origin is the centre of
 * the civic hall's footprint on the ground, +z points away from the road (the front faces -z), and
 * +x runs along the wall to the viewer's left (back along the road), -x to their right (ahead).
 * A four-storey limestone hall with a columned entrance, and a lower brick annex behind it.
 */
export const CITY = {
  width: 20,
  depth: 14,
  storey: 3.8,
  floors: 4,
  /** The lower annex beside the hall, toward +x. */
  annex: { width: 14, depth: 12, storey: 3.6, floors: 2 },
  /** The entrance, board and door sit this far toward the road's ahead side (-x), so they face the approaching car. */
  entranceX: -3.5,
  /** The columned entrance: column count, size and how far the canopy stands out. */
  portico: { columns: 4, radius: 0.32, height: 4.6, stand: 2.2, width: 9 },
  /** The request board on the wall over the entrance. */
  board: { width: 7.2, height: 2.4, bottom: 5.4 },
  /** The rooftop lettering. */
  sign: { width: 11, height: 1.8, lift: 0.8 },
} as const;

/** Height of the hall roof. */
export const hallTop = CITY.storey * CITY.floors;
const frontZ = -CITY.depth / 2;

function merge(parts: BufferGeometry[]): BufferGeometry {
  const merged = mergeGeometries(parts);
  parts.forEach((part) => part.dispose());
  if (!merged) throw new Error('Nothing to merge');
  return merged;
}

/** The civic hall: its body and a cornice a little proud of the wall. */
export function hallGeometry(): BufferGeometry {
  return merge([
    metricBox(CITY.width, hallTop, CITY.depth, 0, 0, 0),
    metricBox(CITY.width + 0.7, 0.45, CITY.depth + 0.7, 0, hallTop, 0),
  ]);
}

/** The brick annex, with white vertex colours so the brick wall material can tint it. */
export function annexGeometry(): BufferGeometry {
  const { annex, width } = CITY;
  const top = annex.floors * annex.storey;
  const x = width / 2 + annex.width / 2;
  const geometry = merge([
    metricBox(annex.width, top, annex.depth, x, 0, 0),
    metricBox(annex.width + 0.5, 0.35, annex.depth + 0.5, x, top, 0),
  ]);
  const count = geometry.getAttribute('position').count;
  geometry.setAttribute(
    'color',
    new Float32BufferAttribute(new Float32Array(count * 3).fill(1), 3),
  );
  return geometry;
}

/** Column x positions across the entrance, centred on the door. */
export function columnXs(): number[] {
  const { columns, width } = CITY.portico;
  return Array.from(
    { length: columns },
    (_, i) => CITY.entranceX - width / 2 + (width * i) / (columns - 1),
  );
}

/** Dark steel and stone details: the portico columns and canopy, the door and the sign frame. */
export function detailGeometry(): BufferGeometry {
  const { portico, sign } = CITY;
  const post = 0.2;
  const z = frontZ - portico.stand;
  const signZ = frontZ + 1.2;
  const signPost = sign.lift + sign.height + 0.2;
  return merge([
    ...columnXs().map((x) =>
      metricBox(portico.radius * 2, portico.height, portico.radius * 2, x, 0, z),
    ),
    // The canopy slab over the columns, and the step up to them.
    metricBox(
      portico.width + 1.6,
      0.4,
      portico.stand + 0.4,
      CITY.entranceX,
      portico.height,
      frontZ - portico.stand / 2 - 0.2,
    ),
    metricBox(portico.width + 1.2, 0.3, 1.2, CITY.entranceX, 0, z - 0.6),
    // The door.
    metricBox(2.4, 3.1, 0.12, CITY.entranceX, 0, frontZ - 0.06),
    // Rooftop sign frame: two posts and a top bar.
    metricBox(post, signPost, post, -sign.width / 2 + 0.4, hallTop, signZ),
    metricBox(post, signPost, post, sign.width / 2 - 0.4, hallTop, signZ),
    metricBox(sign.width, 0.12, post, 0, hallTop + signPost - 0.12, signZ),
  ]);
}

/** The request board face, 5 cm off the wall over the entrance, facing the road. */
export function boardGeometry(): BufferGeometry {
  const { board } = CITY;
  return new PlaneGeometry(board.width, board.height)
    .rotateY(Math.PI)
    .translate(CITY.entranceX, board.bottom + board.height / 2, frontZ - 0.05);
}

/** The rooftop lettering plane. */
export function signGeometry(): BufferGeometry {
  const { sign } = CITY;
  return new PlaneGeometry(sign.width - 1, sign.height)
    .rotateY(Math.PI)
    .translate(0, hallTop + sign.lift + sign.height / 2, frontZ + 1.2 - 0.14);
}
