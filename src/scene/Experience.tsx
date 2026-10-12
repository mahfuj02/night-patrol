'use client';

import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { Suspense, lazy, useEffect } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { dprForTier } from '@/lib/quality';
import { palette } from '@/lib/palette';
import { useQualityStore } from '@/store/quality';
import { Car } from './Car/Car';
import { CameraRig } from './CameraRig';
import { Ground } from './Environment/Ground';
import { ProgressDriver } from './ProgressDriver';
import { Road } from './Road/Road';
import { Snowbanks } from './Road/Snowbanks';

// r3f-perf is a dev dependency: this ternary is folded away in production builds, so the
// import below is never bundled.
const Perf =
  process.env.NODE_ENV === 'development'
    ? lazy(() => import('r3f-perf').then((m) => ({ default: m.Perf })))
    : null;

export function Experience() {
  const reducedMotion = useReducedMotion();
  const tier = useQualityStore((s) => s.tier);

  useEffect(() => {
    useQualityStore.getState().hydrate();
  }, []);

  return (
    <Canvas
      dpr={dprForTier(tier)}
      camera={{ fov: 55, near: 0.1, far: 700, position: [0, 6, -12] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <PerformanceMonitor
        onDecline={() => useQualityStore.getState().lower()}
        onIncline={() => useQualityStore.getState().raise()}
      />
      <color attach="background" args={[palette.night]} />
      <fog attach="fog" args={[palette.night, 40, 280]} />
      <ambientLight intensity={0.9} color="#8fa6cc" />
      <directionalLight position={[60, 120, -40]} intensity={1.1} color="#b8c8e8" />

      <ProgressDriver reducedMotion={reducedMotion} />
      <Ground />
      <Road />
      <Snowbanks />
      <Car />
      <CameraRig reducedMotion={reducedMotion} />

      {Perf && (
        <Suspense fallback={null}>
          <Perf position="top-left" />
        </Suspense>
      )}
    </Canvas>
  );
}
