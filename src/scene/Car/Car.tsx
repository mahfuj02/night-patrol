import { useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  MeshStandardMaterial,
  Vector3,
  type Group,
  type Object3D,
  type SpotLight,
} from 'three';
import { profile } from '@/content/profile';
import { world } from '@/lib/palette';
import { carState } from '../carState';
import { progress } from '../progress';
import { stationView } from '../Stations/stationView';
import { loopPoseAt } from '../Road/loop';
import { CAR_COLOURS, PLATE, UNDERGLOW, carParts, type CarMaterial } from './carModel';
import { createPlateTexture } from './plateTexture';

const HEADLIGHT_COLOR = '#FFE9C4';
const HEADLIGHT_INTENSITY = 90;
/** How much brighter the headlights get when the car is parked at a wall, and how far up they aim. */
const PARKED_BOOST = 2.2;
const PARKED_AIM_UP = 3.2;

const position = new Vector3();
const tangent = new Vector3();
const pose = { x: 0, z: 0, heading: 0 };

/**
 * The owner's white sedan, modelled from primitives (see `carModel.ts`): tinted windows, an amber
 * roof light bar, black rims, a faint cyan underglow, and a licence plate whose text comes from
 * content. No manufacturer marks. Local +z is forward; the group follows the lane the car is in and
 * faces the way it is going.
 */
export function Car() {
  const group = useRef<Group>(null);
  const leftLight = useRef<SpotLight>(null);
  const rightLight = useRef<SpotLight>(null);
  const leftTarget = useRef<Object3D>(null);
  const rightTarget = useRef<Object3D>(null);
  const plate = useMemo(() => createPlateTexture(profile.plate), []);
  const materials = useMemo(() => {
    const make = (material: CarMaterial) =>
      new MeshStandardMaterial({
        color: world[CAR_COLOURS[material]],
        roughness: material === 'glass' ? 0.15 : material === 'shell' ? 0.45 : 0.85,
        metalness: material === 'shell' ? 0.2 : 0,
        emissive:
          material === 'bar' ? world.lightBar : material === 'shell' ? world.carShell : '#000000',
        emissiveIntensity: material === 'bar' ? 0.9 : material === 'shell' ? 0.22 : 0,
      });
    return {
      shell: make('shell'),
      glass: make('glass'),
      trim: make('trim'),
      rim: make('rim'),
      bar: make('bar'),
    } satisfies Record<CarMaterial, MeshStandardMaterial>;
  }, []);
  useEffect(
    () => () => {
      plate.dispose();
      for (const material of Object.values(materials)) material.dispose();
    },
    [plate, materials],
  );

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
      loopPoseAt(progress.s, pose);
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
      {carParts.map((part) =>
        part.kind === 'box' ? (
          <mesh key={part.id} position={part.position} rotation-x={part.tilt ?? 0}>
            <boxGeometry args={part.size} />
            <primitive object={materials[part.material]} attach="material" />
          </mesh>
        ) : (
          <mesh key={part.id} position={part.position} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[part.size[0], part.size[1], part.size[2], 14]} />
            <primitive object={materials[part.material]} attach="material" />
          </mesh>
        ),
      )}
      {/* headlights and taillights */}
      {[-0.65, 0.65].map((x) => (
        <mesh key={`head-${x}`} position={[x, 0.7, 2.31]}>
          <boxGeometry args={[0.4, 0.16, 0.06]} />
          <meshStandardMaterial
            color={world.carShell}
            emissive={world.sodiumCore}
            emissiveIntensity={1.5}
          />
        </mesh>
      ))}
      {[-0.65, 0.65].map((x) => (
        <mesh key={`tail-${x}`} position={[x, 0.72, -2.31]}>
          <boxGeometry args={[0.42, 0.14, 0.06]} />
          <meshStandardMaterial
            color={world.taillightRed}
            emissive={world.taillightRed}
            emissiveIntensity={0.8}
          />
        </mesh>
      ))}
      {/* the licence plate, front and back */}
      <mesh position={PLATE.front}>
        <planeGeometry args={[PLATE.width, PLATE.height]} />
        <meshBasicMaterial map={plate} />
      </mesh>
      <mesh position={PLATE.rear} rotation-y={Math.PI}>
        <planeGeometry args={[PLATE.width, PLATE.height]} />
        <meshBasicMaterial map={plate} />
      </mesh>
      {/* the faint underglow */}
      <mesh position={[0, UNDERGLOW.y, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[UNDERGLOW.width, UNDERGLOW.length]} />
        <meshBasicMaterial
          color={world.underglow}
          transparent
          opacity={UNDERGLOW.opacity}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
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
    </group>
  );
}
