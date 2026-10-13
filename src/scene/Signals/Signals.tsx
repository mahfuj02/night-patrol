import { useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Color, Euler, Matrix4, Quaternion, Vector3, type InstancedMesh } from 'three';
import { world } from '@/lib/palette';
import { lightIsRed } from '@/lib/station';
import { useDriveStore } from '@/store/drive';
import {
  additive,
  billboardVertex,
  haloFragment,
  poolFragment,
  poolVertex,
} from '../Materials/haloMaterial';
import { progress } from '../progress';
import { crossings } from '../Road/crossings';
import { routeModel } from '../Road/route';
import { stationFrames } from '../Stations/stationFrames';
import { buildFurniture, buildStationLights } from './signalLayout';

const route = buildFurniture(crossings);
const stationLights = buildStationLights(routeModel, stationFrames);
const masts = [...route.masts, ...stationLights.masts];
const heads = [...route.heads, ...stationLights.heads];

/** Lamp positions in a head, from the top, as heights from the head centre. */
const LAMP_Y = [0.42, 0, -0.42] as const;
/** The lamp faces sit this far in front of the head centre. */
const LAMP_Z = 0.21;
/** Brightness of a lit lamp: above 1 so the bloom pass picks it up. */
const LIT_GAIN = 2.8;
const DIM_GAIN = 0.06;
const HALO_SIZE = 2;
const POOL_SIZE = 8;
/** The coloured pool on the snow lies this far ahead of the head, along its face. */
const POOL_AHEAD = 4.2;

const LAMP_COLOURS = [world.taillightRed, world.signalYellow, world.signalGreen] as const;
const LIT_INDEX = { red: 0, green: 2 } as const;
/** Tints for the glow on the snow: faint, so the snow keeps its colour underneath. */
const POOL_TINT = { red: '#A81C22', green: '#25A850' } as const;

type Lit = 'green' | 'red';

/**
 * Traffic lights: at the signalled crossings (fixed green along the route, red on the cross street)
 * and at the stations. Mast poles and arms, yellow-housed heads with three lamps each, and for the
 * lit lamp a soft halo and a faint coloured pool on the snow below. Six instanced meshes, six draw
 * calls. The lamps are unlit (basic) materials brighter than 1, so the bloom pass gives them a glow.
 * A station's heads turn red as the car arrives and stay red while it is parked there; they are the
 * only lights that change, and only when the state changes.
 */
