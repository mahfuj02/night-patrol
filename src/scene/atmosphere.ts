import { atmosphereZones } from '@/content/atmosphere';
import { stops } from '@/content/stops';
import { createAtmosphere, resolveZones, type Atmosphere } from '@/lib/atmosphere';

/** Zone data resolved to `t` ranges once, from the plain content files (no zod in the client). */
export const resolvedZones = resolveZones(atmosphereZones, stops);

/**
 * The blended atmosphere for the current frame. Written once per frame by AtmosphereDriver and
 * read by the sky, snow and lights. A plain mutable object keeps per-frame updates out of React.
 */
export const atmosphere: Atmosphere = createAtmosphere();
