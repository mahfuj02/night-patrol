import {
  Color,
  MeshStandardMaterial,
  ShaderChunk,
  type WebGLProgramParametersWithUniforms,
} from 'three';
import { world } from '@/lib/palette';
import { lampUniforms } from '../lampUniforms';
import { surfaceUniforms } from './surfaceUniforms';
import { LAMP_LIGHT, patchTreeMaterial } from './treeMaterials';
import type { BrickTextures } from './useBrickTextures';

type Shader = WebGLProgramParametersWithUniforms;

function replace(shader: string, token: string, replacement: string): string {
  if (!shader.includes(token)) throw new Error(`Shader chunk not found: ${token}`);
  return shader.replace(token, replacement);
}

/** Average linear luminance of the factory_brick colour map, so the texture only adds detail. */
const BRICK_LUMA = 0.17;
/** Real-world size of one brick tile in metres. */
const BRICK_TILE = 1.5;
const WARM_GAIN = 2.1;
const COOL_GAIN = 1.7;

// One window shader for every building: an emissive grid on the walls, drawn from the metres along
// each face, so there is no texture per building. Per-instance attributes carry the box size, the
// share of windows lit warm and cool, a random seed, and the grid (bay width, floor height, window
// size). Each window rolls once from its cell and the seed, so the pattern never changes.
const WINDOWS_VERTEX_DECLARE = /* glsl */ `
  attribute vec3 aSize;
  attribute vec4 aLit;
  attribute vec4 aGrid;
  varying vec3 vLocal;
  varying vec3 vFace;
  varying vec3 vSize;
  varying vec4 vLit;
  varying vec4 vGrid;
  varying vec3 vBuildingWorld;
`;

const WINDOWS_VERTEX_BODY = /* glsl */ `
  vLocal = (position + vec3(0.5, 0.0, 0.5)) * aSize;
  vFace = normal;
  vSize = aSize;
  vLit = aLit;
  vGrid = aGrid;
  vec4 buildingWorld = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
  vBuildingWorld = buildingWorld.xyz;
`;

const WINDOWS_FRAGMENT_DECLARE = /* glsl */ `
  varying vec3 vLocal;
  varying vec3 vFace;
  varying vec3 vSize;
  varying vec4 vLit;
  varying vec4 vGrid;
  varying vec3 vBuildingWorld;
  uniform sampler2D uBrick;
  uniform vec3 uWarm;
  uniform vec3 uCool;
  uniform vec3 uGlow;
  uniform float uBrickLuma;
  uniform float uBrickTile;
  ${LAMP_LIGHT}

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
`;

const WINDOWS_DIFFUSE = /* glsl */ `
  vec3 faceN = abs(vFace);
  bool isSide = faceN.y < 0.5;
  float faceLen = faceN.x > 0.5 ? vSize.z : vSize.x;
  vec2 wall = vec2(faceN.x > 0.5 ? vLocal.z : vLocal.x, vLocal.y);

  // Brick detail: luminance only, so the instance colour stays in charge of the hue.
  vec3 brick = texture2D(uBrick, wall / uBrickTile).rgb;
  float brickLuma = dot(brick, vec3(0.2126, 0.7152, 0.0722));
  diffuseColor.rgb *= mix(1.0, clamp(brickLuma / uBrickLuma, 0.45, 1.6), vLit.w);

  // Window grid: the first row starts above the ground floor's plinth.
  vec2 cellUv = vec2(wall.x / vGrid.x, (wall.y - 0.7) / vGrid.y);
  vec2 cell = floor(cellUv);
  vec2 inCell = abs(fract(cellUv) - 0.5);
  float windowMask = step(inCell.x, vGrid.z * 0.5) * step(inCell.y, vGrid.w * 0.5);
  windowMask *= step(1.0, wall.x) * step(wall.x, faceLen - 1.0);
  windowMask *= step(0.0, cell.y) * step(0.0, vSize.y - (cell.y + 1.0) * vGrid.y - 0.7);
  windowMask *= isSide ? 1.0 : 0.0;

  // Varyings are interpolated, so round the seed and face (they are whole numbers) before hashing.
  float faceSalt = floor(dot(vFace, vec3(3.0, 0.0, 7.0)) + 0.5);
  float seed = floor(vLit.z + 0.5);
  vec2 windowId = cell + vec2(seed + faceSalt, seed * 0.37);
  float roll = hash21(windowId);
  float tone = 0.65 + 0.35 * hash21(windowId + 9.1);
  float warmOn = step(roll, vLit.x);
  float coolOn = (1.0 - warmOn) * step(roll, vLit.x + vLit.y);
  vec3 windowLight = (uWarm * warmOn + uCool * coolOn) * tone * windowMask;
  // Dark glass where a window is unlit; a lit one keeps a little of the base colour.
  diffuseColor.rgb *= mix(1.0, 0.3, windowMask * (1.0 - warmOn - coolOn));
`;

