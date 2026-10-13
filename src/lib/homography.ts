/**
 * Maps a rectangle of DOM pixels onto a quadrilateral on the screen (a projected wall), as a CSS
 * `matrix3d`. This is how wall content is placed in 3D without a library: the camera is still while
 * the car is parked, so the transform is computed once when it settles.
 */

export type Quad = [number, number, number, number, number, number, number, number];

/** Solves an 8x8 linear system by Gaussian elimination with partial pivoting. */
function solve(matrix: number[][], vector: number[]): number[] | null {
  const n = vector.length;
  const a = matrix.map((row, i) => [...row, vector[i]!]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(a[row]![col]!) > Math.abs(a[pivot]![col]!)) pivot = row;
    }
    if (Math.abs(a[pivot]![col]!) < 1e-12) return null;
    [a[col], a[pivot]] = [a[pivot]!, a[col]!];
    for (let row = col + 1; row < n; row++) {
      const factor = a[row]![col]! / a[col]![col]!;
      for (let k = col; k <= n; k++) a[row]![k]! -= factor * a[col]![k]!;
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let row = n - 1; row >= 0; row--) {
    let sum = a[row]![n]!;
    for (let k = row + 1; k < n; k++) sum -= a[row]![k]! * x[k]!;
    x[row] = sum / a[row]![row]!;
  }
  return x;
}

/**
 * The 3x3 homography (row-major, with the last element 1) that takes the corners of a
 * `width` by `height` rectangle, in order top-left, top-right, bottom-right, bottom-left, to the
 * four screen points in `quad` (x1, y1, ... x4, y4). Null if the corners are degenerate.
 */
export function homography(width: number, height: number, quad: Quad): number[] | null {
  const src: [number, number][] = [
    [0, 0],
    [width, 0],
    [width, height],
    [0, height],
  ];
  const rows: number[][] = [];
  const rhs: number[] = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i]!;
    const u = quad[i * 2]!;
    const v = quad[i * 2 + 1]!;
    rows.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    rhs.push(u);
    rows.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    rhs.push(v);
  }
  const h = solve(rows, rhs);
  return h ? [...h, 1] : null;
}

/**
 * The CSS `matrix3d(...)` value for a homography, so that an element with `transform-origin: 0 0`
 * lands on the quad. Returns null if there is no valid transform.
 */
export function matrix3dFor(width: number, height: number, quad: Quad): string | null {
  const h = homography(width, height, quad);
  if (!h) return null;
  const [a, b, c, d, e, f, g, i] = h as [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  // CSS matrix3d is column-major: the homography fills the x, y and w rows, with z left alone.
  const values = [a, d, 0, g, b, e, 0, i, 0, 0, 1, 0, c, f, 0, 1];
  return `matrix3d(${values.map((v) => (Number.isFinite(v) ? v : 0)).join(',')})`;
}

/** The on-screen width of the quad's top edge, in pixels, as a measure of how big the wall looks. */
export function quadWidth(quad: Quad): number {
  return Math.hypot(quad[2] - quad[0], quad[3] - quad[1]);
}
