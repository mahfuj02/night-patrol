import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import type { InstancedMesh } from 'three';
import { world } from '@/lib/palette';
import type { QualityTier } from '@/lib/quality';
import { createSnowMaterial } from '../Materials/surfaceMaterials';
import { useSurfaceTextures } from '../Materials/useSurfaceTextures';
import { routeModel } from './route';
import { createSnowbankGeometry } from './snowbankGeometry';
import { buildSnowbanks } from './snowbankLayout';

const SPACING = 6;
const SEED = 2025;

function BankSnow({ tier }: { tier: QualityTier }) {
  const textures = useSurfaceTextures(tier);
  // Banks collect road grime near the ground.
  const material = useMemo(() => createSnowMaterial(textures, { dirt: 0.4 }), [textures]);
  useEffect(() => () => material.dispose(), [material]);
  return <primitive object={material} attach="material" />;
}

/** Soft, lumpy snowbanks on both sides of the route, in one draw call. */
export function Snowbanks({ tier }: { tier: QualityTier }) {
  const banks = useMemo(() => buildSnowbanks(routeModel, { spacing: SPACING, seed: SEED }), []);
  const geometry = useMemo(() => createSnowbankGeometry(tier === 'low' ? 'low' : 'high'), [tier]);
  const mesh = useRef<InstancedMesh>(null);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useLayoutEffect(() => {
    const instanced = mesh.current;
    if (!instanced) return;
    banks.forEach((bank, i) => instanced.setMatrixAt(i, bank.matrix));
    instanced.instanceMatrix.needsUpdate = true;
    instanced.computeBoundingSphere();
  }, [banks, geometry]);

  return (
    <instancedMesh
      key={tier === 'low' ? 'low' : 'high'}
      ref={mesh}
      args={[geometry, undefined, banks.length]}
      frustumCulled={false}
    >
      <Suspense fallback={<meshStandardMaterial color={world.snowPacked} roughness={1} />}>
        <BankSnow tier={tier} />
      </Suspense>
    </instancedMesh>
  );
}
