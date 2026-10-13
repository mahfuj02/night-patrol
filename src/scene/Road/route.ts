import { CatmullRomCurve3, Vector3 } from 'three';
import { route as routeContent } from '@/content/route';
import type { Route } from '@/content/schema';
import { driveOffset } from '@/lib/lanes';
import { interpolateWidth } from '@/lib/route';

const DEFAULT_WIDTH = 8;
const laneTangent = new Vector3();
/** Arc-length samples per curve segment; keeps control point fractions accurate. */
const DIVISIONS_PER_SEGMENT = 200;

export interface RouteModel {
  curve: CatmullRomCurve3;
  length: number;
  /** Arc-length fraction (0..1) of every control point. */
  fractions: number[];
  /** Road width at every control point. */
  widths: number[];
  /** Arc-length fraction of each pinned stop, by stop id. */
  stopFractions: Map<string, number>;
  /** Road width at arc-length fraction `u`. */
  widthAt: (u: number) => number;
  /** Stretches of road (as arc-length fractions) where side streets cross. */
  intersections: { id: string; from: number; to: number }[];
  /** Where the car drives: the centre of the right-hand lane at `u`, written into `out`. */
  lanePointAt: (u: number, out?: Vector3) => Vector3;
  /** True if `u` falls inside an intersection, widened by `margin` metres either side. */
  inIntersection: (u: number, margin?: number) => boolean;
}

export function createRouteModel(route: Route): RouteModel {
  const points = route.points.map((p) => new Vector3(p.x, 0, p.z));
  const curve = new CatmullRomCurve3(points, false, 'centripetal');
  const segments = points.length - 1;
  curve.arcLengthDivisions = segments * DIVISIONS_PER_SEGMENT;
  curve.updateArcLengths();

  const lengths = curve.getLengths(segments * DIVISIONS_PER_SEGMENT);
  const length = lengths[lengths.length - 1] ?? 0;
  const fractions = points.map((_, i) => (lengths[i * DIVISIONS_PER_SEGMENT] ?? 0) / length);
  const widths = route.points.map((p) => p.width ?? DEFAULT_WIDTH);

  const stopFractions = new Map<string, number>();
  route.points.forEach((p, i) => {
    if (p.stopId) stopFractions.set(p.stopId, fractions[i]!);
  });

  const intersections = (route.intersections ?? []).flatMap((crossing) => {
    const anchor = stopFractions.get(crossing.stopId);
    if (anchor === undefined) return [];
    const centre = anchor + (crossing.offset ?? 0) / length;
    const half = crossing.halfLength / length;
    return [{ id: crossing.id, from: centre - half, to: centre + half }];
  });

  return {
    curve,
    length,
    fractions,
    widths,
    stopFractions,
    widthAt: (u) => interpolateWidth(fractions, widths, u),
    intersections,
    lanePointAt: (u, out = new Vector3()) => {
      curve.getPointAt(u, out);
      curve.getTangentAt(u, laneTangent);
      // To the right of the direction of travel: (-tangent.z, 0, tangent.x).
      const offset = driveOffset(interpolateWidth(fractions, widths, u));
      return out.set(out.x - laneTangent.z * offset, out.y, out.z + laneTangent.x * offset);
    },
    inIntersection: (u, margin = 0) =>
      intersections.some(
        ({ from, to }) => u >= from - margin / length && u <= to + margin / length,
      ),
  };
}

export const routeModel: RouteModel = createRouteModel(routeContent);
