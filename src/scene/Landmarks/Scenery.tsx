import { useEffect, useMemo } from 'react';
import { routeModel } from '../Road/route';
import { Landmark } from './Landmark';
import { createSteelMaterial } from './landmarkMaterials';
import type { GlowUniform } from './landmarkMaterials';
import { esplanadePlacement, museumPlacement, sceneryFrame, warmHousePlacement } from './placement';
import {
  createBridgeSteelMaterial,
  createCableMaterial,
  createLitGlassMaterial,
  createSnowRoofMaterial,
  createStoneBaseMaterial,
  createWarmHouseMaterial,
} from './sceneryMaterials';
import {
  bridgeCableGeometry,
  bridgeSteelGeometry,
  houseBodyGeometry,
  houseDetailGeometry,
  houseRoofGeometry,
  museumBaseGeometry,
  museumTowerGeometry,
  museumTowerTop,
  spireTop,
} from './sceneryModel';

const houseFrame = sceneryFrame(routeModel, warmHousePlacement);
const museumFrame = sceneryFrame(routeModel, museumPlacement);
const bridgeFrame = sceneryFrame(routeModel, esplanadePlacement);

/** Scenery is always lit a little, then brightens as the car passes. */
const STEADY = 0.55;

interface SceneryProps {
  reducedMotion: boolean;
}

/**
 * The warm-windowed house on the residential street: cream siding, a snowy gable roof, a small
 * porch, and almost every window lit warm. No figures and no text (CLAUDE.md rule 9). Three meshes.
 */
export function WarmHouse({ reducedMotion }: SceneryProps) {
  const parts = useMemo(
    () => ({
      body: houseBodyGeometry(),
      roof: houseRoofGeometry(),
      detail: houseDetailGeometry(),
      roofMaterial: createSnowRoofMaterial(),
      steel: createSteelMaterial(),
    }),
    [],
  );
  useEffect(
    () => () => {
      parts.body.dispose();
      parts.roof.dispose();
      parts.detail.dispose();
      parts.roofMaterial.dispose();
      parts.steel.dispose();
    },
    [parts],
  );

  return (
    <Landmark frame={houseFrame} reducedMotion={reducedMotion} minGlow={STEADY} lean={false}>
      {(glow) => <HouseMeshes parts={parts} glow={glow} />}
    </Landmark>
  );
}

function HouseMeshes({
  parts,
  glow,
}: {
  parts: {
    body: ReturnType<typeof houseBodyGeometry>;
    roof: ReturnType<typeof houseRoofGeometry>;
    detail: ReturnType<typeof houseDetailGeometry>;
    roofMaterial: ReturnType<typeof createSnowRoofMaterial>;
    steel: ReturnType<typeof createSteelMaterial>;
  };
  glow: GlowUniform;
}) {
  const wall = useMemo(() => createWarmHouseMaterial(glow), [glow]);
  useEffect(() => () => wall.dispose(), [wall]);
  return (
    <>
      <mesh geometry={parts.body} material={wall} />
      <mesh geometry={parts.roof} material={parts.roofMaterial} />
      <mesh geometry={parts.detail} material={parts.steel} />
    </>
  );
}

/**
 * The Canadian Museum for Human Rights, as a lit silhouette: a wide stone base and a tall, tapering
 * glass tower that glows from inside. No lettering and no logo. Two meshes.
 */
export function HumanRightsMuseum({ reducedMotion }: SceneryProps) {
  const parts = useMemo(
    () => ({
      base: museumBaseGeometry(),
      tower: museumTowerGeometry(),
      glass: createLitGlassMaterial(),
    }),
    [],
  );
  useEffect(
    () => () => {
      parts.base.dispose();
      parts.tower.dispose();
      parts.glass.material.dispose();
    },
    [parts],
  );

  return (
    <Landmark
      frame={museumFrame}
      reducedMotion={reducedMotion}
      minGlow={STEADY}
      lean={false}
      focus={[0, museumTowerTop / 2, 0]}
      onGlow={(glow) => parts.glass.update(glow)}
    >
      {(glow) => <MuseumMeshes parts={parts} glow={glow} />}
    </Landmark>
  );
}

function MuseumMeshes({
  parts,
  glow,
}: {
  parts: {
    base: ReturnType<typeof museumBaseGeometry>;
    tower: ReturnType<typeof museumTowerGeometry>;
    glass: ReturnType<typeof createLitGlassMaterial>;
  };
  glow: GlowUniform;
}) {
  const stone = useMemo(() => createStoneBaseMaterial(glow), [glow]);
  useEffect(() => () => stone.dispose(), [stone]);
  return (
    <>
      <mesh geometry={parts.base} material={stone} />
      <mesh geometry={parts.tower} material={parts.glass.material} />
    </>
  );
}

/**
 * Esplanade Riel: a footbridge deck on two piers with a tall glowing spire and cable stays fanning
 * down to the deck. Two meshes (the steel and the cables as lines).
 */
export function EsplanadeRiel({ reducedMotion }: SceneryProps) {
  const parts = useMemo(
    () => ({
      steel: bridgeSteelGeometry(),
      cables: bridgeCableGeometry(),
      steelMaterial: createBridgeSteelMaterial(),
      cableMaterial: createCableMaterial(),
    }),
    [],
  );
  useEffect(
    () => () => {
      parts.steel.dispose();
      parts.cables.dispose();
      parts.steelMaterial.material.dispose();
      parts.cableMaterial.material.dispose();
    },
    [parts],
  );

  return (
    <Landmark
      frame={bridgeFrame}
      reducedMotion={reducedMotion}
      minGlow={STEADY}
      lean={false}
      focus={[0, spireTop / 2, 0]}
      onGlow={(glow) => {
        parts.steelMaterial.update(glow);
        parts.cableMaterial.update(glow);
      }}
    >
      {() => (
        <>
          <mesh geometry={parts.steel} material={parts.steelMaterial.material} />
          <lineSegments geometry={parts.cables} material={parts.cableMaterial.material} />
        </>
      )}
    </Landmark>
  );
}

/** All the scenery on the route. */
export function Scenery({ reducedMotion }: SceneryProps) {
  return (
    <>
      <WarmHouse reducedMotion={reducedMotion} />
      <HumanRightsMuseum reducedMotion={reducedMotion} />
      <EsplanadeRiel reducedMotion={reducedMotion} />
    </>
  );
}
