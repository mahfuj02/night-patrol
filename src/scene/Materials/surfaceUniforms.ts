import { Vector3 } from 'three';

/**
 * Shared by every snow surface. `uGlow` is a faint sky-bounce term (linear RGB) that keeps snow
 * readable far from lamps; AtmosphereDriver sets it from the blended ambient light each frame.
 * Module-level so per-frame writes stay out of React state and memoised materials.
 */
export const surfaceUniforms = {
  uGlow: { value: new Vector3() },
};
