import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  Color,
  Euler,
  Matrix4,
  Quaternion,
  ShaderMaterial,
  SRGBColorSpace,
  Vector3,
  type InstancedMesh,
} from 'three';
import { lamps } from './lamps';

const HALO_SIZE = { sodium: 7, led: 9, warm: 5 } as const;

const billboardVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vColor;
  void main() {
    vUv = uv;
    vColor = instanceColor;
    // Instance scale is the halo diameter; the quad always faces the camera.
    vec4 centre = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    float size = length(instanceMatrix[0].xyz);
    centre.xy += position.xy * size;
    gl_Position = projectionMatrix * centre;
  }
`;

const haloFragment = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vColor;
  void main() {
    float d = clamp(length(vUv - 0.5) * 2.0, 0.0, 1.0);
    float glow = pow(1.0 - d, 2.4);
    float core = pow(1.0 - d, 9.0);
    gl_FragColor = vec4(vColor, glow * 0.55 + core * 0.9);
  }
`;

const poolVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vColor;
  void main() {
    vUv = uv;
    vColor = instanceColor;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`;

const poolFragment = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vColor;
  void main() {
    float d = clamp(length(vUv - 0.5) * 2.0, 0.0, 1.0);
    gl_FragColor = vec4(vColor, pow(1.0 - d, 1.8) * 0.55);
  }
`;

function additive(vertexShader: string, fragmentShader: string) {
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
  });
}

/**
 * Poles, arms, glowing heads, soft halos and light pools for every lamp: five instanced meshes,
 * five draw calls. The lights themselves are fake (halo and pool sprites); the only real lights in
 * the scene are the car's headlights.
 */
export function Streetlights() {
  const poles = useRef<InstancedMesh>(null);
  const arms = useRef<InstancedMesh>(null);
  const heads = useRef<InstancedMesh>(null);
  const halos = useRef<InstancedMesh>(null);
  const pools = useRef<InstancedMesh>(null);

  const haloMaterial = useMemo(() => additive(billboardVertex, haloFragment), []);
  const poolMaterial = useMemo(() => additive(poolVertex, poolFragment), []);
  useEffect(() => () => haloMaterial.dispose(), [haloMaterial]);
  useEffect(() => () => poolMaterial.dispose(), [poolMaterial]);

  useLayoutEffect(() => {
    const matrix = new Matrix4();
    const position = new Vector3();
    const rotation = new Quaternion();
    const scale = new Vector3();
    const flat = new Quaternion().setFromEuler(new Euler(-Math.PI / 2, 0, 0));
    const colour = new Color();

    lamps.forEach((lamp, i) => {
      // pole
      matrix.compose(
        position.set(lamp.pole.x, lamp.height / 2, lamp.pole.z),
        rotation.identity(),
        scale.set(1, lamp.height, 1),
      );
      poles.current?.setMatrixAt(i, matrix);

      // arm: a thin box from the top of the pole to the head
      const dx = lamp.head.x - lamp.pole.x;
      const dz = lamp.head.z - lamp.pole.z;
      const length = Math.hypot(dx, dz);
      rotation.setFromEuler(new Euler(0, Math.atan2(dx, dz), 0));
      matrix.compose(
        position.set(lamp.pole.x + dx / 2, lamp.height, lamp.pole.z + dz / 2),
        rotation,
        scale.set(0.08, 0.08, length),
      );
      arms.current?.setMatrixAt(i, matrix);

      // glowing head
      matrix.compose(
        position.set(lamp.head.x, lamp.head.y - 0.06, lamp.head.z),
        rotation,
        scale.set(0.45, 0.12, 0.8),
      );
      heads.current?.setMatrixAt(i, matrix);
      // Lit materials expect linear colour; the halo and pool shaders output the values as written.
      colour
        .setRGB(lamp.color[0], lamp.color[1], lamp.color[2], SRGBColorSpace)
        .multiplyScalar(1.4 * Math.max(lamp.intensity, 0.35));
      heads.current?.setColorAt(i, colour);

      // halo: a camera-facing glow around the head
      const haloSize = HALO_SIZE[lamp.type] * (0.6 + 0.4 * lamp.intensity);
      matrix.compose(position.copy(lamp.head), rotation.identity(), scale.setScalar(haloSize));
      halos.current?.setMatrixAt(i, matrix);
      colour.setRGB(...lamp.color);
      halos.current?.setColorAt(i, colour);

      // pool: a soft patch of light on the snow below the head
      const radius = lamp.height * 1.7;
      matrix.compose(
        position.set(lamp.head.x, 0.07, lamp.head.z),
        flat,
        scale.setScalar(radius * 2 * (0.55 + 0.45 * lamp.intensity)),
      );
      pools.current?.setMatrixAt(i, matrix);
      pools.current?.setColorAt(i, colour);
    });

    for (const mesh of [poles, arms, heads, halos, pools]) {
      const instanced = mesh.current;
      if (!instanced) continue;
      instanced.instanceMatrix.needsUpdate = true;
      if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true;
    }
  }, []);

  const count = lamps.length;
  return (
    <group>
      <instancedMesh ref={poles} args={[undefined, undefined, count]} frustumCulled={false}>
        <cylinderGeometry args={[0.07, 0.1, 1, 8]} />
        <meshStandardMaterial color="#14181f" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={arms} args={[undefined, undefined, count]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#14181f" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, undefined, count]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh
        ref={halos}
        args={[undefined, undefined, count]}
        frustumCulled={false}
        renderOrder={2}
        material={haloMaterial}
      >
        <planeGeometry args={[1, 1]} />
      </instancedMesh>
      <instancedMesh
        ref={pools}
        args={[undefined, undefined, count]}
        frustumCulled={false}
        renderOrder={1}
        material={poolMaterial}
      >
        <planeGeometry args={[1, 1]} />
      </instancedMesh>
    </group>
  );
}
