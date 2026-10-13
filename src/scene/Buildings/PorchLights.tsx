import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  Color,
  Euler,
  Matrix4,
  PlaneGeometry,
  Quaternion,
  SRGBColorSpace,
  Vector3,
  type InstancedMesh,
} from 'three';
import { world } from '@/lib/palette';
import { additive, billboardVertex, haloFragment } from '../Materials/haloMaterial';
import type { PorchPart } from './buildingParts';

/** Diameter of a porch light's glow, in metres. */
const GLOW_SIZE = 3.2;

/**
 * Warm porch lights beside the front doors of the houses: one instanced glow sprite each, so one
 * draw call. They are fake lights (no real light sources), like the streetlight halos.
 */
export function PorchLights({ porches }: { porches: readonly PorchPart[] }) {
  const mesh = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => new PlaneGeometry(1, 1), []);
  const material = useMemo(() => additive(billboardVertex, haloFragment), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useLayoutEffect(() => {
    const target = mesh.current;
    if (!target) return;
    const matrix = new Matrix4();
    const position = new Vector3();
    const rotation = new Quaternion().setFromEuler(new Euler());
    const scale = new Vector3(GLOW_SIZE, GLOW_SIZE, GLOW_SIZE);
    const colour = new Color().setStyle(world.windowWarm, SRGBColorSpace).multiplyScalar(0.9);
    porches.forEach((p, i) => {
      target.setMatrixAt(i, matrix.compose(position.set(p.x, p.y, p.z), rotation, scale));
      target.setColorAt(i, colour);
    });
    target.instanceMatrix.needsUpdate = true;
    if (target.instanceColor) target.instanceColor.needsUpdate = true;
  }, [porches]);

  if (porches.length === 0) return null;
  return (
    <instancedMesh
      key={porches.length}
      ref={mesh}
      args={[geometry, material, porches.length]}
      frustumCulled={false}
    />
  );
}
