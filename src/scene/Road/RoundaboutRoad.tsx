import { Suspense, useEffect, useMemo } from 'react';
import { world } from '@/lib/palette';
import type { QualityTier } from '@/lib/quality';
import { buildArmRibbons } from './armGeometry';
import { RoadSurface } from './Road';
import { ROUNDABOUT, ringStrips, roundaboutLayout } from './roundabout';
import { routeModel } from './route';

/** Just above the route ribbon (0.02) and the cross streets (0.025). */
const RING_Y = 0.03;
const layout = roundaboutLayout(routeModel);
const ringOuter = ROUNDABOUT.centreline + ROUNDABOUT.width / 2;

/**
 * The roundabout at the end of the route: the ring of packed snow with ruts (the same surface as
 * the road, built from straight strips round the centre line), a snowy island in the middle and a
 * low plowed bank round the outside. Three meshes. The car only drives it at the end of the shift.
 */
export function Roundabout({ tier }: { tier: QualityTier }) {
  const ring = useMemo(() => buildArmRibbons(ringStrips(routeModel), RING_Y), []);
  useEffect(() => () => ring.dispose(), [ring]);

  return (
    <group>
      <mesh geometry={ring}>
        <Suspense fallback={<meshStandardMaterial color={world.snowPacked} roughness={1} />}>
          <RoadSurface tier={tier} />
        </Suspense>
      </mesh>
      <mesh position={[layout.centre.x, 0.25, layout.centre.z]}>
        <cylinderGeometry args={[ROUNDABOUT.island, ROUNDABOUT.island + 0.5, 0.5, 48]} />
        <meshStandardMaterial color={world.snow} roughness={0.95} />
      </mesh>
      <mesh position={[layout.centre.x, 0.2, layout.centre.z]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[ringOuter + 0.4, 0.45, 8, 72]} />
        <meshStandardMaterial color={world.snowPacked} roughness={1} />
      </mesh>
    </group>
  );
}
