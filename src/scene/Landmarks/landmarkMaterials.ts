import {
  Color,
  MeshBasicMaterial,
  MeshStandardMaterial,
  type Texture,
  type WebGLProgramParametersWithUniforms,
} from 'three';
import { world } from '@/lib/palette';
import { lampUniforms } from '../lampUniforms';
import { surfaceUniforms } from '../Materials/surfaceUniforms';
import { LAMP_LIGHT } from '../Materials/treeMaterials';

type Shader = WebGLProgramParametersWithUniforms;

/**
 * A shared glow value: 0 (idle) to 1 (the car is at the stop). Written once per frame through
 * `set` and read by shaders as a uniform. A small class keeps the per-frame write out of React
 * state and memoised values.
 */
export class GlowUniform {
  value = 0;
  set(next: number): void {
    this.value = next;
  }
}

function replace(shader: string, token: string, replacement: string): string {
  if (!shader.includes(token)) throw new Error(`Shader chunk not found: ${token}`);
  return shader.replace(token, replacement);
}

/** How a wall draws its windows. Distances are in metres. */
export interface GridWall {
  /** Width of one bay, height of one storey, and height of the plinth below the first row. */
  bay: number;
  storey: number;
  plinth: number;
  /** `glass`: panes divided by mullions. `windows`: separate windows set in a solid wall. */
  mode: 'glass' | 'windows';
  /** Mullion width (glass mode), in metres. */
  mullion: number;
  /** The share of the bay and storey a window fills (windows mode). */
  fill: [number, number];
  /** Chance that a glass bay has a cross of mullions through it. */
  cross: number;
  /** Chance that a pane or window is lit warm, and lit cool. */
  warm: number;
  cool: number;
  /** Brightness of the lit panes when idle, and the overall gain at full glow. */
  idle: number;
  gain: number;
  /** Colour of the frame between panes (glass mode). */
  frame: string;
}

const WALL_VERTEX_DECLARE = /* glsl */ `
  varying vec2 vWall;
  varying vec3 vWallNormal;
  varying vec3 vWallWorld;
`;

const WALL_FRAGMENT_DECLARE = /* glsl */ `
  varying vec2 vWall;
  varying vec3 vWallNormal;
  varying vec3 vWallWorld;
  uniform float uGlow;
  uniform vec3 uGlowSky;
  uniform vec3 uWarm;
  uniform vec3 uCool;
  uniform vec3 uFrame;
  uniform vec4 uGrid;     // bay, storey, plinth, mode (0 glass, 1 windows)
  uniform vec4 uShape;    // mullion, fill x, fill y, cross chance
  uniform vec4 uLit;      // warm chance, cool chance, idle, gain
  ${LAMP_LIGHT}

  float wallHash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
`;

// Walls: a grid in real metres drawn from the box uv. Glass walls are panes divided by dark
// mullions (some bays with a cross through them); stone and brick walls have separate windows.
// Each pane rolls once for lit or dark, warm or cool, so the pattern never changes.
const WALL_DIFFUSE = /* glsl */ `
  vec2 cellUv = vec2(vWall.x / uGrid.x, (vWall.y - uGrid.z) / uGrid.y);
  vec2 cell = floor(cellUv);
  vec2 inCell = fract(cellUv);
  vec2 metres = inCell * vec2(uGrid.x, uGrid.y);

  // Glass: a pane inside a mullion frame, sometimes with a vertical and a horizontal bar.
  float insideX = step(uShape.x, metres.x) * step(metres.x, uGrid.x - uShape.x);
  float insideY = step(uShape.x, metres.y) * step(metres.y, uGrid.y - uShape.x);
  float crossBay = step(wallHash(cell + 7.0), uShape.w);
  float barX = 1.0 - crossBay * step(abs(metres.x - uGrid.x * 0.5), uShape.x * 0.6);
  float barY = 1.0 - crossBay * step(wallHash(cell + 3.0), 0.5)
    * step(abs(metres.y - uGrid.y * 0.5), uShape.x * 0.6);
  float glassPane = insideX * insideY * barX * barY;
  // Windows: a rectangle in the middle of the bay.
  vec2 off = abs(inCell - 0.5);
  float windowPane = step(off.x, uShape.y * 0.5) * step(off.y, uShape.z * 0.5);
  float pane = mix(glassPane, windowPane, uGrid.w);

  // Only walls count, and only above the plinth.
  pane *= step(0.0, cell.y) * step(abs(vWallNormal.y), 0.5);

  float roll = wallHash(cell + vec2(11.0, 5.0));
  float warmOn = step(roll, uLit.x);
  float coolOn = (1.0 - warmOn) * step(roll, uLit.x + uLit.y);
  float lit = warmOn + coolOn;
  float tone = 0.6 + 0.4 * wallHash(cell + 2.5);
  float level = mix(uLit.z, 1.0, uGlow) * uLit.w;
  vec3 paneLight = (uWarm * warmOn + uCool * coolOn) * tone * level * pane;

  // Between panes a glass wall shows its frame colour; an unlit pane is dark glass.
  vec3 outside = mix(uFrame, diffuseColor.rgb, uGrid.w);
  diffuseColor.rgb = mix(outside, diffuseColor.rgb, pane);
  diffuseColor.rgb *= mix(1.0, 0.45, pane * (1.0 - lit));
`;

/**
 * A wall for the campus and its neighbours: a window grid in metres drawn from the box uv, with a
 * glow that rises as the car nears the stop (`glow`). Also lit by the nearest lamps and headlights.
 * The geometry needs metre uvs (see metricBox) and object-space normals.
 */
