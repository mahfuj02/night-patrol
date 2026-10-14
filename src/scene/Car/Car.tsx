import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useRef } from 'react';
import { Vector3, type Group, type Object3D, type SpotLight } from 'three';
import { palette, world } from '@/lib/palette';
import { carState } from '../carState';
import { progress } from '../progress';
import { stationView } from '../Stations/stationView';
import { carPoseAt, travel } from '../travel';

const HEADLIGHT_COLOR = '#FFE9C4';
const HEADLIGHT_INTENSITY = 90;
/** How much brighter the headlights get when the car is parked at a wall, and how far up they aim. */
const PARKED_BOOST = 2.2;
const PARKED_AIM_UP = 3.2;

const position = new Vector3();
const tangent = new Vector3();
const pose = { x: 0, z: 0, heading: 0 };

/**
 * Placeholder low-poly car built from primitives. Local +z is forward; the group follows the
 * right-hand lane of the route and faces along its tangent. Phase 10 replaces this with an original model.
 */
export function Car() {
  const group = useRef<Group>(null);
  const leftLight = useRef<SpotLight>(null);
  const rightLight = useRef<SpotLight>(null);
  const leftTarget = useRef<Object3D>(null);
  const rightTarget = useRef<Object3D>(null);

  useFrame(() => {
    const car = group.current;
    if (!car) return;
    if (stationView.active) {
      // Turning into, parked in, or backing out of a station bay.
      position.set(stationView.x, 0, stationView.z);
      tangent.set(Math.sin(stationView.heading), 0, Math.cos(stationView.heading));
      car.rotation.y = stationView.heading;
    } else {
      // On the road: in the right-hand lane for the way it is going, facing that way (so going back
      // toward the start it is in the other lane and faces back, never driving in reverse).
      carPoseAt(progress.t, travel.direction, pose);
      position.set(pose.x, 0, pose.z);
      tangent.set(Math.sin(pose.heading), 0, Math.cos(pose.heading));
      car.rotation.y = pose.heading;
    }
    car.position.copy(position);
    carState.position.copy(position);
    carState.forward.copy(tangent);

    // Parked at a wall the headlights brighten and tip up, so they light the wall.
    const glow = stationView.glow;
    for (const light of [leftLight.current, rightLight.current]) {
      if (light) light.intensity = HEADLIGHT_INTENSITY * (1 + PARKED_BOOST * glow);
    }
    for (const target of [leftTarget.current, rightTarget.current]) {
      if (target) {
        target.position.y = -0.2 + PARKED_AIM_UP * glow;
        target.position.z = 16 - 8 * glow;
      }
    }
  });

  // Each headlight aims at a point on the road ahead; the targets ride along with the car.
  useLayoutEffect(() => {
    const lights = [leftLight.current, rightLight.current];
    const targets = [leftTarget.current, rightTarget.current];
    lights.forEach((light, i) => {
      const target = targets[i];
      if (light && target) light.target = target;
    });
  }, []);

  return (
    <group ref={group}>
      {/* body */}
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[1.9, 0.7, 4.2]} />
        <meshStandardMaterial color={palette.snow} flatShading roughness={0.8} />
      </mesh>
      {/* cabin */}
      <mesh position={[0, 1.25, -0.2]}>
        <boxGeometry args={[1.6, 0.6, 2.2]} />
        <meshStandardMaterial color={palette.night2} flatShading roughness={0.6} />
      </mesh>
      {/* roof light bar */}
      <mesh position={[0, 1.65, -0.2]}>
        <boxGeometry args={[1.0, 0.16, 0.35]} />
        <meshStandardMaterial
          color={palette.street}
          emissive={palette.street}
          emissiveIntensity={0.6}
          flatShading
        />
      </mesh>
      {/* headlights */}
      {[-0.65, 0.65].map((x) => (
        <mesh key={`head-${x}`} position={[x, 0.7, 2.12]}>
          <boxGeometry args={[0.4, 0.2, 0.08]} />
          <meshStandardMaterial
            color={palette.snow}
            emissive={palette.street}
            emissiveIntensity={1.5}
          />
        </mesh>
      ))}
      {/* taillights */}
      {[-0.65, 0.65].map((x) => (
        <mesh key={`tail-${x}`} position={[x, 0.7, -2.12]}>
          <boxGeometry args={[0.4, 0.2, 0.08]} />
          <meshStandardMaterial
            color={world.taillightRed}
            emissive={world.taillightRed}
            emissiveIntensity={0.8}
          />
        </mesh>
      ))}
      {/* headlights: the scene's only real lights, no shadows */}
      <spotLight
        ref={leftLight}
        position={[-0.65, 0.75, 2.1]}
        color={HEADLIGHT_COLOR}
        intensity={HEADLIGHT_INTENSITY}
        angle={0.4}
        penumbra={0.75}
        distance={42}
        decay={1.6}
      />
      <spotLight
        ref={rightLight}
        position={[0.65, 0.75, 2.1]}
        color={HEADLIGHT_COLOR}
        intensity={HEADLIGHT_INTENSITY}
        angle={0.4}
        penumbra={0.75}
        distance={42}
        decay={1.6}
      />
      <object3D ref={leftTarget} position={[-0.9, -0.2, 16]} />
      <object3D ref={rightTarget} position={[0.9, -0.2, 16]} />
      {/* wheels */}
      {[-0.95, 0.95].flatMap((x) =>
        [-1.35, 1.35].map((z) => (
          <mesh key={`wheel-${x}-${z}`} position={[x, 0.38, z]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.38, 0.38, 0.3, 10]} />
            <meshStandardMaterial color="#0a0f1a" flatShading roughness={1} />
          </mesh>
        )),
      )}
    </group>
  );
}
