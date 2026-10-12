import { Suspense, useEffect, useMemo } from 'react';
import { world } from '@/lib/palette';
import type { QualityTier } from '@/lib/quality';
import { createRoadMaterial } from '../Materials/surfaceMaterials';
import { useSurfaceTextures } from '../Materials/useSurfaceTextures';
import { buildRibbon } from './ribbon';
import { routeModel } from './route';

const SURFACE_SAMPLES = 700;

/** Textured once the maps load; until then the flat fallback below shows. */
function RoadSurface({ tier }: { tier: QualityTier }) {
  const textures = useSurfaceTextures(tier);
  const material = useMemo(() => createRoadMaterial(textures), [textures]);
  useEffect(() => () => material.dispose(), [material]);
  return <primitive object={material} attach="material" />;
}

/**
 * The road: packed snow and slush with dark wheel ruts, one draw call. No painted centre line:
 * lane markings are buried under snow in winter (docs/art-reference.md).
 */
export function Road({ tier }: { tier: QualityTier }) {
  const surface = useMemo(
    () =>
      buildRibbon(routeModel, {
        samples: SURFACE_SAMPLES,
        extent: (width) => [-width / 2, width / 2],
        y: 0.02,
      }),
    [],
  );

  // Geometries built by hand are not managed by R3F, so release them ourselves.
  useEffect(() => () => surface.dispose(), [surface]);

  return (
    <mesh geometry={surface}>
      <Suspense fallback={<meshStandardMaterial color={world.snowPacked} roughness={1} />}>
        <RoadSurface tier={tier} />
      </Suspense>
    </mesh>
  );
}
