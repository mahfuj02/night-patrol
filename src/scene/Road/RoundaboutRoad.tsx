import { Suspense, useEffect, useMemo } from 'react';
import { world } from '@/lib/palette';
import type { QualityTier } from '@/lib/quality';
import { buildArmRibbons } from './armGeometry';
import { RoadSurface } from './Road';
import { bankGeometry, ringStrips, roundaboutLayout, type RingEnd } from './roundabout';
import { routeModel } from './route';

/** Just above the route ribbon (0.02) and the cross streets (0.025). */
const RING_Y = 0.03;

/**
 * A roundabout at one end of the road: the ring of packed snow with ruts (the same surface as the
 * road, built from straight strips round the centre line), a snowy island in the middle and a low
 * plowed bank round the outside (open where the road meets the ring). Three meshes.
 */
function RoundaboutAt({ end, tier }: { end: RingEnd; tier: QualityTier }) {
  const layout = useMemo(() => roundaboutLayout(routeModel, end), [end]);
  const ring = useMemo(() => buildArmRibbons(ringStrips(routeModel, end), RING_Y), [end]);
  const bank = useMemo(() => bankGeometry(routeModel, end), [end]);
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
        <cylinderGeometry args={[layout.spec.island, layout.spec.island + 0.5, 0.5, 48]} />
        <meshStandardMaterial color={world.snow} roughness={0.95} />
      </mesh>
      <mesh geometry={bank}>
        <meshStandardMaterial color={world.snowPacked} roughness={1} />
      </mesh>
    </group>
  );
}

/** Both ends of the patrol loop: the big roundabout past The Forks and the turnaround behind Ignition. */
export function Roundabout({ tier }: { tier: QualityTier }) {
  return (
    <>
      <RoundaboutAt end="forks" tier={tier} />
      <RoundaboutAt end="start" tier={tier} />
    </>
  );
}
