import { Suspense, useEffect, useMemo } from 'react';
import { world } from '@/lib/palette';
import type { QualityTier } from '@/lib/quality';
import { createSnowMaterial } from '../Materials/surfaceMaterials';
import { useSurfaceTextures } from '../Materials/useSurfaceTextures';
import { buildSnowRidge } from './ridgeGeometry';
import { routeModel } from './route';

const SEED = 2025;

export function RidgeSnow({ tier }: { tier: QualityTier }) {
  const textures = useSurfaceTextures(tier);
  // Plowed snow collects road grime near the ground.
  const material = useMemo(() => createSnowMaterial(textures, { dirt: 0.45 }), [textures]);
  useEffect(() => () => material.dispose(), [material]);
  return <primitive object={material} attach="material" />;
}

/**
 * The plowed snow ridge along both road edges: one continuous mesh with gentle lumps, broken only
 * at intersections. Fewer cross-sections on the low tier.
 */
export function SnowRidge({ tier }: { tier: QualityTier }) {
  const geometry = useMemo(
    () =>
      buildSnowRidge(
        routeModel,
        tier === 'low'
          ? { step: 3, profile: 4, seed: SEED }
          : { step: 1.5, profile: 6, seed: SEED },
      ),
    [tier],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry} frustumCulled={false}>
      <Suspense fallback={<meshStandardMaterial color={world.snowPacked} roughness={1} />}>
        <RidgeSnow tier={tier} />
      </Suspense>
    </mesh>
  );
}
