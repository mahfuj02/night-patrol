/** Shared palette tokens. Keep in sync with the @theme block in src/app/globals.css. */
export const palette = {
  night: '#0B1426',
  night2: '#14233F',
  snow: '#E8EEF5',
  street: '#FFB25C',
  hud: '#4FE3E3',
  brick: '#8A4B3A',
  sunriseFrom: '#FF8A5B',
  sunriseTo: '#FFD27A',
} as const;

export type PaletteToken = keyof typeof palette;

/**
 * World palette for the 3D scene, sampled from reference photos (see docs/art-reference.md,
 * which lists the basis for each token). Scene code takes colours from here, never inline hex.
 * "Derived" tokens in the guide are starting points to tune by eye.
 */
export const world = {
  // sky and fog
  skyClearZenith: '#24437E',
  skyClearHorizon: '#3F5B98',
  moonLow: '#BC90A5',
  skyOvercastGreen: '#5E6B60',
  skyOvercastGrey: '#4A4647',
  skyOvercastOrange: '#77614C',
  night: palette.night,
  shadow: '#050809',
  // lights
  sodium: palette.street,
  sodiumGlow: '#C3A465',
  sodiumCore: '#FDE2A4',
  ledCore: '#DDDFD7',
  ledHalo: '#8EAABA',
  lantern: '#E1E1DD',
  signalYellow: '#E0A63E',
  taillightRed: '#E0262E',
  windowWarm: '#E8B27A',
  windowCool: '#B9D3E0',
  // buildings
  glassDay: '#8FA3B5',
  glassGlow: '#3B5D78',
  mullion: '#242426',
  brick: palette.brick,
  brickNight: '#5D3C39',
  brickFaded: '#77625E',
  limestone: '#B5AB9E',
  // ground
  snow: palette.snow,
  snowPacked: '#969089',
  snowTwilight: '#27375B',
  slush: '#B2A9A1',
  rut: '#181C28',
  // props
  treeSilhouette: '#060E11',
  woodPole: '#4B4238',
  bark: '#3A332C',
  binBlue: '#2D4A6B',
  // accents
  forksMagenta: '#AD76AE',
  forksMagentaDeep: '#791F7C',
  forksMagentaCore: '#E8BDE2',
  sunriseCloud: '#F0CBBF',
  sunriseOrange: palette.sunriseFrom,
  sunriseGold: palette.sunriseTo,
} as const;

export type WorldToken = keyof typeof world;
