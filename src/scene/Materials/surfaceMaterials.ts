import {
  Color,
  MeshStandardMaterial,
  type Texture,
  type WebGLProgramParametersWithUniforms,
} from 'three';
import { world } from '@/lib/palette';
import { surfaceUniforms } from './surfaceUniforms';
import type { SurfaceTextures } from './useSurfaceTextures';

// Snow is sampled in world space at two scales (one rotated) and blended with a slowly varying
// mix, so the footprint-like marks in the snow_02 tile never visibly repeat. The result is also
// pulled toward its average to soften those marks. Returns roughly 0.5 grey on average (linear).
const SNOW_SAMPLE = /* glsl */ `
  vec3 snowSample(sampler2D tex, vec2 p) {
    vec2 a = p * 0.23;
    vec2 b = mat2(0.8, -0.6, 0.6, 0.8) * p * 0.071 + vec2(0.37, 0.61);
    vec3 s = mix(texture2D(tex, a).rgb, texture2D(tex, b).rgb,
                 0.25 + 0.5 * (0.5 + 0.5 * sin(dot(p, vec2(0.05, 0.037)))));
    return mix(vec3(0.5), s, 0.7);
  }
`;

// Where the wheels run: two ruts per lane, meandering a little, in patches, with packed snow on
// the ridge between them and at the edges. 1 = rut, 0 = snow.
// `r` is (lateral offset m, distance along m, half the road width m).
const RUT_MASK = /* glsl */ `
  float rutMask(vec3 r) {
    float width = r.z * 2.0;
    float lanes = max(2.0, floor(width / 3.6 + 0.5));
    float laneW = width / lanes;
    float x = r.x + r.z;
    float inLane = mod(x, laneW) - 0.5 * laneW;
    inLane += 0.14 * sin(r.y * 0.21 + r.x * 1.7) + 0.08 * sin(r.y * 0.063);
    float d = abs(abs(inLane) - 0.85);
    float rut = 1.0 - smoothstep(0.16, 0.5, d);
    float patchy = 0.78 + 0.22 * sin(r.y * 0.37 + 1.3) * sin(r.y * 0.11 + r.x);
    float edge = smoothstep(r.z - 1.7, r.z - 0.6, abs(r.x));
    return rut * patchy * (1.0 - edge);
  }
`;

const linear = (hex: string) => new Color(hex);

type Shader = WebGLProgramParametersWithUniforms;

function replace(shader: string, token: string, replacement: string): string {
  if (!shader.includes(token)) throw new Error(`Shader chunk not found: ${token}`);
  return shader.replace(token, replacement);
}

/**
 * Road: asphalt (colour, normal, roughness, tiled in metres) in the wheel ruts, snow on the ridges
 * and edges. On the low tier there is only a colour map, so ruts are just darker.
 */
export function createRoadMaterial(textures: SurfaceTextures): MeshStandardMaterial {
  const material = new MeshStandardMaterial({
    map: textures.roadMap,
    normalMap: textures.roadNormal ?? null,
    roughnessMap: textures.roadRough ?? null,
    roughness: 1,
    metalness: 0,
  });
  material.normalScale.set(0.7, 0.7);
  const snow = textures.snowMap as Texture;
  material.onBeforeCompile = (shader: Shader) => {
    shader.uniforms.uSnowMap = { value: snow };
    shader.uniforms.uSnowTint = { value: linear(world.snow) };
    shader.uniforms.uRutTint = { value: linear('#9a9a9e') };
    shader.uniforms.uGlow = surfaceUniforms.uGlow;

    shader.vertexShader = replace(
      shader.vertexShader,
      '#include <common>',
      '#include <common>\nattribute vec3 aRoad;\nvarying vec3 vRoad;',
    );
    shader.vertexShader = replace(
      shader.vertexShader,
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvRoad = aRoad;',
    );

    shader.fragmentShader = replace(
      shader.fragmentShader,
      '#include <common>',
      `#include <common>
       varying vec3 vRoad;
       uniform sampler2D uSnowMap;
       uniform vec3 uSnowTint;
       uniform vec3 uRutTint;
       uniform vec3 uGlow;
       ${SNOW_SAMPLE}
       ${RUT_MASK}`,
    );
    shader.fragmentShader = replace(
      shader.fragmentShader,
      '#include <map_fragment>',
      `#include <map_fragment>
       float rut = rutMask(vRoad);
       vec3 snowAlbedo = snowSample(uSnowMap, vMapUv) * 2.0 * uSnowTint;
       diffuseColor.rgb = mix(snowAlbedo, diffuseColor.rgb * uRutTint, rut);`,
    );
    shader.fragmentShader = replace(
      shader.fragmentShader,
      '#include <roughnessmap_fragment>',
      '#include <roughnessmap_fragment>\nroughnessFactor = mix(0.95, roughnessFactor, rut);',
    );
    shader.fragmentShader = replace(
      shader.fragmentShader,
      '#include <normal_fragment_maps>',
      // Fade the bump with distance: at grazing angles it aliases into sparkle under lamp light.
      `#include <normal_fragment_maps>
       float bumpFade = 1.0 - smoothstep(10.0, 38.0, length(vViewPosition));
       normal = normalize(mix(nonPerturbedNormal, normal, rut * bumpFade));`,
    );
    shader.fragmentShader = replace(
      shader.fragmentShader,
      '#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * uGlow;',
    );
  };
  material.customProgramCacheKey = () => `road-surface-${textures.roadNormal ? 'pbr' : 'flat'}`;
  return material;
}

