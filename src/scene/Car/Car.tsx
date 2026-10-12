import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Vector3, type Group } from 'three';
import { palette } from '@/lib/palette';
import { progress } from '../progress';
import { routeModel } from '../Road/route';

const position = new Vector3();
const tangent = new Vector3();

/**
 * Placeholder low-poly car built from primitives. Local +z is forward; the group follows the
 * route curve and faces along its tangent. Phase 10 replaces this with an original model.
 */
export function Car() {
  const group = useRef<Group>(null);

  useFrame(() => {
    const car = group.current;
    if (!car) return;
    routeModel.curve.getPointAt(progress.t, position);
    routeModel.curve.getTangentAt(progress.t, tangent);
    car.position.copy(position);
    car.rotation.y = Math.atan2(tangent.x, tangent.z);
  });

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
            color={palette.sunriseFrom}
            emissive={palette.sunriseFrom}
            emissiveIntensity={0.8}
          />
        </mesh>
      ))}
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
