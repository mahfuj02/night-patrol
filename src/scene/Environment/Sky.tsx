import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { BackSide, Color, ShaderMaterial, SRGBColorSpace, Vector3, type Mesh } from 'three';
import { world } from '@/lib/palette';
import { atmosphere } from '../atmosphere';
import { useRef } from 'react';

const RADIUS = 500;

// Where the moon and the rising sun sit in the sky, as directions from the camera. The moon is
// low and large so it shows above the road ahead on the avenue; the sun is low on the horizon
// ahead at The Forks. Tune by eye.
const MOON_DIRECTION = new Vector3(0.82, 0.2, 0.54).normalize();
const SUN_DIRECTION = new Vector3(0.3, 0.05, 0.95).normalize();

const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uMoonColor;
  uniform vec3 uMoonDir;
  uniform float uMoon;
  uniform vec3 uSunLow;
  uniform vec3 uSunHigh;
  uniform vec3 uSunDir;
  uniform float uSunrise;
  varying vec3 vDir;

  void main() {
    vec3 d = normalize(vDir);
    float h = clamp(d.y, 0.0, 1.0);
    vec3 col = mix(uHorizon, uZenith, pow(h, 0.55));
    if (d.y < 0.0) col = uHorizon;

    // Large low moon: a crisp disc with a soft glow.
    float md = max(dot(d, uMoonDir), 0.0);
    float disc = smoothstep(0.9982, 0.9986, md);
    float glow = pow(md, 120.0) * 0.55 + pow(md, 14.0) * 0.09;
    col += uMoonColor * (disc * 1.15 + glow) * uMoon;

    // Sunrise: a warm band on the horizon toward the sun, with a low disc.
    vec2 flatDir = normalize(d.xz + vec2(1e-5));
    float az = max(dot(flatDir, normalize(uSunDir.xz)), 0.0);
    float band = pow(az, 2.5) * (1.0 - smoothstep(0.0, 0.55, h));
    vec3 sunTone = mix(uSunLow, uSunHigh, smoothstep(0.0, 0.35, h));
    col = mix(col, sunTone, clamp(band, 0.0, 1.0) * uSunrise);
    float sd = max(dot(d, uSunDir), 0.0);
    col += uSunHigh * smoothstep(0.9990, 0.9996, sd) * uSunrise;

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// One sky exists at a time, so its uniforms live at module level: per-frame writes stay out of
// React state and out of the memoised material.
const uniforms = {
  uZenith: { value: new Color() },
  uHorizon: { value: new Color() },
  uMoonColor: { value: new Color(world.moonLow) },
  uMoonDir: { value: MOON_DIRECTION },
  uMoon: { value: 0 },
  uSunLow: { value: new Color(world.sunriseOrange) },
  uSunHigh: { value: new Color(world.sunriseGold) },
  uSunDir: { value: SUN_DIRECTION },
  uSunrise: { value: 0 },
};

const setColor = (target: Color, rgb: readonly [number, number, number]) =>
  target.setRGB(rgb[0], rgb[1], rgb[2], SRGBColorSpace);

/** Gradient sky dome with the moon and sunrise, driven by the blended zone atmosphere. */
export function Sky() {
  const mesh = useRef<Mesh>(null);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        side: BackSide,
        depthWrite: false,
        depthTest: false,
        fog: false,
        uniforms,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);

  useFrame((state) => {
    mesh.current?.position.copy(state.camera.position);
    setColor(uniforms.uZenith.value, atmosphere.skyZenith);
    setColor(uniforms.uHorizon.value, atmosphere.skyHorizon);
    uniforms.uMoon.value = atmosphere.moon;
    uniforms.uSunrise.value = atmosphere.sunrise;
  });

  return (
    <mesh ref={mesh} renderOrder={-1000} frustumCulled={false} material={material}>
      <sphereGeometry args={[RADIUS, 32, 16]} />
    </mesh>
  );
}
