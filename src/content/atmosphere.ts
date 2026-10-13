import type { AtmosphereZone } from './schema';

/**
 * Lighting and weather by route zone. Each zone holds its values from its `from` stop to its `to`
 * stop (plus optional `t` offsets). The previous zone eases into it over `blend` (in `t`), ending
 * where the zone starts. Colours are names from the world palette in src/lib/palette.ts.
 * Zones must stay in route order; `pnpm test` checks that and that blends fit the gaps.
 *
 * t values (from stops.ts): city-services 0.189, portage-main 0.439, inspection 0.613,
 * warming-shelter 0.66, cmhr-esplanade 0.768, the-forks 1.0.
 * TODO(content): owner to tune the look of each zone by eye.
 */
export const atmosphereZones: AtmosphereZone[] = [
  {
    // Exchange District: sodium lamps, heavy snow, orange-tinged overcast.
    id: 'exchange',
    from: 'ignition',
    to: 'city-services',
    blend: 0,
    sky: { zenith: 'night', horizon: 'skyOvercastOrange' },
    fog: { color: 'skyOvercastOrange', near: 14, far: 130 },
    light: { type: 'sodium', color: 'sodium', intensity: 1 },
    ambient: { color: 'skyOvercastOrange', intensity: 0.55 },
    snow: { density: 1, wind: 0.35, gust: 0.3 },
    trees: 0.3,
    moon: 0,
    sunrise: 0,
    windows: { warm: 0.8, cool: 0.15 },
  },
  {
    // Downtown and Portage & Main: sodium mixed with cool office windows, snow with strong gusts.
    // Eases in over the second half of the long straight.
    id: 'downtown',
    from: 'portage-main',
    to: 'inspection-building',
    blend: 0.15,
    sky: { zenith: 'night', horizon: 'skyOvercastOrange' },
    fog: { color: 'skyOvercastOrange', near: 24, far: 190 },
    light: { type: 'sodium', color: 'sodium', intensity: 1 },
    ambient: { color: 'skyOvercastGrey', intensity: 0.5 },
    snow: { density: 0.65, wind: 0.9, gust: 0.9 },
    trees: 0.05,
    moon: 0,
    sunrise: 0,
    windows: { warm: 0.5, cool: 0.6 },
  },
  {
    // Warming shelter: cool, dimmer, light quiet snow. Warm windows only (no figures, no drama).
    id: 'shelter',
    from: 'warming-shelter',
    to: 'warming-shelter',
    startOffset: -0.015,
    endOffset: 0.015,
    blend: 0.03,
    sky: { zenith: 'night', horizon: 'skyOvercastGreen' },
    fog: { color: 'skyOvercastGreen', near: 12, far: 90 },
    light: { type: 'led', color: 'ledCore', intensity: 0.55 },
    ambient: { color: 'skyOvercastGreen', intensity: 0.35 },
    snow: { density: 0.25, wind: 0.1, gust: 0 },
    trees: 0.5,
    moon: 0,
    sunrise: 0,
    windows: { warm: 1, cool: 0 },
  },
  {
    // Avenue toward the Human Rights Museum and Esplanade Riel: cool LED, clear night,
    // snow stops, big moon.
    id: 'avenue',
    from: 'cmhr-esplanade',
    to: 'cmhr-esplanade',
    startOffset: -0.03,
    endOffset: 0.03,
    blend: 0.06,
    sky: { zenith: 'skyClearZenith', horizon: 'skyClearHorizon' },
    fog: { color: 'skyClearHorizon', near: 60, far: 320 },
    light: { type: 'led', color: 'ledCore', intensity: 1 },
    ambient: { color: 'skyClearHorizon', intensity: 0.6 },
    snow: { density: 0, wind: 0.05, gust: 0 },
    trees: 1,
    moon: 1,
    sunrise: 0,
    windows: { warm: 0.3, cool: 0.5 },
  },
  {
    // The Forks: warm lights along the skating trail, thin snow returns.
    // The string lights themselves arrive with the Forks landmark (Phase 7).
    id: 'forks',
    from: 'the-forks',
    to: 'the-forks',
    startOffset: -0.16,
    endOffset: -0.07,
    blend: 0.04,
    sky: { zenith: 'skyClearZenith', horizon: 'skyClearHorizon' },
    fog: { color: 'skyClearHorizon', near: 30, far: 200 },
    light: { type: 'warm', color: 'sodium', intensity: 0.8 },
    ambient: { color: 'skyClearHorizon', intensity: 0.45 },
    snow: { density: 0.15, wind: 0.1, gust: 0 },
    trees: 0.35,
    moon: 0.2,
    sunrise: 0,
    windows: { warm: 0.9, cool: 0.1 },
  },
  {
    // Sunrise transition at the end of the shift.
    id: 'sunrise',
    from: 'the-forks',
    to: 'the-forks',
    startOffset: -0.03,
    blend: 0.04,
    sky: { zenith: 'skyClearHorizon', horizon: 'sunriseOrange' },
    fog: { color: 'sunriseCloud', near: 40, far: 260 },
    light: { type: 'warm', color: 'sodium', intensity: 0.35 },
    ambient: { color: 'sunriseCloud', intensity: 0.8 },
    snow: { density: 0.05, wind: 0.05, gust: 0 },
    trees: 0.2,
    moon: 0,
    sunrise: 1,
    windows: { warm: 0.4, cool: 0.1 },
  },
];
