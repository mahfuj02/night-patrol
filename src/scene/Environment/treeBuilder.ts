import { BufferGeometry, Color, Float32BufferAttribute, Vector3 } from 'three';
import { world } from '@/lib/palette';
import { createRandom, range } from '@/lib/random';

export type TreeDetail = 'high' | 'low';

export interface TreeStats {
  /** Height of the trunk's first fork, in metres. */
  forkHeight: number;
  limbs: number;
  twigClusters: number;
  woodTriangles: number;
  twigTriangles: number;
}

export interface TreeVariant {
  /** Trunk, limbs and branches as tapered tubes, with bark colour in vertex colours. */
  wood: BufferGeometry;
  /** Crossed planes at the branch tips, for the alpha-mapped twig texture. */
  twigs: BufferGeometry;
  stats: TreeStats;
}

const BARK = new Color(world.bark);
/** Bark reads darker against a bright sky than it is, so the vertex colour is lifted a little. */
const BARK_LIFT = 2.2;
const UP = new Vector3(0, 1, 0);
const deg = (d: number) => (d * Math.PI) / 180;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function rotateY(v: Vector3, angle: number): Vector3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return new Vector3(v.x * c + v.z * s, v.y, -v.x * s + v.z * c);
}

/** Position and direction a fraction `t` of the way along a polyline. */
function pointAt(path: readonly Vector3[], t: number): { point: Vector3; tangent: Vector3 } {
  const scaled = Math.min(Math.max(t, 0), 1) * (path.length - 1);
  const i = Math.min(Math.floor(scaled), path.length - 2);
  const a = path[i]!;
  const b = path[i + 1]!;
  return {
    point: a.clone().lerp(b, scaled - i),
    tangent: b.clone().sub(a).normalize(),
  };
}

/** Accumulates tapered tubes into one mesh. Tube rings share a parallel-transported frame. */
class TubeMesh {
  positions: number[] = [];
  normals: number[] = [];
  colors: number[] = [];
  indices: number[] = [];

  add(path: readonly Vector3[], radii: readonly number[], radial: number, random: () => number) {
    const base = this.positions.length / 3;
    let frameN = new Vector3();
    const tangent = new Vector3();
    for (let i = 0; i < path.length; i++) {
      const prev = path[Math.max(i - 1, 0)]!;
      const next = path[Math.min(i + 1, path.length - 1)]!;
      tangent.copy(next).sub(prev).normalize();
      if (i === 0) {
        const ref = Math.abs(tangent.y) < 0.95 ? UP : new Vector3(1, 0, 0);
        frameN = ref.clone().addScaledVector(tangent, -ref.dot(tangent)).normalize();
      } else {
        frameN.addScaledVector(tangent, -frameN.dot(tangent)).normalize();
      }
      const frameB = new Vector3().crossVectors(tangent, frameN);
      const shade = 0.85 + 0.3 * random();
      const p = path[i]!;
      const r = radii[i]!;
      for (let k = 0; k < radial; k++) {
        const angle = (k / radial) * Math.PI * 2;
        const x = frameN.x * Math.cos(angle) + frameB.x * Math.sin(angle);
        const y = frameN.y * Math.cos(angle) + frameB.y * Math.sin(angle);
        const z = frameN.z * Math.cos(angle) + frameB.z * Math.sin(angle);
        this.positions.push(p.x + x * r, p.y + y * r, p.z + z * r);
        this.normals.push(x, y, z);
        this.colors.push(
          BARK.r * shade * BARK_LIFT,
          BARK.g * shade * BARK_LIFT,
          BARK.b * shade * BARK_LIFT,
        );
      }
    }
    for (let i = 0; i < path.length - 1; i++) {
      for (let k = 0; k < radial; k++) {
        const a = base + i * radial + k;
        const b = base + i * radial + ((k + 1) % radial);
        const c = a + radial;
        const d = b + radial;
        this.indices.push(a, b, c, b, d, c);
      }
    }
  }

  toGeometry(): BufferGeometry {
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(this.positions, 3));
    g.setAttribute('normal', new Float32BufferAttribute(this.normals, 3));
    g.setAttribute('color', new Float32BufferAttribute(this.colors, 3));
    g.setIndex(this.indices);
    g.computeBoundingSphere();
    return g;
  }
}

