'use client';

import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { Suspense, lazy, useEffect, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { dprForTier, parseQualityParam } from '@/lib/quality';
import { palette } from '@/lib/palette';
import { useQualityStore } from '@/store/quality';
import { Buildings } from './Buildings';
import { Car } from './Car/Car';
import { Effects } from './Effects/Effects';
import { CameraRig } from './CameraRig';
import { AtmosphereDriver } from './Environment/AtmosphereDriver';
import { Trees } from './Environment/Trees';
import { Ground } from './Environment/Ground';
import { Sky } from './Environment/Sky';
import { Snow } from './Environment/Snow';
import { ProgressDriver } from './ProgressDriver';
import { CrossStreetRoads } from './Road/CrossStreetRoads';
import { Road } from './Road/Road';
import { SnowRidge } from './Road/SnowRidge';
import { Streetlights } from './Road/Streetlights';
import { Signals } from './Signals/Signals';
import { StopSigns } from './Signals/StopSigns';

// Dev-only overlay. The ternary is folded away in production builds, so the lazy
// import is never bundled.
const DevStats = process.env.NODE_ENV === 'development' ? lazy(() => import('./DevStats')) : null;

export function Experience() {
  const reducedMotion = useReducedMotion();
  const storedTier = useQualityStore((s) => s.tier);
  // ?quality=... pins the tier and turns off adaptation (for comparing and measuring tiers).
  const [pinnedTier] = useState(() => parseQualityParam(window.location.search));
  const tier = pinnedTier ?? storedTier;

  useEffect(() => {
    useQualityStore.getState().hydrate();
  }, []);

  return (
    <Canvas
      dpr={dprForTier(tier)}
      camera={{ fov: 55, near: 0.1, far: 900, position: [0, 6, -12] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <PerformanceMonitor
        onDecline={() => {
          if (!pinnedTier) useQualityStore.getState().lower();
        }}
        onIncline={() => {
          if (!pinnedTier) useQualityStore.getState().raise();
        }}
      />
      <color attach="background" args={[palette.night]} />
      <fog attach="fog" args={[palette.night, 40, 280]} />

      <ProgressDriver reducedMotion={reducedMotion} />
      <AtmosphereDriver />
      <Sky />
      <Ground tier={tier} />
      <Road tier={tier} />
      <SnowRidge tier={tier} />
      <CrossStreetRoads tier={tier} />
      <Suspense fallback={null}>
        <Buildings tier={tier} />
      </Suspense>
      <Trees tier={tier} />
      <Streetlights />
      <Signals />
      <StopSigns />
      <Car />
      <Snow tier={tier} reducedMotion={reducedMotion} />
      <CameraRig reducedMotion={reducedMotion} />
      <Effects tier={tier} reducedMotion={reducedMotion} />

      {DevStats && (
        <Suspense fallback={null}>
          <DevStats />
        </Suspense>
      )}
    </Canvas>
  );
}
