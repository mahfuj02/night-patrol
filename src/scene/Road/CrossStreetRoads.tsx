import { Suspense, useEffect, useMemo } from 'react';
import { world } from '@/lib/palette';
import type { QualityTier } from '@/lib/quality';
import { buildArmRibbons, buildArmRidges } from './armGeometry';
import { stationFrames } from '../Stations/stationFrames';
import { crossings } from './crossings';
import { RoadSurface } from './Road';
import { RidgeSnow } from './SnowRidge';

const SEED = 3301;
/** Just above the route ribbon (0.02), so the arms win where they overlap the main road's edge. */
const ROAD_Y = 0.025;

const arms = crossings.flatMap((crossing) => crossing.arms);
/** The packed-road pads from the road edge to each station bay. */
const pads = stationFrames.map((frame) => frame.geometry.pad);

/**
 * The cross streets: every arm as one road mesh and one plowed-ridge mesh, using the same
 * materials as the route (packed snow, ruts, grimy ridges), so two draw calls in all. Fewer
 * cross-sections on the low tier.
 */
export function CrossStreetRoads({ tier }: { tier: QualityTier }) {
  const road = useMemo(() => buildArmRibbons([...arms, ...pads], ROAD_Y), []);
  const ridges = useMemo(
    () =>
      buildArmRidges(
        arms,
        tier === 'low' ? { step: 4, profile: 4, seed: SEED } : { step: 2, profile: 6, seed: SEED },
      ),
    [tier],
  );
  useEffect(() => () => road.dispose(), [road]);
  useEffect(() => () => ridges.dispose(), [ridges]);

  return (
    <group>
      <mesh geometry={road}>
        <Suspense fallback={<meshStandardMaterial color={world.snowPacked} roughness={1} />}>
          <RoadSurface tier={tier} />
        </Suspense>
      </mesh>
      <mesh geometry={ridges} frustumCulled={false}>
        <Suspense fallback={<meshStandardMaterial color={world.snowPacked} roughness={1} />}>
          <RidgeSnow tier={tier} />
        </Suspense>
      </mesh>
    </group>
  );
}
