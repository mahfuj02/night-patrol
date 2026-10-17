import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { PerspectiveCamera, Vector3 } from 'three';
import { easeInOut } from '@/lib/parking';
import { dampT } from '@/lib/route';
import { progress } from './progress';
import { FOCUS_PULL, landmarkFocus, resetFocus } from './Landmarks/landmarkFocus';
import { useDriveStore } from '@/store/drive';
import { stationView } from './Stations/stationView';
import { loopPoseAt } from './Road/loop';
import { travel } from './travel';

const CHASE_BACK = 12;
const CHASE_UP = 4.8;
const LOOK_AHEAD = 6;
const LOOK_UP = 0.8;
/** Camera smoothing rate (per second), and the gentler rate while the car turns round. */
const FOLLOW_RATE = 9;
const TURN_RATE = 4;
const MAX_DELTA = 0.1;
/** The field of view on the road; a station can narrow it while the car is parked. */
const BASE_FOV = 55;

const pose = { x: 0, z: 0, heading: 0 };
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
  const seenReset = useRef(useDriveStore.getState().resetCount);

  useFrame((state, delta) => {
    if (stationView.active) {
      // The car is off the road, in a bay: chase it from where it is.
      point.set(stationView.x, 0, stationView.z);
      tangent.set(Math.sin(stationView.heading), 0, Math.cos(stationView.heading));
    } else {
      // On the road: behind the car in the way it is going.
      loopPoseAt(progress.s, pose);
      point.set(pose.x, 0, pose.z);
      tangent.set(Math.sin(pose.heading), 0, Math.cos(pose.heading));
    }
    desired.copy(point).addScaledVector(tangent, -CHASE_BACK);
    desired.y += CHASE_UP;
    lookAt.copy(point).addScaledVector(tangent, LOOK_AHEAD);
    lookAt.y += LOOK_UP;
    // As the headlights come on at a station, the camera swings in behind the car and looks at the
    // wall (and narrows its view); it goes back to the chase view as the car leaves.
    let fov = BASE_FOV;
    if (stationView.glow > 0) {
      const k = easeInOut(stationView.glow);
      const view = stationView.camera;
      desired.set(
        desired.x + (view.x - desired.x) * k,
        desired.y + (view.y - desired.y) * k,
        desired.z + (view.z - desired.z) * k,
      );
      lookAt.set(
        lookAt.x + (view.lookX - lookAt.x) * k,
        lookAt.y + (view.lookY - lookAt.y) * k,
        lookAt.z + (view.lookZ - lookAt.z) * k,
      );
      fov = BASE_FOV + (view.fov - BASE_FOV) * k;
    }
    // While a landmark is lit the view leans toward it, so it is not left at the edge of the frame.
    if (landmarkFocus.glow > 0) {
      const pull = FOCUS_PULL * landmarkFocus.glow;
      lookAt.x += (landmarkFocus.x - lookAt.x) * pull;
      lookAt.y += (landmarkFocus.y - lookAt.y) * pull;
      lookAt.z += (landmarkFocus.z - lookAt.z) * pull;
    }
    resetFocus();

    const { camera } = state;
    // The end-of-shift reset is a cut back to the first stop: put the camera there at once, not glide
    // there from the roundabout through the fade.
    const { resetCount } = useDriveStore.getState();
    if (resetCount !== seenReset.current) {
      seenReset.current = resetCount;
      placed.current = false;
    }
    if (reducedMotion || !placed.current) {
      camera.position.copy(desired);
      placed.current = true;
    } else {
      const dt = Math.min(delta, MAX_DELTA);
      // While the car turns round the camera follows more gently, so it swings round with it.
      const rate = travel.turn ? TURN_RATE : FOLLOW_RATE;
      camera.position.set(
        dampT(camera.position.x, desired.x, rate, dt),
        dampT(camera.position.y, desired.y, rate, dt),
        dampT(camera.position.z, desired.z, rate, dt),
      );
    }
    camera.lookAt(lookAt);
    if (camera instanceof PerspectiveCamera && Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