/**
 * Walls for towers, warehouses, houses and garages. Colour comes from the instance, brick detail
 * from one shared texture, and the lit windows from the grid shader above. Lit by the nearest
 * lamps and the headlights like the trees. Snow on upward faces is left to the roof slabs.
 */
export function createBuildingMaterial(brick: BrickTextures): MeshStandardMaterial {
  const material = new MeshStandardMaterial({
    roughness: 0.92,
    metalness: 0,
    normalMap: brick.normal ?? null,
  });
  material.normalScale.set(0.9, 0.9);
  material.onBeforeCompile = (shader: Shader) => {
    shader.uniforms.uBrick = { value: brick.color };
    shader.uniforms.uBrickLuma = { value: BRICK_LUMA };
    shader.uniforms.uBrickTile = { value: BRICK_TILE };
    shader.uniforms.uWarm = { value: new Color(world.windowWarm).multiplyScalar(WARM_GAIN) };
    shader.uniforms.uCool = { value: new Color(world.windowCool).multiplyScalar(COOL_GAIN) };
    shader.uniforms.uGlow = surfaceUniforms.uGlow;
    Object.assign(shader.uniforms, lampUniforms);

    shader.vertexShader = replace(
      shader.vertexShader,
      '#include <common>',
      `#include <common>\n${WINDOWS_VERTEX_DECLARE}`,
    );
    // The normal map is sampled by metres along each face, like the colour map. The varying is
    // linear along a face, so per-vertex coordinates interpolate exactly.
    shader.vertexShader = replace(
      shader.vertexShader,
      '#include <uv_vertex>',
      `#include <uv_vertex>
       #ifdef USE_NORMALMAP
         vec3 wallLocal = (position + vec3(0.5, 0.0, 0.5)) * aSize;
         vec3 wallFace = abs(normal);
         vec2 wallUv = wallFace.x > 0.5 ? wallLocal.zy : (wallFace.y > 0.5 ? wallLocal.xz : wallLocal.xy);
         vNormalMapUv = wallUv / ${BRICK_TILE.toFixed(2)};
       #endif`,
    );
    shader.vertexShader = replace(
      shader.vertexShader,
      '#include <begin_vertex>',
      `#include <begin_vertex>\n${WINDOWS_VERTEX_BODY}`,
    );
    shader.fragmentShader = replace(
      shader.fragmentShader,
      '#include <common>',
      `#include <common>\n${WINDOWS_FRAGMENT_DECLARE}`,
    );
    // Relief only where the surface is brick-like: scaled per instance by its texture weight.
    shader.fragmentShader = replace(
      shader.fragmentShader,
      '#include <normal_fragment_maps>',
      ShaderChunk.normal_fragment_maps.replace(
        'mapN.xy *= normalScale;',
        'mapN.xy *= normalScale * vLit.w;',
      ),
    );
    shader.fragmentShader = replace(
      shader.fragmentShader,
      '#include <color_fragment>',
      `#include <color_fragment>\n${WINDOWS_DIFFUSE}`,
    );
    shader.fragmentShader = replace(
      shader.fragmentShader,
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
       vec3 buildingNormal = inverseTransformDirection(normal, viewMatrix);
       totalEmissiveRadiance += windowLight
         + diffuseColor.rgb * (uGlow * 1.2 + lampLight(vBuildingWorld, buildingNormal) * 1.3);`,
    );
  };
  material.customProgramCacheKey = () => 'building-walls';
  return material;
}

/** Snow on roofs: flat slabs and gabled roofs. Lit by the lamps, with a snow glow like the ground. */
export function createRoofMaterial(): MeshStandardMaterial {
  const material = new MeshStandardMaterial({
    color: new Color(world.snowRoof),
    roughness: 0.95,
    metalness: 0,
  });
  patchTreeMaterial(material, { snow: 1, lampGain: 1.4 }, 'building-roof');
  // Gable ends are vertical, so they get no snow: darken them toward a wall tone and give them the
  // same sky glow the walls have, or they render black.
  const patched = material.onBeforeCompile.bind(material);
  material.onBeforeCompile = (shader: Shader, renderer) => {
    patched(shader, renderer);
    shader.fragmentShader = replace(
      shader.fragmentShader,
      'diffuseColor.rgb = mix(diffuseColor.rgb, uSnowTint * 0.85, snowUp);',
      `diffuseColor.rgb = mix(diffuseColor.rgb, uSnowTint * 0.85, snowUp);
       diffuseColor.rgb *= mix(0.5, 1.0, smoothstep(0.2, 0.6, treeNormal.y));`,
    );
    shader.fragmentShader = replace(
      shader.fragmentShader,
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
       totalEmissiveRadiance += diffuseColor.rgb * uGlow * 1.2 * (1.0 - snowUp);`,
    );
  };
  material.customProgramCacheKey = () => 'building-roof-gable';
  return material;
}
