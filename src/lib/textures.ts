import type { QualityTier } from './quality';

export type TextureSetId = 'road' | 'snow' | 'brick';

export interface TextureSet {
  /** Folder and file prefix under /textures. */
  asset: string;
  /** Real-world size of one tile in metres (from the asset page). */
  tileMetres: number;
  /** Edge length of the maps shipped for high and medium. */
  size: 512 | 1024;
  hasNormal: boolean;
  hasRough: boolean;
}

export const textureSets: Record<TextureSetId, TextureSet> = {
  road: { asset: 'asphalt_snow', tileMetres: 2, size: 1024, hasNormal: true, hasRough: true },
  snow: { asset: 'snow_02', tileMetres: 2, size: 1024, hasNormal: false, hasRough: true },
  brick: { asset: 'factory_brick', tileMetres: 1.5, size: 512, hasNormal: true, hasRough: true },
};

export interface TextureFiles {
  color: string;
  normal?: string;
  rough?: string;
}

const file = (asset: string, map: string, size: number) =>
  `/textures/${asset}/${asset}_${map}_${size}.webp`;

/**
 * Files to load for a texture set at a quality tier. High and medium load the full set; low loads
 * a single 512² colour map and must never request normal or roughness maps.
 */
export function textureFiles(id: TextureSetId, tier: QualityTier): TextureFiles {
  const set = textureSets[id];
  if (tier === 'low') return { color: file(set.asset, 'color', 512) };
  return {
    color: file(set.asset, 'color', set.size),
    ...(set.hasNormal ? { normal: file(set.asset, 'normal', set.size) } : {}),
    ...(set.hasRough ? { rough: file(set.asset, 'rough', set.size) } : {}),
  };
}

/** Texture repeat so that one tile covers `tileMetres` of a surface that is `metres` long. */
export function repeatFor(id: TextureSetId, metres: number): number {
  return metres / textureSets[id].tileMetres;
}
