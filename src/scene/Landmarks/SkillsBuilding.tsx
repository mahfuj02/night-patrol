import { useEffect, useMemo } from 'react';
import { MeshBasicMaterial } from 'three';
import { routeModel } from '../Road/route';
import { Landmark } from './Landmark';
import { createCurtainWallMaterial, createSteelMaterial } from './landmarkMaterials';
import type { GlowUniform } from './landmarkMaterials';
import { landmarkFrame, skillsPlacement } from './placement';
import {
  roofTop,
  skillsAccentGeometry,
  skillsDetailGeometry,
  skillsGlassGeometry,
} from './skillsModel';

const frame = landmarkFrame(routeModel, skillsPlacement);

/**
 * The Skills building: a dark glass tech building with a rooftop plant and mast, an entrance canopy
 * and cool accent light along the roofline and corners. Three meshes, three draw calls. The glass
 * glows from inside and the accent light brightens as the car arrives (see `Landmark`); the Skills
 * station parks in front of it. No lettering, no logo.
 */
export function SkillsBuilding({ reducedMotion }: { reducedMotion: boolean }) {
  const parts = useMemo(
    () => ({
      glass: skillsGlassGeometry(),
      detail: skillsDetailGeometry(),
      accent: skillsAccentGeometry(),
      steel: createSteelMaterial(),
      light: new MeshBasicMaterial({ color: '#4FE3E3', toneMapped: false }),
    }),
    [],
  );
  useEffect(
    () => () => {
      parts.glass.dispose();
      parts.detail.dispose();
      parts.accent.dispose();
      parts.steel.dispose();
      parts.light.dispose();
    },
    [parts],
  );

  return (
    <Landmark
      frame={frame}
      reducedMotion={reducedMotion}
      focus={[0, roofTop * 0.4, 0]}
      onGlow={(glow) => {
        // Bright enough at full glow that the bloom pass gives the strips a halo.
        const k = 0.45 + 1.6 * glow;
        parts.light.color.setRGB(0.31 * k, 0.89 * k, 0.89 * k);
      }}
    >
      {(glow) => <SkillsMeshes parts={parts} glow={glow} />}
    </Landmark>
  );
}

interface Parts {
  glass: ReturnType<typeof skillsGlassGeometry>;
  detail: ReturnType<typeof skillsDetailGeometry>;
  accent: ReturnType<typeof skillsAccentGeometry>;
  steel: ReturnType<typeof createSteelMaterial>;
  light: MeshBasicMaterial;
}

function SkillsMeshes({ parts, glow }: { parts: Parts; glow: GlowUniform }) {
  const wall = useMemo(() => createCurtainWallMaterial(glow), [glow]);
  useEffect(() => () => wall.dispose(), [wall]);
  return (
    <>
      <mesh geometry={parts.glass} material={wall} />
      <mesh geometry={parts.detail} material={parts.steel} />
      <mesh geometry={parts.accent} material={parts.light} />
    </>
  );
}