interface SnowOptions {
  /** 0..1: how much grime darkens the snow near the ground (banks beside the road). */
  dirt: number;
}

/**
 * Snow for the ground and the snowbanks: world-space two-scale snow_02, with optional grime near
 * the ground.
 */
export function createSnowMaterial(
  textures: SurfaceTextures,
  { dirt }: SnowOptions,
): MeshStandardMaterial {
  const material = new MeshStandardMaterial({ color: '#ffffff', roughness: 0.95, metalness: 0 });
  const snow = textures.snowMap as Texture;
  const rough = textures.snowRough as Texture | undefined;
  material.onBeforeCompile = (shader: Shader) => {
    shader.uniforms.uSnowMap = { value: snow };
    shader.uniforms.uSnowTint = { value: linear(world.snow) };
    shader.uniforms.uDirtColor = { value: linear('#9a948f') };
    shader.uniforms.uDirtAmount = { value: dirt };
    shader.uniforms.uGlow = surfaceUniforms.uGlow;
    if (rough) shader.uniforms.uSnowRough = { value: rough };

    shader.vertexShader = replace(
      shader.vertexShader,
      '#include <common>',
      '#include <common>\nvarying vec3 vSnowWorld;',
    );
    shader.vertexShader = replace(
      shader.vertexShader,
      '#include <begin_vertex>',
      `#include <begin_vertex>
       vec4 snowWorld = modelMatrix * vec4(transformed, 1.0);
       #ifdef USE_INSTANCING
         snowWorld = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
       #endif
       vSnowWorld = snowWorld.xyz;`,
    );

    shader.fragmentShader = replace(
      shader.fragmentShader,
      '#include <common>',
      `#include <common>
       varying vec3 vSnowWorld;
       uniform sampler2D uSnowMap;
       uniform vec3 uSnowTint;
       uniform vec3 uDirtColor;
       uniform float uDirtAmount;
       uniform vec3 uGlow;
       ${rough ? 'uniform sampler2D uSnowRough;' : ''}
       ${SNOW_SAMPLE}`,
    );
    shader.fragmentShader = replace(
      shader.fragmentShader,
      '#include <map_fragment>',
      `vec3 snowAlbedo = snowSample(uSnowMap, vSnowWorld.xz) * 2.0 * uSnowTint;
       float grime = (1.0 - smoothstep(0.02, 0.5, vSnowWorld.y)) * uDirtAmount;
       diffuseColor.rgb = mix(snowAlbedo, snowAlbedo * uDirtColor * 2.0, grime);`,
    );
    if (rough) {
      shader.fragmentShader = replace(
        shader.fragmentShader,
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
         roughnessFactor = mix(0.95, texture2D(uSnowRough, vSnowWorld.xz * 0.23).g, 0.5);`,
      );
    }
    shader.fragmentShader = replace(
      shader.fragmentShader,
      '#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * uGlow;',
    );
  };
  material.customProgramCacheKey = () =>
    `snow-surface-${rough ? 'rough' : 'flat'}-${dirt > 0 ? 'dirty' : 'clean'}`;
  return material;
}
