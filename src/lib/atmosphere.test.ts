import { describe, expect, it } from 'vitest';
import type { AtmosphereZone, Stop } from '@/content/schema';
import {
  createAtmosphere,
  findZoneProblems,
  hexToRgb,
  resolveZones,
  sampleAtmosphere,
} from './atmosphere';

const stops: Stop[] = [
  { id: 'a', order: 0, t: 0, title: 'A', landmark: 'ignition', kind: 'intro' },
  { id: 'b', order: 1, t: 0.4, title: 'B', landmark: 'dispatch-street', kind: 'intro' },
  { id: 'c', order: 2, t: 0.7, title: 'C', landmark: 'rrc-campus', kind: 'intro' },
  { id: 'd', order: 3, t: 1, title: 'D', landmark: 'the-forks', kind: 'contact' },
];

const zone = (over: Partial<AtmosphereZone> & { id: string }): AtmosphereZone => ({
  from: 'a',
  to: 'b',
  blend: 0.1,
  sky: { zenith: 'night', horizon: 'skyOvercastOrange' },
  fog: { color: 'skyOvercastOrange', near: 10, far: 100 },
  light: { type: 'sodium', color: 'sodium', intensity: 1 },
  ambient: { color: 'skyOvercastGrey', intensity: 0.5 },
  snow: { density: 1, wind: 0.2, gust: 0.2 },
  moon: 0,
  sunrise: 0,
  windows: { warm: 1, cool: 0 },
  ...over,
});

const zones: AtmosphereZone[] = [
  zone({ id: 'first', from: 'a', to: 'b' }),
  zone({
    id: 'second',
    from: 'c',
    to: 'c',
    blend: 0.2,
    light: { type: 'led', color: 'ledCore', intensity: 0.5 },
    snow: { density: 0, wind: 0.8, gust: 0.6 },
    fog: { color: 'skyClearHorizon', near: 30, far: 300 },
    moon: 1,
  }),
];

describe('hexToRgb', () => {
  it('converts a hex string to 0..1 channels', () => {
    expect(hexToRgb('#FF0000')).toEqual([1, 0, 0]);
    expect(hexToRgb('#00FF80')[2]).toBeCloseTo(128 / 255, 6);
  });
});

describe('resolveZones', () => {
  it('turns stop ids and offsets into t ranges, clamped to the route', () => {
    const resolved = resolveZones(
      [zone({ id: 'x', from: 'b', to: 'c', startOffset: -0.05, endOffset: 0.5 })],
      stops,
    );
    expect(resolved[0]!.start).toBeCloseTo(0.35, 10);
    expect(resolved[0]!.end).toBe(1);
  });

  it('rejects an unknown stop', () => {
    expect(() => resolveZones([zone({ id: 'x', from: 'nope' })], stops)).toThrow(/unknown stop/);
  });
});

