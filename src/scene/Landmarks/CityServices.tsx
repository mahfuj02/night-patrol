import { useEffect, useMemo } from 'react';
import { projects } from '@/content/projects';
import { signage } from '@/content/signage';
import { routeModel } from '../Road/route';
import { Landmark } from './Landmark';
import { createRequestBoardTexture, createRooftopSignTexture } from './landmarkTextures';
import {
  createBrickNeighbourMaterial,
  createLimestoneMaterial,
  createMarqueeMaterial,
  createRooftopSignMaterial,
  createSteelMaterial,
} from './landmarkMaterials';
import type { GlowUniform } from './landmarkMaterials';
import {
  CITY,
  annexGeometry,
  boardGeometry,
  detailGeometry,
  hallGeometry,
  hallTop,
  signGeometry,
} from './cityModel';
import { cityServicesPlacement, landmarkFrame } from './placement';

const frame = landmarkFrame(routeModel, cityServicesPlacement);
/** The request board names the project the stop is about, from content. */
const civictrack = projects.find((p) => p.stopId === cityServicesPlacement.stopId);

/**
 * The City services building: a limestone civic hall with a columned entrance, a request board
 * over the door that names the project (CivicTrack) and the three stages a request moves through,
 * rooftop lettering, and a lower brick annex. Five meshes, five draw calls. The windows, the board
 * and the lettering come up as the car arrives (see `Landmark`). Wording comes from
 * `src/content`; there is no city logo or crest.
 */
export function CityServices({ reducedMotion }: { reducedMotion: boolean }) {
  const parts = useMemo(() => {
    const boardMap = createRequestBoardTexture(
      (civictrack?.name ?? '').toUpperCase(),
      signage.requestBoard.heading,
      signage.requestBoard.statuses,
    );
    const signMap = createRooftopSignTexture(signage.cityRooftop);
    return {
      hall: hallGeometry(),
      annex: annexGeometry(),
      detail: detailGeometry(),
      board: boardGeometry(),
      sign: signGeometry(),
      boardMap,
      signMap,
      steel: createSteelMaterial(),
      boardMaterial: createMarqueeMaterial(boardMap),
      lettering: createRooftopSignMaterial(signMap),
    };
  }, []);

  useEffect(
    () => () => {
      parts.hall.dispose();
      parts.annex.dispose();
      parts.detail.dispose();
      parts.board.dispose();
      parts.sign.dispose();
      parts.boardMap.dispose();
      parts.signMap.dispose();
      parts.steel.dispose();
      parts.boardMaterial.material.dispose();
      parts.lettering.material.dispose();
    },
    [parts],
  );

  return (
    <Landmark
      frame={frame}
      reducedMotion={reducedMotion}
      focus={[CITY.entranceX, hallTop * 0.5, 0]}
      onGlow={(glow) => {
        parts.boardMaterial.update(glow);
        parts.lettering.update(glow);
      }}
    >
      {(glow) => <CityMeshes parts={parts} glow={glow} />}
    </Landmark>
  );
}

interface Parts {
  hall: ReturnType<typeof hallGeometry>;
  annex: ReturnType<typeof annexGeometry>;
  detail: ReturnType<typeof detailGeometry>;
  board: ReturnType<typeof boardGeometry>;
  sign: ReturnType<typeof signGeometry>;
  steel: ReturnType<typeof createSteelMaterial>;
  boardMaterial: ReturnType<typeof createMarqueeMaterial>;
  lettering: ReturnType<typeof createRooftopSignMaterial>;
}

function CityMeshes({ parts, glow }: { parts: Parts; glow: GlowUniform }) {
  const walls = useMemo(
    () => ({ hall: createLimestoneMaterial(glow), annex: createBrickNeighbourMaterial(glow) }),
    [glow],
  );
  useEffect(
    () => () => {
      walls.hall.dispose();
      walls.annex.dispose();
    },
    [walls],
  );

  return (
    <>
      <mesh geometry={parts.hall} material={walls.hall} />
      <mesh geometry={parts.annex} material={walls.annex} />
      <mesh geometry={parts.detail} material={parts.steel} />
      <mesh geometry={parts.board} material={parts.boardMaterial.material} />
      <mesh geometry={parts.sign} material={parts.lettering.material} />
    </>
  );
}
