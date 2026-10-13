import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Vector3 } from 'three';
import { dampT } from '@/lib/route';
import { progress } from './progress';
import { routeModel } from './Road/route';

const CHASE_BACK = 12;
const CHASE_UP = 4.8;
const LOOK_AHEAD = 6;
const LOOK_UP = 0.8;
/** Camera smoothing rate (per second). */
const FOLLOW_RATE = 9;
const MAX_DELTA = 0.1;

const point = new Vector3();
const tangent = new Vector3();
const desired = new Vector3();
const lookAt = new Vector3();

/**
 * Chase camera behind the car. Under reduced motion the camera is placed exactly each frame
 * (no smoothing), so moving between stops reads as a cut rather than continuous camera motion.
 */
export function CameraRig({ reducedMotion }: { reducedMotion: boolean }) {
  const placed = useRef(false);

  useFrame((state, delta) => {
    routeModel.lanePointAt(progress.t, point);
    routeModel.curve.getTangentAt(progress.t, tangent);
    desired.copy(point).addScaledVector(tangent, -CHASE_BACK);
    desired.y += CHASE_UP;
    lookAt.copy(point).addScaledVector(tangent, LOOK_AHEAD);
    lookAt.y += LOOK_UP;

    const { camera } = state;
    if (reducedMotion || !placed.current) {
      camera.position.copy(desired);
      placed.current = true;
    } else {
      const dt = Math.min(delta, MAX_DELTA);
      camera.position.set(
        dampT(camera.position.x, desired.x, FOLLOW_RATE, dt),
        dampT(camera.position.y, desired.y, FOLLOW_RATE, dt),
        dampT(camera.position.z, desired.z, FOLLOW_RATE, dt),
      );
    }
    camera.lookAt(lookAt);
  });

  return null;
}
