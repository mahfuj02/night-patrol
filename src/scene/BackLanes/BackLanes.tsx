import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  BoxGeometry,
  BufferGeometry,
  Color,
  Euler,
  Float32BufferAttribute,
  LineBasicMaterial,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
  type InstancedMesh,
} from 'three';
import { backLanes } from '@/content/backLanes';
import { buildingStretches } from '@/content/buildings';
import { world } from '@/lib/palette';
import type { QualityTier } from '@/lib/quality';
import { sceneBuildings } from '../Buildings/sceneBuildings';
import { patchTreeMaterial } from '../Materials/treeMaterials';
import { routeModel } from '../Road/route';
import { buildBackLanes, selectBackLanesForTier } from './backLaneLayout';

const allProps = buildBackLanes(routeModel, sceneBuildings, buildingStretches, backLanes);

const ARM_LENGTH = 2.4;
const ARM_DROP = 0.6;
const FENCE_THICKNESS = 0.08;
const BIN_SIZE = [0.7, 1.05, 0.8] as const;
const WIRE_COLOUR = '#323B4A';

/** A lit-by-the-lamps, snow-dusted material for props: wood, bins and fences. */
function propMaterial(colour: string, key: string): MeshStandardMaterial {
  const material = new MeshStandardMaterial({ color: colour, roughness: 1, metalness: 0 });
  patchTreeMaterial(material, { snow: 0.85, lampGain: 1.4 }, key);
  return material;
}

interface Placement {
  x: number;
  y: number;
  z: number;
  yaw: number;
  sx: number;
  sy: number;
  sz: number;
}

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
 * The back lanes behind the houses: wooden power poles with cross arms and sagging wires, fences
 * along the back and one side of the lots, and pairs of city bins. Five draw calls (poles, arms,
 * wires, fences, bins). The low tier keeps the poles and wires and only every other fence and bin.
 */
export function BackLanes({ tier }: { tier: QualityTier }) {
  const props = useMemo(() => selectBackLanesForTier(allProps, tier), [tier]);
  const poles = useRef<InstancedMesh>(null);
  const arms = useRef<InstancedMesh>(null);
  const fences = useRef<InstancedMesh>(null);
  const bins = useRef<InstancedMesh>(null);

  const box = useMemo(() => new BoxGeometry(1, 1, 1).translate(0, 0.5, 0), []);
  const wood = useMemo(() => propMaterial(world.woodPole, 'prop-wood'), []);
  const fence = useMemo(() => propMaterial('#ffffff', 'prop-fence'), []);
  const bin = useMemo(() => propMaterial('#ffffff', 'prop-bin'), []);
  const wireMaterial = useMemo(() => new LineBasicMaterial({ color: WIRE_COLOUR }), []);
  const wires = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(props.wires, 3));
    return geometry;
  }, [props.wires]);
  useEffect(() => () => box.dispose(), [box]);
  useEffect(() => () => wood.dispose(), [wood]);
  useEffect(() => () => fence.dispose(), [fence]);
  useEffect(() => () => bin.dispose(), [bin]);
  useEffect(() => () => wireMaterial.dispose(), [wireMaterial]);
  useEffect(() => () => wires.dispose(), [wires]);

  useLayoutEffect(() => {
    place(
      poles.current,
      props.poles.map((p) => ({
        x: p.x,
        y: 0,
        z: p.z,
        yaw: p.yaw,
        sx: 0.32,
        sy: p.height,
        sz: 0.32,
      })),
    );
    place(
      arms.current,
      props.poles.map((p) => ({
        x: p.x,
        y: p.height - ARM_DROP,
        z: p.z,
        yaw: p.yaw,
        sx: ARM_LENGTH,
        sy: 0.14,
        sz: 0.14,
      })),
    );
    place(
      fences.current,
      props.fences.map((f) => ({
        x: f.x,
        y: 0,
        z: f.z,
        yaw: f.yaw,
        sx: f.length,
        sy: backLanes.fenceHeight,
        sz: FENCE_THICKNESS,
      })),
    );
    props.fences.forEach((f, i) => fences.current?.setColorAt(i, new Color(f.colour)));
    if (fences.current?.instanceColor) fences.current.instanceColor.needsUpdate = true;
    place(
      bins.current,
      props.bins.map((b) => ({
        x: b.x,
        y: 0,
        z: b.z,
        yaw: b.yaw,
        sx: BIN_SIZE[0],
        sy: BIN_SIZE[1],
        sz: BIN_SIZE[2],
      })),
    );
    props.bins.forEach((b, i) => bins.current?.setColorAt(i, new Color(b.colour)));
    if (bins.current?.instanceColor) bins.current.instanceColor.needsUpdate = true;
  }, [props]);

  return (
    <group>
      {props.poles.length > 0 && (
        <>
          <instancedMesh
            key={`poles-${props.poles.length}`}
            ref={poles}
            args={[box, wood, props.poles.length]}
            frustumCulled={false}
          />
          <instancedMesh
            key={`arms-${props.poles.length}`}
            ref={arms}
            args={[box, wood, props.poles.length]}
            frustumCulled={false}
          />
          <lineSegments geometry={wires} material={wireMaterial} frustumCulled={false} />
        </>
      )}
      {props.fences.length > 0 && (
        <instancedMesh
          key={`fences-${props.fences.length}`}
          ref={fences}
          args={[box, fence, props.fences.length]}
          frustumCulled={false}
        />
      )}
      {props.bins.length > 0 && (
        <instancedMesh
          key={`bins-${props.bins.length}`}
          ref={bins}
          args={[box, bin, props.bins.length]}
          frustumCulled={false}
        />
      )}
    </group>
  );
}
