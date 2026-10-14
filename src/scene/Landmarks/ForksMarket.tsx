import { useEffect, useMemo } from 'react';
import { MeshBasicMaterial } from 'three';
import { routeModel } from '../Road/route';
import { Landmark } from './Landmark';
import { createBrickNeighbourMaterial, createCurtainWallMaterial } from './landmarkMaterials';
import type { GlowUniform } from './landmarkMaterials';
import { createSnowRoofMaterial } from './sceneryMaterials';
import { forksPlacement, landmarkFrame } from './placement';
import {
  forksBaseGeometry,
  forksHallGeometry,
  forksLightsGeometry,
  forksRoofGeometry,
  ridgeTop,
} from './forksModel';

const frame = landmarkFrame(routeModel, forksPlacement);

/**
 * The market building at The Forks, the end of the route: a long brick hall with a taller glazed
 * market hall behind it under a snowy gable, and a string of warm lights along the eaves that
 * brightens as the car arrives. Four meshes, four draw calls. The Contact station parks in front of
 * it. No lettering, no logo.
 */
export function ForksMarket({ reducedMotion }: { reducedMotion: boolean }) {
  const parts = useMemo(
    () => ({
      base: forksBaseGeometry(),
      hall: forksHallGeometry(),
      roof: forksRoofGeometry(),
      lights: forksLightsGeometry(),
      roofMaterial: createSnowRoofMaterial(),
      bulbs: new MeshBasicMaterial({ color: '#FFD27A', toneMapped: false }),
    }),
    [],
  );
  useEffect(
    () => () => {
      parts.base.dispose();
      parts.hall.dispose();
      parts.roof.dispose();
      parts.lights.dispose();
      parts.roofMaterial.dispose();
      parts.bulbs.dispose();
    },
    [parts],
  );

  return (
    <Landmark
      frame={frame}
      reducedMotion={reducedMotion}
      focus={[0, ridgeTop * 0.4, 0]}
      onGlow={(glow) => {
        // A warm string of lights, bright enough at full glow that the bloom pass gives it a halo.
        const k = 0.6 + 1.5 * glow;
        parts.bulbs.color.setRGB(1 * k, 0.82 * k, 0.48 * k);
      }}
    >
      {(glow) => <ForksMeshes parts={parts} glow={glow} />}
    </Landmark>
  );
}

interface Parts {
  base: ReturnType<typeof forksBaseGeometry>;
  hall: ReturnType<typeof forksHallGeometry>;
  roof: ReturnType<typeof forksRoofGeometry>;
  lights: ReturnType<typeof forksLightsGeometry>;
  roofMaterial: ReturnType<typeof createSnowRoofMaterial>;
  bulbs: MeshBasicMaterial;
}

function ForksMeshes({ parts, glow }: { parts: Parts; glow: GlowUniform }) {
  const walls = useMemo(
    () => ({ base: createBrickNeighbourMaterial(glow), hall: createCurtainWallMaterial(glow) }),
    [glow],
  );
  useEffect(
    () => () => {
      walls.base.dispose();
      walls.hall.dispose();
    },
    [walls],
  );
  return (
    <>
      <mesh geometry={parts.base} material={walls.base} />
      <mesh geometry={parts.hall} material={walls.hall} />
      <mesh geometry={parts.roof} material={parts.roofMaterial} />
      <mesh geometry={parts.lights} material={parts.bulbs} />
    </>
  );
}
