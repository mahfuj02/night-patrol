import { useEffect, useMemo } from 'react';
import { palette } from '@/lib/palette';
import { buildRibbon } from './ribbon';
import { routeModel } from './route';

const SURFACE_SAMPLES = 700;
const LINE_SAMPLES = 1000;

/** Asphalt strip plus a dashed centre line: two draw calls for the whole route. */
export function Road() {
  const surface = useMemo(
    () =>
      buildRibbon(routeModel, {
        samples: SURFACE_SAMPLES,
        extent: (width) => [-width / 2, width / 2],
        y: 0.02,
      }),
    [],
  );
  const centreLine = useMemo(
    () =>
      buildRibbon(routeModel, {
        samples: LINE_SAMPLES,
        extent: () => [-0.12, 0.12],
        y: 0.04,
        dash: { on: 5, off: 5 },
      }),
    [],
  );

  // Geometries built by hand are not managed by R3F, so release them ourselves.
  useEffect(() => () => surface.dispose(), [surface]);
  useEffect(() => () => centreLine.dispose(), [centreLine]);

  return (
    <group>
      <mesh geometry={surface}>
        <meshStandardMaterial color="#1b2740" roughness={1} />
      </mesh>
      <mesh geometry={centreLine}>
        <meshStandardMaterial color={palette.street} roughness={1} />
      </mesh>
    </group>
  );
}