/** Accumulates textured quads (the twig planes) into one mesh. */
class QuadMesh {
  positions: number[] = [];
  normals: number[] = [];
  uvs: number[] = [];
  indices: number[] = [];

  add(p0: Vector3, p1: Vector3, p2: Vector3, p3: Vector3) {
    const base = this.positions.length / 3;
    const normal = new Vector3().crossVectors(p1.clone().sub(p0), p3.clone().sub(p0)).normalize();
    for (const p of [p0, p1, p2, p3]) {
      this.positions.push(p.x, p.y, p.z);
      this.normals.push(normal.x, normal.y, normal.z);
    }
    // p0, p1 are the base of the sprig (v = 0); p2, p3 its far end (v = 1).
    this.uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
    this.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  toGeometry(): BufferGeometry {
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(this.positions, 3));
    g.setAttribute('normal', new Float32BufferAttribute(this.normals, 3));
    g.setAttribute('uv', new Float32BufferAttribute(this.uvs, 2));
    g.setIndex(this.indices);
    g.computeBoundingSphere();
    return g;
  }
}

interface Tip {
  point: Vector3;
  direction: Vector3;
}

/**
 * One procedural winter elm, facing +Z (its long, road-side limbs point that way): a tapered trunk
 * with a slight base flare that forks low into 3 to 5 main limbs arching up and outward in a vase
 * shape, then one or two levels of smaller branches, with small twig planes at the tips. The
 * limbs facing +Z are longer and flatter, so a row of trees turned toward a road arches over it.
 * Deterministic for a seed. The `low` detail has fewer rings, fewer branch levels and no second
 * level of branches. The caller owns (and disposes) the geometries.
 */
