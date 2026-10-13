import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Color, Euler, Matrix4, Quaternion, Vector3, type InstancedMesh } from 'three';
import { buildingStretches } from '@/content/buildings';
import type { QualityTier } from '@/lib/quality';
import { createBuildingMaterial, createRoofMaterial } from '../Materials/buildingMaterials';
import { useBrickTextures } from '../Materials/useBrickTextures';
import { crossings } from '../Road/crossings';
import { routeModel } from '../Road/route';
import { createBodyGeometry, createBoxGeometry, createGableGeometry } from './buildingGeometry';
import { buildBuildings, selectBuildingsForTier } from './buildingLayout';
import { CAP_HEIGHT, buildParts } from './buildingParts';
import { PorchLights } from './PorchLights';

const allBuildings = buildBuildings(routeModel, buildingStretches, crossings);

interface Placement {
  x: number;
  y: number;
  z: number;
  yaw: number;
  sx: number;
  sy: number;
  sz: number;
}

/** Writes one instance matrix per placement into the mesh. */
function place(mesh: InstancedMesh | null, placements: readonly Placement[]) {
  if (!mesh) return;
  const matrix = new Matrix4();
  const position = new Vector3();
  const rotation = new Quaternion();
  const scale = new Vector3();
  const euler = new Euler();
  placements.forEach((p, i) => {
    euler.set(0, p.yaw, 0);
    matrix.compose(
      position.set(p.x, p.y, p.z),
      rotation.setFromEuler(euler),
      scale.set(p.sx, p.sy, p.sz),
    );
    mesh.setMatrixAt(i, matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
}

/**
 * Procedural buildings along the route: brick warehouses, towers, and houses with detached
 * garages, as three instanced meshes (walls with the window shader, gabled roofs, and snow slabs
 * on flat roofs). Layout and style come from `src/content/buildings.ts`; the low tier builds half.
 */
export function Buildings({ tier }: { tier: QualityTier }) {
  const brick = useBrickTextures(tier);
  const parts = useMemo(() => buildParts(selectBuildingsForTier(allBuildings, tier)), [tier]);
  const bodyGeometry = useMemo(() => createBodyGeometry(parts.bodies), [parts.bodies]);
  const gableGeometry = useMemo(() => createGableGeometry(), []);
  const capGeometry = useMemo(() => createBoxGeometry(), []);
  const wallMaterial = useMemo(() => createBuildingMaterial(brick), [brick]);
  const roofMaterial = useMemo(() => createRoofMaterial(), []);

  useEffect(() => () => bodyGeometry.dispose(), [bodyGeometry]);
  useEffect(() => () => gableGeometry.dispose(), [gableGeometry]);
  useEffect(() => () => capGeometry.dispose(), [capGeometry]);
  useEffect(() => () => wallMaterial.dispose(), [wallMaterial]);
  useEffect(() => () => roofMaterial.dispose(), [roofMaterial]);

  const bodies = useRef<InstancedMesh>(null);
  const gables = useRef<InstancedMesh>(null);
  const caps = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    place(
      bodies.current,
      parts.bodies.map((p) => ({ ...p, sx: p.width, sy: p.height, sz: p.depth })),
    );
    const color = new Color();
    parts.bodies.forEach((p, i) => bodies.current?.setColorAt(i, color.set(p.colour)));
    if (bodies.current?.instanceColor) bodies.current.instanceColor.needsUpdate = true;
    place(
      gables.current,
      parts.gables.map((p) => ({ ...p, sx: p.length, sy: p.height, sz: p.span })),
    );
    place(
      caps.current,
      parts.caps.map((p) => ({ ...p, sx: p.width, sy: CAP_HEIGHT, sz: p.depth })),
    );
  }, [parts]);

  return (
    <group>
      <instancedMesh
        key={`bodies-${parts.bodies.length}`}
        ref={bodies}
        args={[bodyGeometry, wallMaterial, parts.bodies.length]}
        frustumCulled={false}
      />
      {parts.gables.length > 0 && (
        <instancedMesh
          key={`gables-${parts.gables.length}`}
          ref={gables}
          args={[gableGeometry, roofMaterial, parts.gables.length]}
          frustumCulled={false}
        />
      )}
      {parts.caps.length > 0 && (
        <instancedMesh
          key={`caps-${parts.caps.length}`}
          ref={caps}
          args={[capGeometry, roofMaterial, parts.caps.length]}
          frustumCulled={false}
        />
      )}
      <PorchLights porches={parts.porches} />
    </group>
  );
}
