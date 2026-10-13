import { BufferGeometry, Float32BufferAttribute, PlaneGeometry } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { world } from '@/lib/palette';
import { createGableGeometry } from '../Buildings/buildingGeometry';
import { metricBox } from './metricBox';

/**
 * The RRC Polytechnic Exchange District campus as a stylized blockout (docs/art-reference.md), in
 * local metres: the origin is the centre of the campus footprint on the ground, +z points away from
 * the road (the front faces -z), and +x runs along the wall to the viewer's left (back along the
 * road), -x to their right (ahead).
 */
export const RRC = {
  /** Campus block: width along the wall and depth. */
  width: 18,
  depth: 14,
  /** Storey height. The ground floor and four glass floors are all one storey high. */
  floor: 3.8,
  floors: 5,
  /** The ground floor is set back from the upper floors by this much. */
  recess: 2,
  /** The lower step on the viewer's left. */
  step: { width: 8, floors: 3 },
  /** The cream limestone neighbour, then the red-brick one, further along the wall. */
  limestone: { width: 12, floors: 3, storey: 3.6, depth: 12 },
  brick: { width: 14, floors: 3, storey: 3.6, depth: 12 },
  /** The printed-heritage glass panel on the viewer's right of the front face. */
  panel: { width: 6, height: 9.5, x: -4.2, bottom: 6.8, stand: 0.12 },
  /** The rooftop sign: letters on a thin frame above the roof. */
  sign: { width: 12.5, height: 2.1, lift: 0.9 },
} as const;

/** Height of the campus roof. */
export const campusTop = RRC.floor * RRC.floors;

const frontZ = -RRC.depth / 2;

function merge(parts: BufferGeometry[]): BufferGeometry {
  const merged = mergeGeometries(parts);
  parts.forEach((part) => part.dispose());
  if (!merged) throw new Error('Nothing to merge');
  return merged;
}

/** The glass curtain wall: the recessed ground floor, the four glass floors and the lower step. */
export function campusGlassGeometry(): BufferGeometry {
  const { width, depth, floor, floors, recess, step } = RRC;
  return merge([
    // Ground floor, set back from the front.
    metricBox(width, floor, depth - recess, 0, 0, recess / 2),
    // The four upper floors overhang the recessed ground floor.
    metricBox(width, floor * (floors - 1), depth, 0, floor, 0),
    // The lower step beside it, on the viewer's left.
    metricBox(
      step.width,
      floor * step.floors,
      depth - recess,
      width / 2 + step.width / 2,
      0,
      recess / 2,
    ),
  ]);
}

/** The dark steel frame of the rooftop sign: two posts and a top bar. */
export function signFrameGeometry(): BufferGeometry {
  const { sign } = RRC;
  const post = 0.22;
  const postHeight = sign.lift + sign.height + 0.2;
  const z = frontZ + 1.2;
  return merge([
    metricBox(post, postHeight, post, -sign.width / 2 + 0.4, campusTop, z),
    metricBox(post, postHeight, post, sign.width / 2 - 0.4, campusTop, z),
    metricBox(sign.width, 0.12, post, 0, campusTop + postHeight - 0.12, z),
  ]);
}

/** The flat panels that carry textures, facing the road (-z). */
function facingRoad(plane: PlaneGeometry): PlaneGeometry {
  return plane.rotateY(Math.PI);
}

/** The printed-heritage glass panel, a little proud of the curtain wall. */
export function heritagePanelGeometry(): BufferGeometry {
  const { panel } = RRC;
  return facingRoad(new PlaneGeometry(panel.width, panel.height)).translate(
    panel.x,
    panel.bottom + panel.height / 2,
    frontZ - panel.stand,
  );
}

/** The rooftop lettering plane. */
export function signPlaneGeometry(): BufferGeometry {
  const { sign } = RRC;
  return facingRoad(new PlaneGeometry(sign.width - 1, sign.height)).translate(
    0,
    campusTop + sign.lift + sign.height / 2,
    frontZ + 1.2 - 0.14,
  );
}

/**
 * The cream limestone neighbour: its body, a cornice and a small gabled canopy over the door,
 * behind the step along the wall (+x).
 */
export function limestoneGeometry(): BufferGeometry {
  const { limestone, step, width } = RRC;
  const x = width / 2 + step.width + limestone.width / 2;
  const top = limestone.floors * limestone.storey;
  const frontEdge = -limestone.depth / 2;
  // A small gabled canopy over the door: a roof prism with its ridge running out from the wall.
  const canopy = createGableGeometry()
    .rotateY(Math.PI / 2)
    .scale(3.6, 1, 1.6)
    .translate(x - 1.5, 3, frontEdge - 0.8);
  canopy.setAttribute(
    'uv',
    new Float32BufferAttribute(new Float32Array(canopy.getAttribute('position').count * 2), 2),
  );
  return merge([
    metricBox(limestone.width, top, limestone.depth, x, 0, 0),
    metricBox(limestone.width + 0.7, 0.45, limestone.depth + 0.7, x, top, 0),
    canopy,
  ]);
}

/** The red-brick neighbour with a faded, painted sign patch on its wall. */
export function brickGeometry(): BufferGeometry {
  const { brick, limestone, step, width } = RRC;
  const x = width / 2 + step.width + limestone.width + brick.width / 2;
  const top = brick.floors * brick.storey;
  const body = metricBox(brick.width, top, brick.depth, x, 0, 0);
  const patch = metricBox(5.5, 2.4, 0.08, x - 1.5, top - 4.6, -brick.depth / 2 - 0.04);
  // Vertex colours: the wall is dark brick; the sign patch is a faded wash over it.
  const colour = (geometry: BufferGeometry, hex: string) => {
    const count = geometry.getAttribute('position').count;
    const c = new Float32Array(count * 3);
    const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
    const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
    const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
    for (let i = 0; i < count; i++) c.set([r, g, b], i * 3);
    geometry.setAttribute('color', new Float32BufferAttribute(c, 3));
  };
  colour(body, '#ffffff');
  colour(patch, world.brickFaded);
  return merge([body, patch]);
}
