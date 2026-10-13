import { CatmullRomCurve3, Vector3 } from 'three';
import { route as routeContent } from '@/content/route';
import type { Route } from '@/content/schema';
import { interpolateWidth } from '@/lib/route';

const DEFAULT_WIDTH = 8;
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
  intersections: { from: number; to: number }[];
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
    const centre = stopFractions.get(crossing.stopId);
    if (centre === undefined) return [];
    const half = crossing.halfLength / length;
    return [{ from: centre - half, to: centre + half }];
  });

  return {
    curve,
    length,
    fractions,
    widths,
    stopFractions,
    widthAt: (u) => interpolateWidth(fractions, widths, u),
    intersections,
    inIntersection: (u, margin = 0) =>
      intersections.some(
        ({ from, to }) => u >= from - margin / length && u <= to + margin / length,
      ),
  };
}

export const routeModel: RouteModel = createRouteModel(routeContent);
