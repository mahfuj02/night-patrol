import { useFrame } from '@react-three/fiber';
import { formatCarPose } from '@/lib/probe';
import { progress } from './progress';
import { stationView } from './Stations/stationView';
import { carPoseAt, travel } from './travel';

const pose = { x: 0, z: 0, heading: 0 };

/**
 * Test-only (`?probe=on`): writes where the car is to `document.body.dataset.car` every frame, as
 * "x,z,heading", so an end-to-end test can follow it. It renders nothing.
 */
export function CarProbe() {
  useFrame(() => {
    let x: number;
    let z: number;
    let heading: number;
    if (stationView.active) {
      ({ x, z, heading } = stationView);
    } else {
      carPoseAt(progress.t, travel.direction, pose);
      ({ x, z, heading } = pose);
    }
    document.body.dataset.car = formatCarPose(x, z, heading);
  });
  return null;
}
