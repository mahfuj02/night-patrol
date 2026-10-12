import type { AtmosphereZone, LampType, Stop } from '@/content/schema';
import { clamp01 } from './route';
import { world } from './palette';

export type RGB = [number, number, number];

/** Blended lighting and weather at one point on the route. Colours are sRGB, 0..1 per channel. */
export interface Atmosphere {
  zoneId: string;
  lampType: LampType;
  skyZenith: RGB;
  skyHorizon: RGB;
  fogColor: RGB;
  fogNear: number;
  fogFar: number;
  lightColor: RGB;
  lightIntensity: number;
  ambientColor: RGB;
  ambientIntensity: number;
  snowDensity: number;
  snowWind: number;
  snowGust: number;
  moon: number;
  sunrise: number;
  windowsWarm: number;
  windowsCool: number;
}

export interface ResolvedZone {
  id: string;
  /** First and last `t` of the plateau, where the zone's values hold exactly. */
  start: number;
  end: number;
  blend: number;
  values: Atmosphere;
}

export function hexToRgb(hex: string): RGB {
  const n = Number.parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const rgb = (token: keyof typeof world): RGB => hexToRgb(world[token]);

export function createAtmosphere(): Atmosphere {
  return {
    zoneId: '',
    lampType: 'sodium',
    skyZenith: [0, 0, 0],
    skyHorizon: [0, 0, 0],
    fogColor: [0, 0, 0],
    fogNear: 0,
    fogFar: 1,
    lightColor: [0, 0, 0],
    lightIntensity: 0,
    ambientColor: [0, 0, 0],
    ambientIntensity: 0,
    snowDensity: 0,
    snowWind: 0,
    snowGust: 0,
    moon: 0,
    sunrise: 0,
    windowsWarm: 0,
    windowsCool: 0,
  };
}

function stopT(stops: readonly Stop[], id: string): number {
  const stop = stops.find((s) => s.id === id);
  if (!stop) throw new Error(`Atmosphere zone refers to unknown stop "${id}"`);
  return stop.t;
}

/** Turns zone data (stop ids and offsets) into `t` ranges and ready-to-blend values. */
export function resolveZones(
  zones: readonly AtmosphereZone[],
  stops: readonly Stop[],
): ResolvedZone[] {
  return zones.map((zone) => ({
    id: zone.id,
    start: clamp01(stopT(stops, zone.from) + (zone.startOffset ?? 0)),
    end: clamp01(stopT(stops, zone.to) + (zone.endOffset ?? 0)),
    blend: zone.blend,
    values: {
      zoneId: zone.id,
      lampType: zone.light.type,
      skyZenith: rgb(zone.sky.zenith),
      skyHorizon: rgb(zone.sky.horizon),
      fogColor: rgb(zone.fog.color),
      fogNear: zone.fog.near,
      fogFar: zone.fog.far,
      lightColor: rgb(zone.light.color),
      lightIntensity: zone.light.intensity,
      ambientColor: rgb(zone.ambient.color),
      ambientIntensity: zone.ambient.intensity,
      snowDensity: zone.snow.density,
      snowWind: zone.snow.wind,
      snowGust: zone.snow.gust,
      moon: zone.moon,
      sunrise: zone.sunrise,
      windowsWarm: zone.windows.warm,
      windowsCool: zone.windows.cool,
    },
  }));
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerpRgb = (a: RGB, b: RGB, k: number, out: RGB) => {
  out[0] = lerp(a[0], b[0], k);
  out[1] = lerp(a[1], b[1], k);
  out[2] = lerp(a[2], b[2], k);
};
const smoothstep = (x: number) => {
  const k = clamp01(x);
  return k * k * (3 - 2 * k);
};

/** Writes the blend of `a` and `b` into `out`. The dominant zone's id and lamp type win at k >= 0.5. */
export function blendAtmosphere(a: Atmosphere, b: Atmosphere, k: number, out: Atmosphere) {
  const dominant = k >= 0.5 ? b : a;
  out.zoneId = dominant.zoneId;
  out.lampType = dominant.lampType;
  lerpRgb(a.skyZenith, b.skyZenith, k, out.skyZenith);
  lerpRgb(a.skyHorizon, b.skyHorizon, k, out.skyHorizon);
  lerpRgb(a.fogColor, b.fogColor, k, out.fogColor);
  lerpRgb(a.lightColor, b.lightColor, k, out.lightColor);
  lerpRgb(a.ambientColor, b.ambientColor, k, out.ambientColor);
  out.fogNear = lerp(a.fogNear, b.fogNear, k);
  out.fogFar = lerp(a.fogFar, b.fogFar, k);
  out.lightIntensity = lerp(a.lightIntensity, b.lightIntensity, k);
  out.ambientIntensity = lerp(a.ambientIntensity, b.ambientIntensity, k);
  out.snowDensity = lerp(a.snowDensity, b.snowDensity, k);
  out.snowWind = lerp(a.snowWind, b.snowWind, k);
  out.snowGust = lerp(a.snowGust, b.snowGust, k);
  out.moon = lerp(a.moon, b.moon, k);
  out.sunrise = lerp(a.sunrise, b.sunrise, k);
  out.windowsWarm = lerp(a.windowsWarm, b.windowsWarm, k);
  out.windowsCool = lerp(a.windowsCool, b.windowsCool, k);
  return out;
}

/**
 * Atmosphere at route progress `t`. Inside a zone's plateau the zone's values hold exactly. Each
 * zone eases in from the previous one over its `blend` length (smoothstep), ending at its start.
 * Zones must be ordered by start; before the first zone and after the last, the nearest holds.
 */
export function sampleAtmosphere(
  zones: readonly ResolvedZone[],
  t: number,
  out: Atmosphere = createAtmosphere(),
): Atmosphere {
  const first = zones[0];
  if (!first) throw new Error('At least one atmosphere zone is required');
  let index = 0;
  zones.forEach((zone, i) => {
    if (t >= zone.start) index = i;
  });
  const current = zones[index]!;
  const next = zones[index + 1];
  if (!next) return blendAtmosphere(current.values, current.values, 0, out);

  const windowStart = Math.max(current.end, next.start - next.blend);
  if (t <= windowStart) return blendAtmosphere(current.values, current.values, 0, out);
  const span = next.start - windowStart;
  const k = span <= 0 ? 1 : smoothstep((t - windowStart) / span);
  return blendAtmosphere(current.values, next.values, k, out);
}

/** Human-readable problems with zone data; an empty list means the zones are usable. */
export function findZoneProblems(
  zones: readonly AtmosphereZone[],
  stops: readonly Stop[],
): string[] {
  const problems: string[] = [];
  const stopTs = new Map(stops.map((s) => [s.id, s.t]));
  const seen = new Set<string>();
  const resolved: { id: string; start: number; end: number; blend: number }[] = [];

  for (const zone of zones) {
    if (seen.has(zone.id)) problems.push(`Duplicate atmosphere zone id: ${zone.id}`);
    seen.add(zone.id);
    for (const ref of [zone.from, zone.to]) {
      if (!stopTs.has(ref)) problems.push(`Zone ${zone.id}: unknown stop ${ref}`);
    }
    const from = stopTs.get(zone.from);
    const to = stopTs.get(zone.to);
    if (from === undefined || to === undefined) continue;
    const start = from + (zone.startOffset ?? 0);
    const end = to + (zone.endOffset ?? 0);
    if (start < 0 || end > 1)
      problems.push(`Zone ${zone.id}: range falls outside the route (0..1)`);
    if (end < start) problems.push(`Zone ${zone.id}: ends before it starts`);
    if (zone.fog.far <= zone.fog.near) problems.push(`Zone ${zone.id}: fog far must exceed near`);
    resolved.push({ id: zone.id, start, end, blend: zone.blend });
  }

  resolved.forEach((zone, i) => {
    const previous = resolved[i - 1];
    if (!previous) return;
    if (zone.start <= previous.start) {
      problems.push(`Zone ${zone.id} must start after ${previous.id}`);
    } else if (zone.start - zone.blend < previous.end - 1e-9) {
      problems.push(`Zone ${zone.id}: blend reaches back into ${previous.id}`);
    }
  });
  return problems;
}
