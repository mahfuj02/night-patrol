import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  CylinderGeometry,
  Euler,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
  type InstancedMesh,
} from 'three';
import { signage } from '@/content/signage';
import { world } from '@/lib/palette';
import { crossings } from '../Road/crossings';
import { buildFurniture } from './signalLayout';
import { createStopSignTexture } from './stopSignTexture';

const { signs } = buildFurniture(crossings);

/** Radius of the octagon and its thickness, in metres. */
const SIGN_RADIUS = 0.42;
const SIGN_THICKNESS = 0.04;
/** How bright the face stays with no light on it: the reflective sheeting catches the headlights. */
const FACE_GLOW = 0.4;

/**
 * Stop signs on the cross streets of the neighbourhood: a post and an octagonal face (red, white
 * border, "STOP") each, as two instanced meshes. The lettering comes from `src/content/signage.ts`.
 */
export function StopSigns() {
  const posts = useRef<InstancedMesh>(null);
  const faces = useRef<InstancedMesh>(null);

  const geometry = useMemo(() => {
    // An eight-sided cylinder, turned so its cap faces +z with a flat side up.
    const octagon = new CylinderGeometry(SIGN_RADIUS, SIGN_RADIUS, SIGN_THICKNESS, 8);
    octagon.rotateX(Math.PI / 2);
    octagon.rotateZ(Math.PI / 8);
    return octagon;
  }, []);
  const materials = useMemo(() => {
    const map = createStopSignTexture(signage.stop);
    const face = new MeshStandardMaterial({
      map,
      emissiveMap: map,
      emissive: '#ffffff',
      emissiveIntensity: FACE_GLOW,
      roughness: 0.55,
    });
    return { map, face };
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(
    () => () => {
      materials.map.dispose();
      materials.face.dispose();
    },
    [materials],
  );

  useLayoutEffect(() => {
    const matrix = new Matrix4();
    const position = new Vector3();
    const rotation = new Quaternion();
    const scale = new Vector3();
    signs.forEach((sign, i) => {
      matrix.compose(
        position.set(sign.x, sign.post / 2, sign.z),
        rotation.identity(),
        scale.set(1, sign.post, 1),
      );
      posts.current?.setMatrixAt(i, matrix);
      rotation.setFromEuler(new Euler(0, sign.yaw, 0));
      // The face stands just in front of the post, toward approaching traffic.
      const forward = new Vector3(Math.sin(sign.yaw), 0, Math.cos(sign.yaw));
      matrix.compose(
        position.set(sign.x + forward.x * 0.06, sign.y, sign.z + forward.z * 0.06),
        rotation,
        scale.set(1, 1, 1),
      );
      faces.current?.setMatrixAt(i, matrix);
    });
    for (const mesh of [posts, faces]) {
      if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true;
    }
  }, []);

  if (signs.length === 0) return null;
  return (
    <group>
      <instancedMesh ref={posts} args={[undefined, undefined, signs.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.04, 0.04, 1, 6]} />
        <meshStandardMaterial color={world.signalPole} roughness={0.85} />
      </instancedMesh>
      <instancedMesh
        ref={faces}
        args={[geometry, materials.face, signs.length]}
        frustumCulled={false}
      />
    </group>
  );
}
