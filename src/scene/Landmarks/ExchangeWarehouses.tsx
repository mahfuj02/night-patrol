import { useEffect, useMemo } from 'react';
import { projects } from '@/content/projects';
import { signage } from '@/content/signage';
import { routeModel } from '../Road/route';
import { Landmark } from './Landmark';
import { createGhostSignTexture, createMarqueeTexture, ghostAtlasRects } from './landmarkTextures';
import {
  GlowUniform,
  createGhostSignMaterial,
  createMarqueeMaterial,
  createSteelMaterial,
  createWarehouseBrickMaterial,
} from './landmarkMaterials';
import { landmarkFrame, warehousesPlacement } from './placement';
import {
  ghostSignGeometry,
  marqueeBoardGeometry,
  warehouseBodyGeometry,
  warehouseSteelGeometry,
} from './warehouseModel';

const frame = landmarkFrame(routeModel, warehousesPlacement);
/** The marquee's first line is the project the stop is about, from content. */
const eventflow = projects.find((p) => p.stopId === warehousesPlacement.stopId);

/**
 * The Exchange District warehouses: three attached old brick warehouses with faded painted ghost
 * signs, and the venue in the middle under a marquee sign that names the project (EventFlow). Four
 * meshes, four draw calls. The windows, the ghost signs and above all the marquee bulbs and
 * lettering come up as the car arrives (see `Landmark`). Wording comes from `src/content`; the
 * ghost signs are generic trades, with no real company names or logos.
 */
export function ExchangeWarehouses({ reducedMotion }: { reducedMotion: boolean }) {
  const parts = useMemo(() => {
    const ghostMap = createGhostSignTexture({
      dryGoods: signage.ghostSigns.dryGoods,
      wholesale: signage.ghostSigns.wholesale,
      warehouse: signage.ghostSigns.warehouse,
      grain: signage.ghostSigns.grainExchangeSupply,
    });
    const marqueeMap = createMarqueeTexture(
      (eventflow?.name ?? '').toUpperCase(),
      signage.marqueeSubtitle,
    );
    return {
      bodies: warehouseBodyGeometry(),
      steel: warehouseSteelGeometry(),
      ghosts: ghostSignGeometry(ghostAtlasRects),
      board: marqueeBoardGeometry(),
      ghostMap,
      marqueeMap,
      steelMaterial: createSteelMaterial(),
      ghostMaterial: createGhostSignMaterial(ghostMap),
      marquee: createMarqueeMaterial(marqueeMap),
    };
  }, []);

  useEffect(
    () => () => {
      parts.bodies.dispose();
      parts.steel.dispose();
      parts.ghosts.dispose();
      parts.board.dispose();
      parts.ghostMap.dispose();
      parts.marqueeMap.dispose();
      parts.steelMaterial.dispose();
      parts.ghostMaterial.material.dispose();
      parts.marquee.material.dispose();
    },
    [parts],
  );

  return (
    <Landmark
      frame={frame}
      reducedMotion={reducedMotion}
      focus={[-6, 5, 0]}
      onGlow={(glow) => {
        parts.marquee.update(glow);
        parts.ghostMaterial.update(glow);
      }}
    >
      {(glow) => <WarehouseMeshes parts={parts} glow={glow} />}
    </Landmark>
  );
}

interface Parts {
  bodies: ReturnType<typeof warehouseBodyGeometry>;
  steel: ReturnType<typeof warehouseSteelGeometry>;
  ghosts: ReturnType<typeof ghostSignGeometry>;
  board: ReturnType<typeof marqueeBoardGeometry>;
  steelMaterial: ReturnType<typeof createSteelMaterial>;
  ghostMaterial: ReturnType<typeof createGhostSignMaterial>;
  marquee: ReturnType<typeof createMarqueeMaterial>;
}

function WarehouseMeshes({ parts, glow }: { parts: Parts; glow: GlowUniform }) {
  const brick = useMemo(() => createWarehouseBrickMaterial(glow), [glow]);
  useEffect(() => () => brick.dispose(), [brick]);

  return (
    <>
      <mesh geometry={parts.bodies} material={brick} />
      <mesh geometry={parts.steel} material={parts.steelMaterial} />
      <mesh geometry={parts.ghosts} material={parts.ghostMaterial.material} renderOrder={1} />
      <mesh geometry={parts.board} material={parts.marquee.material} />
    </>
  );
}