export function buildTreeVariant(seed: number, detail: TreeDetail): TreeVariant {
  const random = createRandom(seed);
  const high = detail === 'high';
  const radialTrunk = high ? 6 : 5;
  const radialLimb = high ? 6 : 4;
  const radialFine = high ? 5 : 4;

  const wood = new TubeMesh();
  const quads = new QuadMesh();
  const tips: Tip[] = [];

  // Trunk: a flared base that rises vertically, then a gentle sway, forking at 2 to 3 m.
  const forkHeight = range(random, 2.2, 3);
  const sway = () => range(random, -0.1, 0.1);
  const trunkPath = [
    new Vector3(0, 0, 0),
    new Vector3(0, 0.5, 0),
    new Vector3(sway(), 1.2, sway()),
    new Vector3(sway(), forkHeight * 0.8, sway()),
    new Vector3(sway() * 0.5, forkHeight, sway() * 0.5),
  ];
  wood.add(trunkPath, [0.55, 0.38, 0.32, 0.29, 0.27], radialTrunk, random);
  const fork = trunkPath[trunkPath.length - 1]!;

  // Main limbs.
  const limbCount = 3 + Math.floor(random() * 3);
  const limbPoints = high ? 6 : 5;
  for (let j = 0; j < limbCount; j++) {
    const azimuth = (j / limbCount) * Math.PI * 2 + range(random, -0.4, 0.4) + 0.3;
    const facing = Math.max(0, Math.cos(azimuth));
    const length = 7.5 * (1 + 0.75 * facing) * range(random, 0.9, 1.1);
    const startElevation = deg(68);
    const endElevation = deg(facing > 0.3 ? 24 : 40);

    const path: Vector3[] = [
      fork.clone().add(new Vector3(Math.sin(azimuth) * 0.15, 0, Math.cos(azimuth) * 0.15)),
    ];
    const step = length / (limbPoints - 1);
    for (let s = 1; s < limbPoints; s++) {
      const t = s / (limbPoints - 1);
      const elevation = lerp(startElevation, endElevation, Math.pow(t, 1.2));
      const direction = new Vector3(
        Math.cos(elevation) * Math.sin(azimuth),
        Math.sin(elevation),
        Math.cos(elevation) * Math.cos(azimuth),
      );
      path.push(path[s - 1]!.clone().addScaledVector(direction, step));
    }
    const limbRadii = path.map((_, s) => lerp(0.24, 0.05, Math.pow(s / (limbPoints - 1), 0.8)));
    wood.add(path, limbRadii, radialLimb, random);
    if (high) tips.push({ point: path[limbPoints - 1]!, direction: pointAt(path, 1).tangent });

    // First-level branches.
    // Trees with more limbs get fewer branches per limb, so every variant stays inside the budget.
    const branchCount = high ? (limbCount === 5 ? 2 : limbCount === 4 ? 3 : 4) : 2;
    for (let b = 0; b < branchCount; b++) {
      const t = lerp(0.3, 0.85, (b + random() * 0.5) / branchCount);
      const { point, tangent } = pointAt(path, t);
      const turn = (b % 2 === 0 ? 1 : -1) * range(random, 0.45, 0.95);
      const direction = rotateY(tangent, turn);
      direction.y += 0.25;
      direction.normalize();

      const branchLength = range(random, 3.2, 4.8) * (1 + 0.3 * facing);
      const branchPoints = high ? 4 : 3;
      const branchPath: Vector3[] = [point];
      for (let s = 1; s < branchPoints; s++) {
        const droop = (s / (branchPoints - 1)) * 0.35;
        const stepDirection = direction
          .clone()
          .add(new Vector3(0, -droop, 0))
          .normalize();
        branchPath.push(
          branchPath[s - 1]!.clone().addScaledVector(
            stepDirection,
            branchLength / (branchPoints - 1),
          ),
        );
      }
      wood.add(
        branchPath,
        branchPath.map((_, s) => lerp(0.07, 0.02, s / (branchPoints - 1))),
        radialFine,
        random,
      );
      const branchEnd = pointAt(branchPath, 1);

      tips.push({ point: branchEnd.point, direction: branchEnd.tangent });
      if (!high) continue;

      // Second-level branches (high detail only).
      for (let c = 0; c < 2; c++) {
        const ct = lerp(0.45, 0.9, (c + random() * 0.5) / 2);
        const at = pointAt(branchPath, ct);
        const sprigDirection = rotateY(at.tangent, (c === 0 ? 1 : -1) * range(random, 0.5, 0.9));
        sprigDirection.y += range(random, -0.1, 0.3);
        sprigDirection.normalize();
        const sprigLength = range(random, 1.4, 2.2);
        const sprigPath = [
          at.point,
          at.point.clone().addScaledVector(sprigDirection, sprigLength * 0.5),
          at.point
            .clone()
            .addScaledVector(sprigDirection, sprigLength)
            .add(new Vector3(0, -0.1, 0)),
        ];
        wood.add(sprigPath, [0.025, 0.016, 0.008], radialFine, random);
        tips.push({ point: sprigPath[2]!, direction: sprigDirection });
      }
    }
  }

  // Twig planes at the tips: two or three crossed planes per cluster.
  for (const tip of tips) {
    const size = range(random, 1.4, 2.1);
    const planes = random() < 0.5 ? 2 : 3;
    const base = tip.point.clone().addScaledVector(tip.direction, -0.15);
    const far = tip.point.clone().addScaledVector(tip.direction, size);
    const ref = Math.abs(tip.direction.y) < 0.95 ? UP : new Vector3(1, 0, 0);
    const perp0 = new Vector3().crossVectors(tip.direction, ref).normalize();
    for (let p = 0; p < planes; p++) {
      const angle = (p / planes) * Math.PI + range(random, -0.2, 0.2);
      const perp = perp0
        .clone()
        .applyAxisAngle(tip.direction, angle)
        .multiplyScalar(size * 0.5);
      quads.add(
        base.clone().sub(perp),
        base.clone().add(perp),
        far.clone().add(perp),
        far.clone().sub(perp),
      );
    }
  }

  const woodGeometry = wood.toGeometry();
  const twigGeometry = quads.toGeometry();
  return {
    wood: woodGeometry,
    twigs: twigGeometry,
    stats: {
      forkHeight,
      limbs: limbCount,
      twigClusters: tips.length,
      woodTriangles: wood.indices.length / 3,
      twigTriangles: quads.indices.length / 3,
    },
  };
}
