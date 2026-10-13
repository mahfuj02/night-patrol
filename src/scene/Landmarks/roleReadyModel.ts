import { BufferGeometry, PlaneGeometry } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { metricBox } from './metricBox';

/**
 * The RoleReady tower at Portage & Main as a stylized blockout, in local metres: the origin is the
 * centre of the podium footprint on the ground, +z points away from the road (the front faces -z),
 * and +x runs along the wall to the viewer's left (back along the road), -x to their right (ahead).
 * A ten-storey glass office tower on a two-storey limestone podium, with a lit sign board on its
 * front.
 */
export const ROLE_TOWER = {
  /** The podium: width along the wall, depth, storey height and floors. */
  podium: { width: 24, depth: 14, storey: 4, floors: 2 },
  /** The tower: width, storey height and floors. It stands back from the podium front. */
  tower: { width: 14, storey: 3.8, floors: 10, setBack: 2 },
  /** The sign board on the tower front. */
  board: { width: 16, height: 5.8, bottom: 12, stand: 0.7 },
} as const;

const { podium, tower, board } = ROLE_TOWER;
/** Height of the tower roof, and of the podium roof. */
export const towerTop = tower.storey * tower.floors;
export const podiumTop = podium.storey * podium.floors;
/** The podium front face, and the tower front face (set back from it). */
export const podiumFrontZ = -podium.depth / 2;
export const towerFrontZ = podiumFrontZ + tower.setBack;

function merge(parts: BufferGeometry[]): BufferGeometry {
  const merged = mergeGeometries(parts);
  parts.forEach((part) => part.dispose());
  if (!merged) throw new Error('Nothing to merge');
  return merged;
}

/** The glass tower and its crown. */
export function towerGeometry(): BufferGeometry {
  const depth = podium.depth / 2 - towerFrontZ;
  const z = towerFrontZ + depth / 2;
  return merge([
    metricBox(tower.width, towerTop - podiumTop, depth, 0, podiumTop, z),
    // A slim crown on the roof.
    metricBox(tower.width - 4, 2.4, depth - 4, 0, towerTop, z),
  ]);
}

/** The limestone podium with a cornice. */
export function podiumGeometry(): BufferGeometry {
  return merge([
    metricBox(podium.width, podiumTop, podium.depth, 0, 0, 0),
    metricBox(podium.width + 0.6, 0.4, podium.depth + 0.6, 0, podiumTop, 0),
  ]);
}

/** The dark frame behind the sign board, and the rods holding it out from the tower. */
export function boardFrameGeometry(): BufferGeometry {
  const rod = 0.14;
  const z = towerFrontZ - board.stand / 2;
  return merge([
    metricBox(
      board.width + 0.5,
      board.height + 0.5,
      0.3,
      0,
      board.bottom - 0.25,
      towerFrontZ - board.stand - 0.15,
    ),
    metricBox(rod, rod, board.stand, -board.width / 2 + 0.6, board.bottom + 0.4, z),
    metricBox(rod, rod, board.stand, board.width / 2 - 0.6, board.bottom + 0.4, z),
    metricBox(rod, rod, board.stand, -board.width / 2 + 0.6, board.bottom + board.height - 0.4, z),
    metricBox(rod, rod, board.stand, board.width / 2 - 0.6, board.bottom + board.height - 0.4, z),
  ]);
}

/** The sign board face, a little in front of its frame and facing the road. */
export function boardFaceGeometry(): BufferGeometry {
  return new PlaneGeometry(board.width, board.height)
    .rotateY(Math.PI)
    .translate(0, board.bottom + board.height / 2, towerFrontZ - board.stand - 0.32);
}
