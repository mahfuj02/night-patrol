import { BoxGeometry, BufferGeometry, Float32BufferAttribute } from 'three';

/**
 * A box whose uv coordinates are in metres along each face (horizontal, then up), so a wall shader
 * can draw a grid of real-world size on it. The box stands on its base: `y` is the height of the
 * base above the ground, `x`, `z` the centre. Faces are in the order three.js builds them: +x, -x,
 * +y, -y, +z, -z.
 */
export function metricBox(
  width: number,
  height: number,
  depth: number,
  x: number,
  y: number,
  z: number,
): BufferGeometry {
  const geometry = new BoxGeometry(width, height, depth).translate(x, y + height / 2, z);
  // Horizontal and vertical size of each face, in the order above.
  const faces: [number, number][] = [
    [depth, height],
    [depth, height],
    [width, depth],
    [width, depth],
    [width, height],
    [width, height],
  ];
  const uv = geometry.getAttribute('uv');
  const out: number[] = [];
  for (let face = 0; face < 6; face++) {
    const [w, h] = faces[face]!;
    for (let v = 0; v < 4; v++) {
      const i = face * 4 + v;
      out.push(uv.getX(i) * w, uv.getY(i) * h);
    }
  }
  geometry.setAttribute('uv', new Float32BufferAttribute(out, 2));
  // Non-indexed, so it merges with geometry that has no index.
  return geometry.toNonIndexed();
}
