import { Suspense, useEffect, useMemo } from 'react';
import { world } from '@/lib/palette';
import type { QualityTier } from '@/lib/quality';
import { buildArmRibbons } from './armGeometry';
import { RoadSurface } from './Road';
import { ROUNDABOUT, bankGeometry, ringStrips, roundaboutLayout } from './roundabout';
import { routeModel } from './route';

/** Just above the route ribbon (0.02) and the cross streets (0.025). */
const RING_Y = 0.03;
const layout = roundaboutLayout(routeModel);

/**
 * The roundabout at the end of the route: the ring of packed snow with ruts (the same surface as
 * the road, built from straight strips round the centre line), a snowy island in the middle and a
 * low plowed bank round the outside (open where the road meets the ring). Three meshes. The car
 * only drives it at the end of the shift.
 */
export function Roundabout({ tier }: { tier: QualityTier }) {
  const ring = useMemo(() => buildArmRibbons(ringStrips(routeModel), RING_Y), []);
  const bank = useMemo(() => bankGeometry(routeModel), []);
  useEffect(() => () => ring.dispose(), [ring]);
  useEffect(() => () => bank.dispose(), [bank]);

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
      <mesh geometry={bank}>
        <meshStandardMaterial color={world.snowPacked} roughness={1} />
      </mesh>
    </group>
  );
}
