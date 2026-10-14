import { useEffect, useMemo } from 'react';
import { MeshBasicMaterial } from 'three';
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
  officeDetailGeometry,
  officeFrameGeometry,
  officeGlassGeometry,
  officeMonitorsGeometry,
  officeSignGeometry,
} from './officeModel';
import { landmarkFrame, officePlacement } from './placement';

const frame = landmarkFrame(routeModel, officePlacement);

/**
 * The LIILAB office: a small glass office with a pale roof slab, an entrance canopy, the sign in
 * plain lettering from `src/content` ("LIILAB · Sylhet, Bangladesh", no logo) and rows of lit
 * monitors at desk height. Five meshes, five draw calls. The glass, the sign and the monitors
 * come up as the car arrives (see `Landmark`); the Experience station parks in front of it.
 */
export function OfficeBuilding({ reducedMotion }: { reducedMotion: boolean }) {
  const parts = useMemo(() => {
    const signMap = createRooftopSignTexture(signage.officeSign);
    return {
      glass: officeGlassGeometry(),
      frame: officeFrameGeometry(),
      detail: officeDetailGeometry(),
      sign: officeSignGeometry(),
      monitors: officeMonitorsGeometry(),
      signMap,
      steel: createSteelMaterial(),
      signMaterial: createRooftopSignMaterial(signMap),
      screen: new MeshBasicMaterial({ color: '#CFE8FF', toneMapped: false }),
    };
  }, []);

  useEffect(
    () => () => {
      parts.glass.dispose();
      parts.frame.dispose();
      parts.detail.dispose();
      parts.sign.dispose();
      parts.monitors.dispose();
      parts.signMap.dispose();
      parts.steel.dispose();
      parts.signMaterial.material.dispose();
      parts.screen.dispose();
    },
    [parts],
  );

  return (
    <Landmark
      frame={frame}
      reducedMotion={reducedMotion}
      focus={[0, glassTop * 0.4, 0]}
      onGlow={(glow) => {
        parts.signMaterial.update(glow);
        // The monitors are a steady pale light that brightens as the car arrives.
        const k = 0.55 + 1.3 * glow;
        parts.screen.color.setRGB(0.81 * k, 0.91 * k, k);
      }}
    >
      {(glow) => <OfficeMeshes parts={parts} glow={glow} />}
    </Landmark>
  );
}

interface Parts {
  glass: ReturnType<typeof officeGlassGeometry>;
  frame: ReturnType<typeof officeFrameGeometry>;
  detail: ReturnType<typeof officeDetailGeometry>;
  sign: ReturnType<typeof officeSignGeometry>;
  monitors: ReturnType<typeof officeMonitorsGeometry>;
  steel: ReturnType<typeof createSteelMaterial>;
  signMaterial: ReturnType<typeof createRooftopSignMaterial>;
  screen: MeshBasicMaterial;
}

function OfficeMeshes({ parts, glow }: { parts: Parts; glow: GlowUniform }) {
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
      <mesh geometry={parts.monitors} material={parts.screen} />
      <mesh geometry={parts.sign} material={parts.signMaterial.material} />
    </>
  );
}
