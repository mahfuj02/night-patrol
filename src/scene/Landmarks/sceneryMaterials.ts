import { LineBasicMaterial, MeshStandardMaterial } from 'three';
import { world } from '@/lib/palette';
import { createGridWallMaterial } from './landmarkMaterials';
import type { GlowUniform } from './landmarkMaterials';

/** The warm house: cream siding where almost every window is lit warm, and none cool. */
export function createWarmHouseMaterial(glow: GlowUniform): MeshStandardMaterial {
  return createGridWallMaterial(
    {
      bay: 3.2,
      storey: 3.1,
      plinth: 0.5,
      mode: 'windows',
      mullion: 0,
      fill: [0.42, 0.5],
      cross: 0,
      warm: 0.95,
      cool: 0,
      idle: 0.95,
      gain: 0.5,
      frame: world.sidingCream,
    },
    glow,
    world.sidingCream,
  );
}

/** The snow-covered roof of the warm house. */
export function createSnowRoofMaterial(): MeshStandardMaterial {
  return new MeshStandardMaterial({ color: world.snowRoof, roughness: 0.95, metalness: 0 });
}

/** The museum base: pale stone with a few lit windows. */
export function createStoneBaseMaterial(glow: GlowUniform): MeshStandardMaterial {
  return createGridWallMaterial(
    {
      bay: 4.2,
      storey: 4.5,
      plinth: 0,
      mode: 'windows',
      mullion: 0,
      fill: [0.4, 0.55],
      cross: 0,
      warm: 0.25,
      cool: 0.3,
      idle: 0.5,
      gain: 0.7,
      frame: world.limestone,
    },
    glow,
    world.limestone,
  );
}

/**
 * A glass tower lit from inside: cool, bright enough that the bloom pass gives it a halo. `update`
 * sets the brightness from the scenery's glow each frame (always at least a steady light).
 */
export function createLitGlassMaterial() {
  const material = new MeshStandardMaterial({
    color: world.glassGlow,
    emissive: '#A9CBEA',
    emissiveIntensity: 0.6,
    roughness: 0.35,
    metalness: 0.1,
  });
  return {
    material,
    update: (glow: number) => {
      material.emissiveIntensity = 0.55 + 0.9 * glow;
    },
  };
}

/** The bridge steel: dark with a pale finish that picks up the light. */
export function createBridgeSteelMaterial() {
  const material = new MeshStandardMaterial({
    color: world.signalPole,
    emissive: '#D8E6FF',
    emissiveIntensity: 0.25,
    roughness: 0.5,
    metalness: 0.3,
  });
  return {
    material,
    update: (glow: number) => {
      material.emissiveIntensity = 0.25 + 0.6 * glow;
    },
  };
}

/** The bridge cables: thin pale lines, brighter as the car passes. */
export function createCableMaterial() {
  const material = new LineBasicMaterial({ color: '#CFE0FF', toneMapped: false });
  return {
    material,
    update: (glow: number) => {
      const k = 0.5 + 1.2 * glow;
      material.color.setRGB(0.81 * k, 0.88 * k, k);
    },
  };
}