export function Signals() {
  const poles = useRef<InstancedMesh>(null);
  const arms = useRef<InstancedMesh>(null);
  const housings = useRef<InstancedMesh>(null);
  const lamps = useRef<InstancedMesh>(null);
  const halos = useRef<InstancedMesh>(null);
  const pools = useRef<InstancedMesh>(null);
  /** What each head shows now, so a head is only repainted when it changes. */
  const shown = useRef<Lit[]>(heads.map((head) => head.lit));

  const haloMaterial = useMemo(() => additive(billboardVertex, haloFragment), []);
  const poolMaterial = useMemo(() => additive(poolVertex, poolFragment), []);
  useEffect(() => () => haloMaterial.dispose(), [haloMaterial]);
  useEffect(() => () => poolMaterial.dispose(), [poolMaterial]);

  /** Writes the lamps, halo and pool of one head for the colour it shows. */
  const paint = useMemo(() => {
    const matrix = new Matrix4();
    const position = new Vector3();
    const rotation = new Quaternion();
    const scale = new Vector3();
    const flat = new Quaternion().setFromEuler(new Euler(-Math.PI / 2, 0, 0));
    const colour = new Color();
    return (i: number, lit: Lit) => {
      const head = heads[i]!;
      rotation.setFromEuler(new Euler(0, head.yaw, 0));
      const forward = new Vector3(Math.sin(head.yaw), 0, Math.cos(head.yaw));

      LAMP_Y.forEach((dy, k) => {
        matrix.compose(
          position.set(head.x + forward.x * LAMP_Z, head.y + dy, head.z + forward.z * LAMP_Z),
          rotation,
          scale.set(1, 1, 1),
        );
        lamps.current?.setMatrixAt(i * 3 + k, matrix);
        colour.set(LAMP_COLOURS[k]!).multiplyScalar(k === LIT_INDEX[lit] ? LIT_GAIN : DIM_GAIN);
        lamps.current?.setColorAt(i * 3 + k, colour);
      });

      // Halo around the lit lamp, facing the camera.
      const litY = head.y + LAMP_Y[LIT_INDEX[lit]]!;
      matrix.compose(
        position.set(
          head.x + forward.x * (LAMP_Z + 0.1),
          litY,
          head.z + forward.z * (LAMP_Z + 0.1),
        ),
        rotation.identity(),
        scale.setScalar(HALO_SIZE),
      );
      halos.current?.setMatrixAt(i, matrix);
      colour.set(LAMP_COLOURS[LIT_INDEX[lit]]!);
      halos.current?.setColorAt(i, colour);

      // A faint coloured patch of light on the snow ahead of the head.
      matrix.compose(
        position.set(head.x + forward.x * POOL_AHEAD, 0.075, head.z + forward.z * POOL_AHEAD),
        flat,
        scale.setScalar(POOL_SIZE),
      );
      pools.current?.setMatrixAt(i, matrix);
      colour.set(POOL_TINT[lit]);
      pools.current?.setColorAt(i, colour);
    };
  }, []);

  const flush = () => {
    for (const mesh of [lamps, halos, pools]) {
      const instanced = mesh.current;
      if (!instanced) continue;
      instanced.instanceMatrix.needsUpdate = true;
      if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true;
    }
  };

  useLayoutEffect(() => {
    const matrix = new Matrix4();
    const position = new Vector3();
    const rotation = new Quaternion();
    const scale = new Vector3();

    masts.forEach((m, i) => {
      matrix.compose(
        position.set(m.x, m.height / 2, m.z),
        rotation.identity(),
        scale.set(1, m.height, 1),
      );
      poles.current?.setMatrixAt(i, matrix);

      const dx = m.arm.to.x - m.arm.from.x;
      const dz = m.arm.to.z - m.arm.from.z;
      const length = Math.hypot(dx, dz);
      rotation.setFromEuler(new Euler(0, Math.atan2(dx, dz), 0));
      matrix.compose(
        position.set(m.arm.from.x + dx / 2, m.arm.from.y, m.arm.from.z + dz / 2),
        rotation,
        scale.set(0.12, 0.12, length),
      );
      arms.current?.setMatrixAt(i, matrix);
    });

    heads.forEach((head, i) => {
      rotation.setFromEuler(new Euler(0, head.yaw, 0));
      matrix.compose(position.set(head.x, head.y, head.z), rotation, scale.set(1, 1, 1));
      housings.current?.setMatrixAt(i, matrix);
      paint(i, shown.current[i]!);
    });

    for (const mesh of [poles, arms, housings]) {
      if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true;
    }
    flush();
  }, [paint]);

  // The station lights follow the car: red from just before it stops at the light until it has left
  // the station, green otherwise. Only a head whose colour changes is repainted.
  useFrame(() => {
    const { phase } = useDriveStore.getState().station;
    let changed = false;
    heads.forEach((head, i) => {
      if (head.station === undefined) return;
      const frame = stationFrames[head.station];
      if (!frame) return;
      const lit: Lit = lightIsRed(progress.t, frame.lightT, frame.stopT, phase) ? 'red' : 'green';
      if (shown.current[i] === lit) return;
      shown.current[i] = lit;
      paint(i, lit);
      changed = true;
    });
    if (changed) flush();
  });

  if (masts.length === 0) return null;
  return (
    <group>
      <instancedMesh ref={poles} args={[undefined, undefined, masts.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.09, 0.13, 1, 10]} />
        <meshStandardMaterial color={world.signalPole} roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={arms} args={[undefined, undefined, masts.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={world.signalPole} roughness={0.85} />
      </instancedMesh>
      <instancedMesh
        ref={housings}
        args={[undefined, undefined, heads.length]}
        frustumCulled={false}
      >
        <boxGeometry args={[0.46, 1.4, 0.4]} />
        <meshStandardMaterial
          color={world.signalYellow}
          roughness={0.7}
          emissive={world.signalYellow}
          emissiveIntensity={0.08}
        />
      </instancedMesh>
      <instancedMesh
        ref={lamps}
        args={[undefined, undefined, heads.length * 3]}
        frustumCulled={false}
      >
        <circleGeometry args={[0.14, 14]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh
        ref={halos}
        args={[undefined, undefined, heads.length]}
        frustumCulled={false}
        renderOrder={2}
        material={haloMaterial}
      >
        <planeGeometry args={[1, 1]} />
      </instancedMesh>
      <instancedMesh
        ref={pools}
        args={[undefined, undefined, heads.length]}
        frustumCulled={false}
        renderOrder={1}
        material={poolMaterial}
      >
        <planeGeometry args={[1, 1]} />
      </instancedMesh>
    </group>
  );
}
