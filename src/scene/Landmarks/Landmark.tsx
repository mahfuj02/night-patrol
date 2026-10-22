import { useFrame } from '@react-three/fiber';
import { useMemo, type ReactNode } from 'react';
import { landmarkGlow } from '@/lib/landmark';
import { progress } from '../progress';
import { offerFocus } from './landmarkFocus';
import { GlowUniform } from './landmarkMaterials';
import type { LandmarkFrame } from './placement';

interface LandmarkProps {
  frame: LandmarkFrame;
  reducedMotion: boolean;
  /** Where the camera leans while the landmark is lit, in local metres (default: its centre). */
  focus?: [number, number, number];
  /** A steady glow the landmark never drops below (scenery is always lit; stops use 0). */
  minGlow?: number;
  /** Whether the camera leans toward the focus point while lit (true for stops, false for scenery). */
  lean?: boolean;
  /** Called every frame with the glow, to drive materials that are not shader-based. */
  onGlow?: (glow: number) => void;
  /** Receives the shared glow uniform for the landmark's shader materials. */
  children: (glow: GlowUniform) => ReactNode;
}

/**
 * The base pattern for a landmark. It places its children in the landmark frame and owns one
 * shared glow value (0 to 1) that rises as the car approaches the stop, holds at the stop and fades
 * after it (see `landmarkGlow`; a cut, not a ramp, under reduced motion). Children draw the glow
 * through shader materials; `onGlow` handles anything else. While lit, the landmark also asks the
 * camera to lean toward `focus`.
 */
export function Landmark({
  frame,
  reducedMotion,
  focus = [0, 6, 0],
  minGlow = 0,
  lean = true,
  onGlow,
  children,
}: LandmarkProps) {
  const glow = useMemo(() => new GlowUniform(), []);

  useFrame(() => {
    // Heading back the sign lights up the same way, as the car approaches it from the other side.
    const t = progress.direction === 1 ? progress.t : 2 * frame.stopT - progress.t;
    glow.set(Math.max(minGlow, landmarkGlow(t, frame.stopT, reducedMotion)));
    onGlow?.(glow.value);
    if (!lean) return;
    const [lx, ly, lz] = focus;
    // The focus point in world space: local x along the wall, z away from the road.
    offerFocus(
      frame.position.x + Math.cos(frame.yaw) * lx + Math.sin(frame.yaw) * lz,
      ly,
      frame.position.z - Math.sin(frame.yaw) * lx + Math.cos(frame.yaw) * lz,
      glow.value,
    );
  }, -0.5);

  return (
    <group position={frame.position} rotation={[0, frame.yaw, 0]}>
      {children(glow)}
    </group>
  );
}
