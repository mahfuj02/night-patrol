import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { formatCarPose } from '@/lib/probe';
import { vectorHeading } from '@/lib/parking';
import { progress } from './progress';
import { routeModel } from './Road/route';
import { stationView } from './Stations/stationView';

const lane = new Vector3();
const tangent = new Vector3();

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
      routeModel.lanePointAt(progress.t, lane);
      routeModel.curve.getTangentAt(progress.t, tangent);
      x = lane.x;
      z = lane.z;
      heading = vectorHeading(tangent.x, tangent.z);
    }
    document.body.dataset.car = formatCarPose(x, z, heading);
  });
  return null;
}
