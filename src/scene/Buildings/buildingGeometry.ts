import {
  BoxGeometry,
  BufferGeometry,
  Float32BufferAttribute,
  InstancedBufferAttribute,
} from 'three';
import type { BodyPart } from './buildingParts';

/** A 1 m box standing on the ground (base at y = 0), scaled per instance. */
export function createBoxGeometry(): BufferGeometry {
  return new BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
}

/**
 * A 1 m gabled roof: ridge along x at y = 1, eaves along x at z = -0.5 and 0.5 on the ground, and
 * a triangle at each end. Scaled per instance to the roof length, span and height.
 */
export function createGableGeometry(): BufferGeometry {
  const a = [-0.5, 0, -0.5];
  const b = [0.5, 0, -0.5];
  const c = [0.5, 0, 0.5];
  const d = [-0.5, 0, 0.5];
  const ridgeA = [-0.5, 1, 0];
  const ridgeB = [0.5, 1, 0];
  // Slope normals in unit space; three corrects them for the instance scale.
  const nBack = [0, 0.5, -1];
  const nFront = [0, 0.5, 1];
  const triangles: [number[][], number[]][] = [
    [[a, b, ridgeB], nBack],
    [[a, ridgeB, ridgeA], nBack],
    [[d, ridgeA, ridgeB], nFront],
    [[d, ridgeB, c], nFront],
    [
      [b, c, ridgeB],
      [1, 0, 0],
    ],
    [
      [a, ridgeA, d],
      [-1, 0, 0],
    ],
  ];
  const positions: number[] = [];
  const normals: number[] = [];
  for (const [corners, normal] of triangles) {
    const length = Math.hypot(...normal);
    // Counter-clockwise seen from outside, so the faces are not culled.
    for (const corner of [corners[0]!, corners[2]!, corners[1]!]) {
      positions.push(...corner);
      normals.push(...normal.map((n) => n / length));
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  return geometry;
}

/**
 * A box geometry with the per-instance attributes the wall shader reads: size (aSize), the share
 * of warm and cool windows plus a seed and the texture weight (aLit), and the window grid (aGrid).
 */
export function createBodyGeometry(parts: readonly BodyPart[]): BufferGeometry {
  const geometry = createBoxGeometry();
  const size = new Float32Array(parts.length * 3);
  const lit = new Float32Array(parts.length * 4);
  const grid = new Float32Array(parts.length * 4);
  parts.forEach((part, i) => {
    size.set([part.width, part.height, part.depth], i * 3);
    lit.set([part.warm, part.cool, part.seed, part.grid.texture], i * 4);
    grid.set([part.grid.bay, part.grid.floor, part.grid.fillX, part.grid.fillY], i * 4);
  });
  geometry.setAttribute('aSize', new InstancedBufferAttribute(size, 3));
  geometry.setAttribute('aLit', new InstancedBufferAttribute(lit, 4));
  geometry.setAttribute('aGrid', new InstancedBufferAttribute(grid, 4));
  return geometry;
}