export function createGridWallMaterial(
  grid: GridWall,
  glow: GlowUniform,
  baseColour: string,
  vertexColours = false,
): MeshStandardMaterial {
  const material = new MeshStandardMaterial({
    color: baseColour,
    roughness: 0.85,
    metalness: 0,
    vertexColors: vertexColours,
  });
  material.onBeforeCompile = (shader: Shader) => {
    shader.uniforms.uGlow = glow;
    shader.uniforms.uGlowSky = surfaceUniforms.uGlow;
    shader.uniforms.uWarm = { value: new Color(world.windowWarm).multiplyScalar(2.2) };
    shader.uniforms.uCool = { value: new Color(world.windowCool).multiplyScalar(1.9) };
    shader.uniforms.uFrame = { value: new Color(grid.frame) };
    shader.uniforms.uGrid = {
      value: [grid.bay, grid.storey, grid.plinth, grid.mode === 'windows' ? 1 : 0],
    };
    shader.uniforms.uShape = {
      value: [grid.mullion, grid.fill[0], grid.fill[1], grid.cross],
    };
    shader.uniforms.uLit = { value: [grid.warm, grid.cool, grid.idle, grid.gain] };
    Object.assign(shader.uniforms, lampUniforms);

    shader.vertexShader = replace(
      shader.vertexShader,
      '#include <common>',
      `#include <common>\n${WALL_VERTEX_DECLARE}`,
    );
    shader.vertexShader = replace(
      shader.vertexShader,
      '#include <begin_vertex>',
      `#include <begin_vertex>
       vWall = uv;
       vWallNormal = normal;
       vWallWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
    );
    shader.fragmentShader = replace(
      shader.fragmentShader,
      '#include <common>',
      `#include <common>\n${WALL_FRAGMENT_DECLARE}`,
    );
    shader.fragmentShader = replace(
      shader.fragmentShader,
      '#include <color_fragment>',
      `#include <color_fragment>\n${WALL_DIFFUSE}`,
    );
    shader.fragmentShader = replace(
      shader.fragmentShader,
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
       vec3 wallNormal = inverseTransformDirection(normal, viewMatrix);
       totalEmissiveRadiance += paneLight
         + diffuseColor.rgb * (uGlowSky * 1.2 + lampLight(vWallWorld, wallNormal) * 1.3);`,
    );
  };
  material.customProgramCacheKey = () => `landmark-wall-${grid.mode}-${grid.bay}-${vertexColours}`;
  return material;
}

/** The campus curtain wall: blue-green glass in a strict grid with dark mullions. */
export function createCurtainWallMaterial(glow: GlowUniform): MeshStandardMaterial {
  return createGridWallMaterial(
    {
      bay: 2.6,
      storey: 3.8,
      plinth: 0,
      mode: 'glass',
      mullion: 0.12,
      fill: [0.5, 0.5],
      cross: 0.55,
      warm: 0.3,
      cool: 0.4,
      idle: 0.28,
      gain: 0.55,
      frame: world.mullion,
    },
    glow,
    world.glassGlow,
  );
}

/** The cream limestone neighbour: tall windows, lit warm by the street lamps. */
export function createLimestoneMaterial(glow: GlowUniform): MeshStandardMaterial {
  return createGridWallMaterial(
    {
      bay: 3,
      storey: 3.6,
      plinth: 0,
      mode: 'windows',
      mullion: 0,
      fill: [0.42, 0.62],
      cross: 0,
      warm: 0.45,
      cool: 0,
      idle: 0.45,
      gain: 0.9,
      frame: world.limestone,
    },
    glow,
    world.limestone,
  );
}

/** The red-brick neighbour: dark brick with a few dim windows and a faded sign patch. */
export function createBrickNeighbourMaterial(glow: GlowUniform): MeshStandardMaterial {
  return createGridWallMaterial(
    {
      bay: 3.4,
      storey: 3.6,
      plinth: 0,
      mode: 'windows',
      mullion: 0,
      fill: [0.4, 0.55],
      cross: 0,
      warm: 0.2,
      cool: 0.05,
      idle: 0.5,
      gain: 0.8,
      frame: world.brickNight,
    },
    glow,
    world.brickNight,
    true,
  );
}

/** Dark steel for the sign frame. */
export function createSteelMaterial(): MeshStandardMaterial {
  return new MeshStandardMaterial({ color: world.signalPole, roughness: 0.8, metalness: 0.2 });
}

/**
 * The printed-heritage panel: the drawing is both the colour and the emission, so it glows from
 * inside. `update` sets its brightness from the landmark glow each frame.
 */
export function createHeritagePanelMaterial(map: Texture) {
  const material = new MeshStandardMaterial({
    map,
    emissiveMap: map,
    emissive: '#ffffff',
    emissiveIntensity: 0.35,
    roughness: 0.4,
    metalness: 0,
  });
  return {
    material,
    update: (glow: number) => {
      material.emissiveIntensity = 0.3 + 0.8 * glow;
    },
  };
}

/** The rooftop lettering: unlit, brighter than 1 at full glow so the bloom pass picks it up. */
export function createRooftopSignMaterial(map: Texture) {
  const material = new MeshBasicMaterial({
    map,
    transparent: true,
    alphaTest: 0.2,
    toneMapped: false,
  });
  return {
    material,
    update: (glow: number) => {
      material.color.setScalar(0.45 + 1.9 * glow);
    },
  };
}
