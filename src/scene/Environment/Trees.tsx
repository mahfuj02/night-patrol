import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Euler, Matrix4, Quaternion, Vector3, type InstancedMesh } from 'three';
import type { QualityTier } from '@/lib/quality';
import { createBarkMaterial, createTwigMaterial } from '../Materials/treeMaterials';
import { routeModel } from '../Road/route';
import { buildTreeVariant, type TreeDetail } from './treeBuilder';
import { buildTrees, selectTreesForTier } from './treeLayout';
import { createTwigTexture } from './twigTexture';

const SEEDS = [101, 202, 303, 404];
/** The low tier shares fewer shapes, and so draws fewer meshes. */
const VARIANTS: Record<TreeDetail, number> = { high: 4, low: 2 };

/**
 * Bare winter elms as real 3D trees: a few merged procedural shapes (tapered trunk, vase of limbs,
 * smaller branches, twig planes at the tips) drawn as instances with a random turn and scale. Two
 * draw calls per shape: bark and twigs. Rows stand behind the plowed ridge and turn their long
 * limbs toward the road, so on the avenue the branches arch over it. Placement follows the zone
 * `trees` density. The low tier plants half as many with fewer branch levels.
 */
export function Trees({ tier }: { tier: QualityTier }) {
  const detail: TreeDetail = tier === 'low' ? 'low' : 'high';
  const variantCount = VARIANTS[detail];

  const variants = useMemo(
    () => SEEDS.slice(0, variantCount).map((seed) => buildTreeVariant(seed, detail)),
    [detail, variantCount],
  );
  const trees = useMemo(
    () => selectTreesForTier(buildTrees(routeModel, variantCount), tier),
    [tier, variantCount],
  );
  const twigTexture = useMemo(() => createTwigTexture(detail === 'high' ? 256 : 128), [detail]);
  const bark = useMemo(() => createBarkMaterial(), []);
  const twigMaterial = useMemo(() => createTwigMaterial(twigTexture), [twigTexture]);

  useEffect(
    () => () => {
      variants.forEach(({ wood, twigs }) => {
        wood.dispose();
        twigs.dispose();
      });
    },
    [variants],
  );
  useEffect(() => () => twigTexture.dispose(), [twigTexture]);
  useEffect(() => () => bark.dispose(), [bark]);
  useEffect(() => () => twigMaterial.dispose(), [twigMaterial]);

  const woodMeshes = useRef<(InstancedMesh | null)[]>([]);
  const twigMeshes = useRef<(InstancedMesh | null)[]>([]);
  const byVariant = useMemo(
    () => variants.map((_, v) => trees.filter((tree) => tree.variant === v)),
    [variants, trees],
  );

  useLayoutEffect(() => {
    const matrix = new Matrix4();
    const position = new Vector3();
    const rotation = new Quaternion();
    const scale = new Vector3();
    const euler = new Euler();
    byVariant.forEach((group, v) => {
      group.forEach((tree, i) => {
        euler.set(0, tree.yaw, 0);
        matrix.compose(
          position.copy(tree.base),
          rotation.setFromEuler(euler),
          scale.setScalar(tree.scale),
        );
        woodMeshes.current[v]?.setMatrixAt(i, matrix);
        twigMeshes.current[v]?.setMatrixAt(i, matrix);
      });
      for (const mesh of [woodMeshes.current[v], twigMeshes.current[v]]) {
        if (mesh) mesh.instanceMatrix.needsUpdate = true;
      }
    });
  }, [byVariant]);

  return (
    <group>
      {variants.map((variant, v) => {
        const count = byVariant[v]?.length ?? 0;
        if (count === 0) return null;
        return (
          <group key={`${detail}-${v}`}>
            <instancedMesh
              ref={(mesh) => {
                woodMeshes.current[v] = mesh;
              }}
              args={[variant.wood, bark, count]}
              frustumCulled={false}
            />
            <instancedMesh
              ref={(mesh) => {
                twigMeshes.current[v] = mesh;
              }}
              args={[variant.twigs, twigMaterial, count]}
              frustumCulled={false}
            />
          </group>
        );
      })}
    </group>
  );
}
