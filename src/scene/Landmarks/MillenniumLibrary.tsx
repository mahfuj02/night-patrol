import { useEffect, useMemo } from 'react';
import { signage } from '@/content/signage';
import { routeModel } from '../Road/route';
import { Landmark } from './Landmark';
import { createRooftopSignTexture } from './landmarkTextures';
import {
  createCurtainWallMaterial,
  createLimestoneMaterial,
  createRooftopSignMaterial,
  createSteelMaterial,
} from './landmarkMaterials';
import type { GlowUniform } from './landmarkMaterials';
import {
  glassTop,
  libraryDetailGeometry,
  libraryFrameGeometry,
  libraryGlassGeometry,
  libraryLetteringGeometry,
} from './libraryModel';
import { landmarkFrame, libraryPlacement } from './placement';

const frame = landmarkFrame(routeModel, libraryPlacement);

/**
 * The Millennium Library: a stylized silhouette of its downtown glass front, with a pale roof slab,
 * end piers, an entrance canopy and plain lettering from `src/content` (no logo). Four meshes, four
 * draw calls. The glass glows from inside as the car arrives (see `Landmark`), and the Projects
 * station parks in front of it.
 */
export function MillenniumLibrary({ reducedMotion }: { reducedMotion: boolean }) {
  const parts = useMemo(() => {
    const letteringMap = createRooftopSignTexture(signage.libraryLettering);
    return {
      glass: libraryGlassGeometry(),
      frame: libraryFrameGeometry(),
      detail: libraryDetailGeometry(),
      lettering: libraryLetteringGeometry(),
      letteringMap,
      steel: createSteelMaterial(),
      letteringMaterial: createRooftopSignMaterial(letteringMap),
    };
  }, []);

  useEffect(
    () => () => {
      parts.glass.dispose();
      parts.frame.dispose();
      parts.detail.dispose();
      parts.lettering.dispose();
      parts.letteringMap.dispose();
      parts.steel.dispose();
      parts.letteringMaterial.material.dispose();
    },
    [parts],
  );

  return (
    <Landmark
      frame={frame}
      reducedMotion={reducedMotion}
      focus={[0, glassTop * 0.4, 0]}
      onGlow={(glow) => parts.letteringMaterial.update(glow)}
    >
      {(glow) => <LibraryMeshes parts={parts} glow={glow} />}
    </Landmark>
  );
}

interface Parts {
  glass: ReturnType<typeof libraryGlassGeometry>;
  frame: ReturnType<typeof libraryFrameGeometry>;
  detail: ReturnType<typeof libraryDetailGeometry>;
  lettering: ReturnType<typeof libraryLetteringGeometry>;
  steel: ReturnType<typeof createSteelMaterial>;
  letteringMaterial: ReturnType<typeof createRooftopSignMaterial>;
}

function LibraryMeshes({ parts, glow }: { parts: Parts; glow: GlowUniform }) {
  const walls = useMemo(
    () => ({ glass: createCurtainWallMaterial(glow), frame: createLimestoneMaterial(glow) }),
    [glow],
  );
  useEffect(
    () => () => {
      walls.glass.dispose();
      walls.frame.dispose();
    },
    [walls],
  );

  return (
    <>
      <mesh geometry={parts.glass} material={walls.glass} />
      <mesh geometry={parts.frame} material={walls.frame} />
      <mesh geometry={parts.detail} material={parts.steel} />
      <mesh geometry={parts.lettering} material={parts.letteringMaterial.material} />
    </>
  );
}
