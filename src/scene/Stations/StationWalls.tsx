import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { AdditiveBlending, ShaderMaterial, type Mesh } from 'three';
import { GlowUniform } from '../Landmarks/landmarkMaterials';
import { stationFrames } from './stationFrames';
import { stationView } from './stationView';

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// A soft rectangle of headlight on the wall: bright in the middle, fading to nothing at the edge.
// Added on top of the wall, so it shows on every quality tier, with or without bloom.
const fragment = /* glsl */ `
  uniform float uGlow;
  varying vec2 vUv;
  void main() {
    vec2 d = abs(vUv - 0.5) * 2.0;
    float edge = 1.0 - smoothstep(0.55, 1.0, max(d.x, d.y));
    float hot = 1.0 - 0.45 * length(d);
    float a = edge * hot * uGlow;
    gl_FragColor = vec4(vec3(1.0, 0.9, 0.7) * a, a * 0.5);
  }
`;

/** How far the lit area reaches past the content rectangle, and how far it stands off the wall. */
const SPREAD = 1.3;
const STAND_OFF = 0.06;

/**
 * The lit area on the wall of each station: one soft additive rectangle in front of the wall,
 * brightening with the headlights as the car parks. Only the station the car is at is lit, and the
 * mesh is hidden otherwise. One draw call per station, and only while it is lit.
 */
export function StationWalls() {
  const glow = useMemo(() => new GlowUniform(), []);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: { uGlow: glow },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
      }),
    [glow],
  );
  useEffect(() => () => material.dispose(), [material]);

  const meshes = useRef<(Mesh | null)[]>([]);
  useFrame(() => {
    glow.set(stationView.glow);
    meshes.current.forEach((mesh, i) => {
      if (mesh) mesh.visible = stationView.glow > 0.001 && stationView.station === i;
    });
  });

  return (
    <group>
      {stationFrames.map((frame, i) => {
        const { wall } = frame.geometry;
        return (
          <mesh
            key={frame.station.id}
            ref={(mesh) => {
              meshes.current[i] = mesh;
            }}
            position={[
              wall.centre.x + wall.normal.x * STAND_OFF,
              wall.centre.y,
              wall.centre.z + wall.normal.z * STAND_OFF,
            ]}
            rotation={[0, Math.atan2(wall.normal.x, wall.normal.z), 0]}
            material={material}
            visible={false}
            renderOrder={3}
            frustumCulled={false}
          >
            <planeGeometry args={[wall.width * SPREAD, wall.height * SPREAD]} />
          </mesh>
        );
      })}
    </group>
  );
}
