import { useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  BufferAttribute,
  BufferGeometry,
  MathUtils,
  ShaderMaterial,
  Vector2,
  Vector3,
  type PerspectiveCamera,
  type Points,
} from 'three';
import type { QualityTier } from '@/lib/quality';
import {
  MID_LAYER_MAX,
  NEAR_LAYER_MAX,
  REDUCED_MOTION_SNOW,
  SNOW_PARTICLES,
  createSnowAttributes,
  snowCount,
} from '@/lib/snow';
import { atmosphere } from '../atmosphere';
import { MAX_LAMPS, lampUniforms } from '../lampUniforms';

const SEED = 1949;

/** Size of the box of snow that follows the camera, in metres. */
const BOX = new Vector3(40, 24, 40);
const WIND_DIRECTION = new Vector2(Math.cos(0.6), Math.sin(0.6));
/** Sideways drift of the middle layer at full wind, in metres per second. */
const MAX_WIND_SPEED = 6;

const vertexShader = /* glsl */ `
  #define MAX_LAMPS ${MAX_LAMPS}
  #define NEAR_MAX ${NEAR_LAYER_MAX.toFixed(3)}
  #define MID_MAX ${MID_LAYER_MAX.toFixed(3)}

  uniform float uTime;
  uniform float uSpeed;
  uniform float uDensity;
  uniform float uGust;
  uniform float uPixelScale;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform vec3 uCamPos;
  uniform vec3 uBox;
  uniform vec3 uAmbient;
  uniform vec2 uWindOffset;
  uniform vec4 uLampPos[MAX_LAMPS];
  uniform vec4 uLampDir[MAX_LAMPS];
  uniform vec3 uLampCol[MAX_LAMPS];

  attribute vec4 aSeed;
  attribute vec4 aMisc;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vSoft;

  void main() {
    // Depth layer: near flakes are big, soft and fast; far flakes are small and slow.
    float layer = aMisc.w;
    float isNear = step(layer, NEAR_MAX);
    float isMid = step(layer, MID_MAX) - isNear;
    float isFar = 1.0 - isNear - isMid;

    float size = isNear * mix(0.18, 0.38, aMisc.y)
               + isMid  * mix(0.05, 0.1, aMisc.y)
               + isFar  * mix(0.022, 0.045, aMisc.y);
    float fall = (isNear * 2.4 + isMid * 1.6 + isFar * 0.9) * (0.8 + 0.4 * aMisc.z) * uSpeed;
    float drift = isNear * 1.3 + isMid * 1.0 + isFar * 0.7;

    // All motion happens here: fall, accumulated wind, gust sway and flutter.
    vec3 p = aSeed.xyz * uBox;
    p.y -= fall * uTime;
    p.xz += uWindOffset * drift;
    float gust = uGust * 0.6 * (sin(uTime * 0.7 + aSeed.w * 6.2831 + p.z * 0.04)
                              + 0.6 * sin(uTime * 1.9 + aSeed.x * 12.0));
    p.x += gust * drift;
    p.z += gust * 0.5 * drift;
    p.x += sin(uTime * (1.0 + aMisc.z) + aSeed.w * 40.0) * 0.12;
    p.z += cos(uTime * (0.8 + aMisc.x) + aSeed.z * 40.0) * 0.12;

    // Wrap into a box that follows the camera.
    vec3 rel = mod(p - uCamPos + 0.5 * uBox, uBox) - 0.5 * uBox;
    vec3 world = uCamPos + rel;
    vec4 mv = viewMatrix * vec4(world, 1.0);

    float dist = length(rel);
    vec3 e = abs(rel) / (0.5 * uBox);
    float edge = 1.0 - smoothstep(0.72, 1.0, max(e.x, max(e.y, e.z)));
    float fogFade = 1.0 - smoothstep(uFogNear, uFogFar, dist);

    gl_PointSize = clamp(size * uPixelScale / max(-mv.z, 0.1), 1.0, 64.0);

    // Flakes brighten inside the light cone of a lamp or headlight.
    vec3 col = vec3(0.42, 0.46, 0.54) * mix(0.6, 1.0, aMisc.y) + uAmbient;
    float spark = 0.45 + 0.9 * aMisc.y;
    float lampLit = 0.0;
    for (int i = 0; i < MAX_LAMPS; i++) {
      vec3 d = world - uLampPos[i].xyz;
      float len = max(length(d), 0.001);
      float range = uLampPos[i].w;
      float cone = smoothstep(uLampDir[i].w, mix(uLampDir[i].w, 1.0, 0.5), dot(d / len, uLampDir[i].xyz));
      float reach = 1.0 - smoothstep(0.5 * range, range, len);
      float glow = smoothstep(3.6, 0.2, len);
      float lit = (cone * reach + glow * 0.8) * spark;
      col += uLampCol[i] * lit;
      lampLit += lit * dot(uLampCol[i], vec3(0.33));
    }

    float on = step(aMisc.x, uDensity);
    float brightness = mix(0.6, 1.0, aMisc.y);
    float layerAlpha = isNear * 0.45 + isMid * 0.75 + isFar * 0.85;

    vColor = col;
    // Flakes inside a light cone are also more opaque, so they stand out against the dark.
    vAlpha = clamp(on * edge * fogFade * brightness * layerAlpha * (1.0 + 1.1 * clamp(lampLit, 0.0, 1.0)), 0.0, 1.0);
    vSoft = isNear * 0.95 + isMid * 0.55 + isFar * 0.3;

    gl_Position = projectionMatrix * mv;
    if (on < 0.5) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vSoft;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float shape = 1.0 - smoothstep(1.0 - vSoft, 1.0, d);
    float a = shape * vAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor, a);
  }
`;

