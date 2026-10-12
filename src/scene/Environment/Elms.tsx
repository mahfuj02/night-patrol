import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { DoubleSide, Euler, Matrix4, Quaternion, Vector3, type InstancedMesh } from 'three';
import { world } from '@/lib/palette';
import type { QualityTier } from '@/lib/quality';
import { routeModel } from '../Road/route';
import { createBranchTexture } from './branchTexture';
import { buildElms, selectElmsForTier } from './elmLayout';

/** Three crossed cards per tree, so the canopy reads from any angle. */
const CARD_ANGLES = [0, Math.PI / 3, (2 * Math.PI) / 3];
/** Trunk height as a share of the whole tree; the canopy starts where the trunk forks. */
const TRUNK_SHARE = 0.42;
const CANOPY_SHARE = 0.75;

/**
 * Bare elm silhouettes arching over the road (docs/art-reference.md): an instanced trunk and
 * instanced canopy cards textured with a procedural branch pattern. Two draw calls in total. They
 * are flat near-black, so fog fades them into the haze, and they are placed by the zone data
 * (many on the avenue, few downtown). The low tier plants half as many with a smaller texture.
 */
export function Elms({ tier }: { tier: QualityTier }) {
  const elms = useMemo(() => selectElmsForTier(buildElms(routeModel), tier), [tier]);
  const texture = useMemo(() => createBranchTexture(tier === 'low' ? 256 : 512), [tier]);
  const trunks = useRef<InstancedMesh>(null);
  const cards = useRef<InstancedMesh>(null);

  useEffect(() => () => texture.dispose(), [texture]);

  useLayoutEffect(() => {
    const matrix = new Matrix4();
    const position = new Vector3();
    const rotation = new Quaternion();
    const scale = new Vector3();
    const euler = new Euler();

    elms.forEach((elm, i) => {
      const trunkHeight = elm.height * TRUNK_SHARE;
      const girth = elm.height / 20;
      matrix.compose(
        position.set(elm.base.x, trunkHeight / 2, elm.base.z),
        rotation.identity(),
        scale.set(girth, trunkHeight, girth),
      );
      trunks.current?.setMatrixAt(i, matrix);

      const cardHeight = elm.height * CANOPY_SHARE;
      CARD_ANGLES.forEach((angle, j) => {
        euler.set(0, elm.yaw + angle, 0);
        matrix.compose(
          position.set(
            elm.base.x + elm.lean.x,
            trunkHeight + cardHeight / 2 - 1.6,
            elm.base.z + elm.lean.z,
          ),
          rotation.setFromEuler(euler),
          scale.set(elm.canopyWidth, cardHeight, 1),
        );
        cards.current?.setMatrixAt(i * CARD_ANGLES.length + j, matrix);
      });
    });
    for (const mesh of [trunks, cards]) {
      if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true;
    }
  }, [elms]);

  return (
    <group>
      <instancedMesh ref={trunks} args={[undefined, undefined, elms.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.3, 0.5, 1, 7]} />
        <meshBasicMaterial color={world.treeSilhouette} />
      </instancedMesh>
      <instancedMesh
        ref={cards}
        args={[undefined, undefined, elms.length * CARD_ANGLES.length]}
        frustumCulled={false}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          color={world.treeSilhouette}
          alphaMap={texture}
          alphaTest={0.5}
          alphaToCoverage
          side={DoubleSide}
        />
      </instancedMesh>
    </group>
  );
}