describe('sampleAtmosphere', () => {
  const resolved = resolveZones(zones, stops);
  const sample = (t: number) => sampleAtmosphere(resolved, t);

  it('holds a zone exactly inside its plateau', () => {
    for (const t of [0, 0.2, 0.4, 0.7]) {
      const s = sample(t);
      expect(s.zoneId).toBe(t < 0.5 ? 'first' : 'second');
    }
    expect(sample(0.2).snowDensity).toBe(1);
    expect(sample(0.7).snowDensity).toBe(0);
  });

  it('holds the first zone before it and the last zone after it', () => {
    expect(sample(-1).zoneId).toBe('first');
    expect(sample(5).zoneId).toBe('second');
  });

  it('stays on the previous zone until the blend window opens', () => {
    // second starts at 0.7 and blends over 0.2, so the window is 0.5 to 0.7
    expect(sample(0.5).snowDensity).toBe(1);
    expect(sample(0.49).snowDensity).toBe(1);
  });

  it('eases between zones: halfway through the window is the average', () => {
    const s = sample(0.6);
    expect(s.snowDensity).toBeCloseTo(0.5, 6);
    expect(s.snowWind).toBeCloseTo(0.5, 6);
    expect(s.moon).toBeCloseTo(0.5, 6);
    expect(s.fogNear).toBeCloseTo(20, 6);
    expect(s.fogFar).toBeCloseTo(200, 6);
    expect(s.lightIntensity).toBeCloseTo(0.75, 6);
  });

  it('blends colours channel by channel', () => {
    const a = sample(0.2).fogColor;
    const b = sample(0.7).fogColor;
    const mid = sample(0.6).fogColor;
    for (let i = 0; i < 3; i++) expect(mid[i]).toBeCloseTo((a[i]! + b[i]!) / 2, 6);
  });

  it('switches the dominant zone and lamp type at the halfway point', () => {
    expect(sample(0.59).lampType).toBe('sodium');
    expect(sample(0.61).lampType).toBe('led');
    expect(sample(0.61).zoneId).toBe('second');
  });

  it('is continuous: no jumps along the whole route', () => {
    let previous = sample(0);
    for (let t = 0.001; t <= 1; t += 0.001) {
      const s = sample(t);
      expect(Math.abs(s.snowDensity - previous.snowDensity)).toBeLessThan(0.02);
      expect(Math.abs(s.moon - previous.moon)).toBeLessThan(0.02);
      expect(Math.abs(s.fogFar - previous.fogFar)).toBeLessThan(5);
      previous = { ...s };
    }
  });

  it('is monotonic across a single blend', () => {
    let previous = sample(0.5).snowDensity;
    for (let t = 0.51; t <= 0.7; t += 0.01) {
      const value = sample(t).snowDensity;
      expect(value).toBeLessThanOrEqual(previous + 1e-12);
      previous = value;
    }
  });

  it('reuses an output object when given one', () => {
    const out = createAtmosphere();
    expect(sampleAtmosphere(resolved, 0.2, out)).toBe(out);
  });

  it('handles a zero-length blend and a single zone', () => {
    const hard = resolveZones([zones[0]!, { ...zones[1]!, blend: 0 }], stops);
    expect(sampleAtmosphere(hard, 0.69).zoneId).toBe('first');
    expect(sampleAtmosphere(hard, 0.7).zoneId).toBe('second');
    const single = resolveZones([zones[0]!], stops);
    expect(sampleAtmosphere(single, 0.9).zoneId).toBe('first');
  });

  it('throws without zones', () => {
    expect(() => sampleAtmosphere([], 0.5)).toThrow(/At least one/);
  });
});

describe('findZoneProblems', () => {
  it('accepts valid zones', () => {
    expect(findZoneProblems(zones, stops)).toEqual([]);
  });

  it('reports duplicates, unknown stops, backwards ranges and bad fog', () => {
    const problems = findZoneProblems(
      [
        zone({ id: 'x', from: 'b', to: 'a' }),
        zone({ id: 'x', from: 'nope', to: 'b' }),
        zone({ id: 'y', from: 'c', to: 'c', fog: { color: 'night', near: 50, far: 10 } }),
      ],
      stops,
    ).join('\n');
    expect(problems).toContain('Duplicate atmosphere zone id');
    expect(problems).toContain('unknown stop nope');
    expect(problems).toContain('ends before it starts');
    expect(problems).toContain('fog far must exceed near');
  });

  it('reports zones outside the route, out of order, or blending into the previous zone', () => {
    const outside = findZoneProblems(
      [zone({ id: 'o', from: 'd', to: 'd', endOffset: 0.2 })],
      stops,
    );
    expect(outside.join('\n')).toContain('outside the route');

    const unordered = findZoneProblems(
      [zone({ id: 'p', from: 'c', to: 'c' }), zone({ id: 'q', from: 'a', to: 'a' })],
      stops,
    );
    expect(unordered.join('\n')).toContain('must start after');

    const overlap = findZoneProblems(
      [zone({ id: 'p', from: 'a', to: 'b' }), zone({ id: 'q', from: 'c', to: 'c', blend: 0.5 })],
      stops,
    );
    expect(overlap.join('\n')).toContain('blend reaches back into p');
  });
});
