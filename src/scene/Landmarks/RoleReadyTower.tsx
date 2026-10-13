import { useEffect, useMemo } from 'react';
import { projects } from '@/content/projects';
import { routeModel } from '../Road/route';
import { Landmark } from './Landmark';
import { createBillboardTexture } from './landmarkTextures';
import {
  createCurtainWallMaterial,
  createLimestoneMaterial,
  createMarqueeMaterial,
  createSteelMaterial,
} from './landmarkMaterials';
import type { GlowUniform } from './landmarkMaterials';
import { landmarkFrame, roleReadyPlacement } from './placement';
import {
  boardFaceGeometry,
  boardFrameGeometry,
  podiumGeometry,
  towerGeometry,
  towerTop,
} from './roleReadyModel';

const frame = landmarkFrame(routeModel, roleReadyPlacement);
/** The sign shows the project the stop is about, from content. */
const roleready = projects.find((p) => p.stopId === roleReadyPlacement.stopId);

/**
 * The RoleReady tower just past the Portage & Main intersection: a glass office tower on a limestone
 * podium with a lit sign board (the project name, its slogan and two speech bubbles) on its front.
 * Four meshes, four draw calls. The windows and the board come up as the car arrives (see
 * `Landmark`). Wording comes from the project's `sign` in `src/content`; there is no bank or company
 * logo.
 */
export function RoleReadyTower({ reducedMotion }: { reducedMotion: boolean }) {
  const parts = useMemo(() => {
    const boardMap = createBillboardTexture(
      (roleready?.sign?.name ?? '').toUpperCase(),
      roleready?.sign?.slogan ?? '',
    );
    return {
      tower: towerGeometry(),
      podium: podiumGeometry(),
      frame: boardFrameGeometry(),
      face: boardFaceGeometry(),
      boardMap,
      steel: createSteelMaterial(),
      board: createMarqueeMaterial(boardMap),
    };
  }, []);

  useEffect(
    () => () => {
      parts.tower.dispose();
      parts.podium.dispose();
      parts.frame.dispose();
      parts.face.dispose();
      parts.boardMap.dispose();
      parts.steel.dispose();
      parts.board.material.dispose();
    },
    [parts],
  );

  return (
    <Landmark
      frame={frame}
      reducedMotion={reducedMotion}
      focus={[-2, towerTop * 0.45, 0]}
      onGlow={(glow) => parts.board.update(glow)}
    >
      {(glow) => <TowerMeshes parts={parts} glow={glow} />}
    </Landmark>
  );
}

interface Parts {
  tower: ReturnType<typeof towerGeometry>;
  podium: ReturnType<typeof podiumGeometry>;
  frame: ReturnType<typeof boardFrameGeometry>;
  face: ReturnType<typeof boardFaceGeometry>;
  steel: ReturnType<typeof createSteelMaterial>;
  board: ReturnType<typeof createMarqueeMaterial>;
}

function TowerMeshes({ parts, glow }: { parts: Parts; glow: GlowUniform }) {
  const walls = useMemo(
    () => ({ tower: createCurtainWallMaterial(glow), podium: createLimestoneMaterial(glow) }),
    [glow],
  );
  useEffect(
    () => () => {
      walls.tower.dispose();
      walls.podium.dispose();
    },
    [walls],
  );

  return (
    <>
      <mesh geometry={parts.tower} material={walls.tower} />
      <mesh geometry={parts.podium} material={walls.podium} />
      <mesh geometry={parts.frame} material={parts.steel} />
      <mesh geometry={parts.face} material={parts.board.material} />
    </>
  );
}
