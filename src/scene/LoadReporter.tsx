import { useFrame } from '@react-three/fiber';
import { useProgress } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import { useIntroStore } from '@/store/intro';

/** Frames drawn before the scene counts as showing something. */
const FRAMES_TO_SHOW = 3;

/**
 * Tells the Ignition loading screen how the scene is doing: the asset loader's progress (textures
 * and the like) and whether a few frames have been drawn. It renders nothing. The loading screen
 * lives in the UI and reads it from `useIntroStore`, so the UI never imports three.js.
 */
export function LoadReporter() {
  const { progress, active, total } = useProgress();
  const frames = useRef(0);

  useEffect(() => {
    useIntroStore.getState().report(progress, active, total);
  }, [progress, active, total]);

  useFrame(() => {
    if (frames.current >= FRAMES_TO_SHOW) return;
    frames.current++;
    if (frames.current === FRAMES_TO_SHOW) useIntroStore.getState().markFramed();
  });

  return null;
}
