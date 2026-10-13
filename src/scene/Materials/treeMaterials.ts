import {
  Color,
  DoubleSide,
  MeshStandardMaterial,
  type Texture,
  type WebGLProgramParametersWithUniforms,
} from 'three';
import { world } from '@/lib/palette';
import { MAX_LAMPS, lampUniforms } from '../lampUniforms';
import { surfaceUniforms } from './surfaceUniforms';

type Shader = WebGLProgramParametersWithUniforms;

function replace(shader: string, token: string, replacement: string): string {
  if (!shader.includes(token)) throw new Error(`Shader chunk not found: ${token}`);
  return shader.replace(token, replacement);
}

// The lamps are sprites, not real lights, so trees are lit by them here: each of the nearest
// lamps and the headlights lights a surface inside its cone, falling off with distance and with
// how much the surface faces the lamp. Added as emissive so it works with any material.
export const LAMP_LIGHT = /* glsl */ `
  uniform vec4 uLampPos[${MAX_LAMPS}];
  uniform vec4 uLampDir[${MAX_LAMPS}];
  uniform vec3 uLampCol[${MAX_LAMPS}];

  vec3 lampLight(vec3 p, vec3 n) {
    vec3 sum = vec3(0.0);
    for (int i = 0; i < ${MAX_LAMPS}; i++) {
      vec3 d = uLampPos[i].xyz - p;
      float len = max(length(d), 0.001);
      vec3 toLamp = d / len;
      float range = uLampPos[i].w;
      float inCone = dot(-toLamp, uLampDir[i].xyz);
      float cone = smoothstep(uLampDir[i].w, mix(uLampDir[i].w, 1.0, 0.5), inCone);
      float reach = 1.0 - smoothstep(0.5 * range, range, len);
      float falloff = 1.0 / (1.0 + 0.02 * len * len);
      float facing = 0.35 + 0.65 * max(dot(n, toLamp), 0.0);
      sum += uLampCol[i] * cone * reach * falloff * facing;
    }
    return sum;
  }
`;

interface TreeShaderOptions {
  /** How strongly upward-facing surfaces take on snow, 0..1. */
  snow: number;
  /** Multiplier on the lamp light. */
  lampGain: number;
}

/** Adds lamp light and a snow dusting on upward-facing surfaces to a standard material. */
export function patchTreeMaterial(
  material: MeshStandardMaterial,
  options: TreeShaderOptions,
  key: string,
) {
  material.onBeforeCompile = (shader: Shader) => {
    shader.uniforms.uSnowTint = { value: new Color(world.snow) };
    shader.uniforms.uSnowAmount = { value: options.snow };
    shader.uniforms.uLampGain = { value: options.lampGain };
    shader.uniforms.uGlow = surfaceUniforms.uGlow;
    Object.assign(shader.uniforms, lampUniforms);

    shader.vertexShader = replace(
      shader.vertexShader,
      '#include <common>',
      '#include <common>\nvarying vec3 vTreeWorld;',
    );
    shader.vertexShader = replace(
      shader.vertexShader,
      '#include <begin_vertex>',
      `#include <begin_vertex>
       vec4 treeWorld = modelMatrix * vec4(transformed, 1.0);
       #ifdef USE_INSTANCING
         treeWorld = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
       #endif
       vTreeWorld = treeWorld.xyz;`,
    );

    shader.fragmentShader = replace(
      shader.fragmentShader,
      '#include <common>',
      `#include <common>
       varying vec3 vTreeWorld;
       uniform vec3 uSnowTint;
       uniform float uSnowAmount;
       uniform float uLampGain;
       uniform vec3 uGlow;
       ${LAMP_LIGHT}`,
    );
    // Upward-facing surfaces blend toward snow.
    shader.fragmentShader = replace(
      shader.fragmentShader,
      '#include <normal_fragment_maps>',
      `#include <normal_fragment_maps>
       vec3 treeNormal = inverseTransformDirection(normal, viewMatrix);
       float snowUp = smoothstep(0.3, 0.75, treeNormal.y) * uSnowAmount;
       diffuseColor.rgb = mix(diffuseColor.rgb, uSnowTint * 0.85, snowUp);`,
    );
    shader.fragmentShader = replace(
      shader.fragmentShader,
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
       totalEmissiveRadiance += diffuseColor.rgb * (uGlow * snowUp
         + lampLight(vTreeWorld, treeNormal) * uLampGain);`,
    );
  };
  material.customProgramCacheKey = () => key;
}

/**
 * Bark: dark grey-brown (never pure black) from vertex colours, lit by the nearest lamps and the
 * headlights, with a snow dusting on upward-facing surfaces.
 */
export function createBarkMaterial(): MeshStandardMaterial {
  const material = new MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
  patchTreeMaterial(material, { snow: 0.95, lampGain: 2.4 }, 'tree-bark');
  return material;
}

/**
 * Twigs: small crossed planes with a soft alpha map. Alpha-to-coverage with mipmapped alpha gives
 * smooth edges instead of hard pixelated ones. Lit by the lamps; only a light snow dusting.
 */
export function createTwigMaterial(alphaMap: Texture): MeshStandardMaterial {
  const material = new MeshStandardMaterial({
    color: new Color(world.bark).multiplyScalar(1.15),
    alphaMap,
    alphaTest: 0.3,
    alphaToCoverage: true,
    side: DoubleSide,
    roughness: 1,
    metalness: 0,
  });
  patchTreeMaterial(material, { snow: 0.35, lampGain: 2.4 }, 'tree-twig');
  return material;
}
