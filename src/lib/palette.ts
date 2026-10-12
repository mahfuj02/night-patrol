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