// One snowfall exists at a time, so its uniforms live at module level: per-frame writes stay out
// of React state and out of the memoised material.
const uniforms = {
  uTime: { value: 0 },
  uSpeed: { value: 1 },
  uDensity: { value: 1 },
  uGust: { value: 0 },
  uPixelScale: { value: 500 },
  uFogNear: { value: 20 },
  uFogFar: { value: 150 },
  uCamPos: { value: new Vector3() },
  uBox: { value: BOX },
  uAmbient: { value: new Vector3() },
  uWindOffset: { value: new Vector2() },
  ...lampUniforms,
};

/**
 * Falling snow: a single GPU particle system (one draw call). Flakes are positioned and animated
 * entirely in the vertex shader from per-flake random attributes, so nothing is updated per flake
 * on the CPU. Density, wind and gusts come from the blended zone data; the number of flakes comes
 * from the quality tier. Flakes brighten inside the cones of the nearest lamps and the headlights.
 */
export function Snow({ tier, reducedMotion }: { tier: QualityTier; reducedMotion: boolean }) {
  const points = useRef<Points>(null);

  const geometry = useMemo(() => {
    const total = SNOW_PARTICLES[tier];
    const { seeds, misc } = createSnowAttributes(total, SEED);
    const g = new BufferGeometry();
    // A position attribute is required to size the draw; the shader positions flakes itself.
    g.setAttribute('position', new BufferAttribute(new Float32Array(total * 3), 3));
    g.setAttribute('aSeed', new BufferAttribute(seeds, 4));
    g.setAttribute('aMisc', new BufferAttribute(misc, 4));
    return g;
  }, [tier]);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
        transparent: true,
        depthWrite: false,
      }),
    [],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  // Reduced motion draws only a prefix of the (randomly ordered) flakes.
  const drawn = snowCount(tier, reducedMotion);
  useLayoutEffect(() => {
    points.current?.geometry.setDrawRange(0, drawn);
  }, [geometry, drawn]);

  useFrame((state, delta) => {
    // No snow in this zone (the clear avenue): skip the draw entirely.
    if (points.current) points.current.visible = atmosphere.snowDensity > 0.002;
    const dt = Math.min(delta, 0.1);
    const speed = reducedMotion ? REDUCED_MOTION_SNOW.speedFactor : 1;
    const camera = state.camera as PerspectiveCamera;

    uniforms.uTime.value += dt;
    uniforms.uSpeed.value = speed;
    uniforms.uDensity.value = atmosphere.snowDensity;
    uniforms.uGust.value =
      atmosphere.snowGust * (reducedMotion ? REDUCED_MOTION_SNOW.gustFactor : 1);
    uniforms.uWindOffset.value.addScaledVector(
      WIND_DIRECTION,
      atmosphere.snowWind * MAX_WIND_SPEED * speed * dt,
    );
    uniforms.uPixelScale.value =
      state.gl.domElement.height / (2 * Math.tan(MathUtils.degToRad(camera.fov) / 2));
    uniforms.uFogNear.value = atmosphere.fogNear;
    uniforms.uFogFar.value = atmosphere.fogFar;
    uniforms.uCamPos.value.copy(camera.position);
    uniforms.uAmbient.value
      .set(...atmosphere.ambientColor)
      .multiplyScalar(atmosphere.ambientIntensity * 0.5);
  });

  return (
    <points
      ref={points}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={3}
    />
  );
}
