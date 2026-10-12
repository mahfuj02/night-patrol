import { useLayoutEffect, useMemo, useRef } from 'react';
import type { InstancedMesh } from 'three';
import { palette } from '@/lib/palette';
import { routeModel } from './route';
import { buildSnowbanks } from './snowbankLayout';

const SPACING = 5;
const SEED = 2025;

/** Every snowbank on both sides of the route in one draw call. */
export function Snowbanks() {
  const banks = useMemo(() => buildSnowbanks(routeModel, { spacing: SPACING, seed: SEED }), []);
  const mesh = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const instanced = mesh.current;
    if (!instanced) return;
    banks.forEach((bank, i) => instanced.setMatrixAt(i, bank.matrix));
    instanced.instanceMatrix.needsUpdate = true;
    instanced.computeBoundingSphere();
  }, [banks]);

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, banks.length]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={palette.snow} roughness={1} flatShading />
    </instancedMesh>
  );
}
