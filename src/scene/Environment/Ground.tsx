import { Suspense, useEffect, useMemo } from 'react';
import { world } from '@/lib/palette';
import type { QualityTier } from '@/lib/quality';
import { createSnowMaterial } from '../Materials/surfaceMaterials';
import { useSurfaceTextures } from '../Materials/useSurfaceTextures';
import { routeModel } from '../Road/route';

const SIZE = 2400;

// Centre the snow plane on the middle of the route so the horizon fog hides its edges.
const centre = routeModel.curve.getPointAt(0.5);

function GroundSnow({ tier }: { tier: QualityTier }) {
  const textures = useSurfaceTextures(tier);
  const material = useMemo(() => createSnowMaterial(textures, { dirt: 0 }), [textures]);
  useEffect(() => () => material.dispose(), [material]);
  return <primitive object={material} attach="material" />;
}

/** Fresh snow all around the road. Textured in world space with two blended scales. */
export function Ground({ tier }: { tier: QualityTier }) {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[centre.x, -0.02, centre.z]}>
      <planeGeometry args={[SIZE, SIZE]} />
      <Suspense fallback={<meshStandardMaterial color={world.snowPacked} roughness={1} />}>
        <GroundSnow tier={tier} />
      </Suspense>
    </mesh>
  );
}
