import { useEffect, useMemo } from 'react';
import { signage } from '@/content/signage';
import { routeModel } from '../Road/route';
import { Landmark } from './Landmark';
import { createHeritagePanelTexture, createRooftopSignTexture } from './landmarkTextures';
import {
  createBrickNeighbourMaterial,
  createCurtainWallMaterial,
  createHeritagePanelMaterial,
  createLimestoneMaterial,
  createRooftopSignMaterial,
  createSteelMaterial,
} from './landmarkMaterials';
import type { GlowUniform } from './landmarkMaterials';
import { landmarkFrame, rrcPlacement } from './placement';
import {
  RRC,
  brickGeometry,
  campusGlassGeometry,
  campusTop,
  heritagePanelGeometry,
  limestoneGeometry,
  signFrameGeometry,
  signPlaneGeometry,
} from './rrcModel';

const frame = landmarkFrame(routeModel, rrcPlacement);

/**
 * RRC Polytechnic, Exchange District Campus: a stylized glass campus with dark mullions, a
 * projecting printed-heritage panel, rooftop lettering on a thin frame, and its limestone and red
 * brick neighbours (docs/art-reference.md). Six meshes, six draw calls. All of it is original
 * procedural geometry and drawing: no college logo, banner or crest. The glass wall and the
 * heritage panel glow from inside as the car arrives (see `Landmark`).
 */
export function RrcCampus({ reducedMotion }: { reducedMotion: boolean }) {
  const parts = useMemo(() => {
    const heritageMap = createHeritagePanelTexture();
    const signMap = createRooftopSignTexture(signage.rrcRooftop);
    return {
      glass: campusGlassGeometry(),
      frame: signFrameGeometry(),
      panel: heritagePanelGeometry(),
      sign: signPlaneGeometry(),
      limestone: limestoneGeometry(),
      brick: brickGeometry(),
      heritageMap,
      signMap,
      steel: createSteelMaterial(),
      heritage: createHeritagePanelMaterial(heritageMap),
      lettering: createRooftopSignMaterial(signMap),
    };
  }, []);

  useEffect(
    () => () => {
      parts.glass.dispose();
      parts.frame.dispose();
      parts.panel.dispose();
      parts.sign.dispose();
      parts.limestone.dispose();
      parts.brick.dispose();
      parts.heritageMap.dispose();
      parts.signMap.dispose();
      parts.steel.dispose();
      parts.heritage.material.dispose();
      parts.lettering.material.dispose();
    },
    [parts],
  );

  return (
    <Landmark
      frame={frame}
      reducedMotion={reducedMotion}
      focus={[-2, campusTop * 0.6, 0]}
      onGlow={(glow) => {
        parts.heritage.update(glow);
        parts.lettering.update(glow);
      }}
    >
      {(glow) => <CampusMeshes parts={parts} glow={glow} />}
    </Landmark>
  );
}

interface Parts {
  glass: ReturnType<typeof campusGlassGeometry>;
  frame: ReturnType<typeof signFrameGeometry>;
  panel: ReturnType<typeof heritagePanelGeometry>;
  sign: ReturnType<typeof signPlaneGeometry>;
  limestone: ReturnType<typeof limestoneGeometry>;
  brick: ReturnType<typeof brickGeometry>;
  steel: ReturnType<typeof createSteelMaterial>;
  heritage: ReturnType<typeof createHeritagePanelMaterial>;
  lettering: ReturnType<typeof createRooftopSignMaterial>;
}

function CampusMeshes({ parts, glow }: { parts: Parts; glow: GlowUniform }) {
  const walls = useMemo(
    () => ({
      curtain: createCurtainWallMaterial(glow),
      limestone: createLimestoneMaterial(glow),
      brick: createBrickNeighbourMaterial(glow),
    }),
    [glow],
  );
  useEffect(
    () => () => {
      walls.curtain.dispose();
      walls.limestone.dispose();
      walls.brick.dispose();
    },
    [walls],
  );

  return (
    <>
      <mesh geometry={parts.glass} material={walls.curtain} />
      <mesh geometry={parts.frame} material={parts.steel} />
      <mesh geometry={parts.panel} material={parts.heritage.material} />
      <mesh geometry={parts.sign} material={parts.lettering.material} />
      <mesh geometry={parts.limestone} material={walls.limestone} />
      <mesh geometry={parts.brick} material={walls.brick} />
    </>
  );
}

/** Used by tests and docs: the campus block size. */
export const campusSize = { width: RRC.width, depth: RRC.depth, height: campusTop };
