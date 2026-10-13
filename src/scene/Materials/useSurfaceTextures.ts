import { useTexture } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { NoColorSpace, RepeatWrapping, SRGBColorSpace, type Texture } from 'three';
import type { QualityTier } from '@/lib/quality';
import { textureFiles, textureSets } from '@/lib/textures';

export interface SurfaceTextures {
  /** Road asphalt, tiled in metres along the road uv. */
  roadMap: Texture;
  roadNormal?: Texture;
  roadRough?: Texture;
  /** Snow, sampled in world space by the snow shader (wrapping only; no repeat set). */
  snowMap: Texture;
  snowRough?: Texture;
}

function configure(texture: Texture, srgb: boolean, repeat: number): Texture {
  // Clone so each surface can set its own repeat and colour space without touching the cache.
  const copy = texture.clone();
  copy.wrapS = copy.wrapT = RepeatWrapping;
  copy.repeat.set(repeat, repeat);
  copy.colorSpace = srgb ? SRGBColorSpace : NoColorSpace;
  copy.anisotropy = 8;
  copy.needsUpdate = true;
  return copy;
}

/**
 * Loads the road and snow texture sets for a quality tier (see src/lib/textures.ts): colour,
 * normal and roughness for high and medium, a single 512 colour map for low. Suspends while
 * loading, so callers wrap it in <Suspense> with a flat-colour fallback.
 */
export function useSurfaceTextures(tier: QualityTier): SurfaceTextures {
  const road = textureFiles('road', tier);
  const snow = textureFiles('snow', tier);
  const urls: Record<string, string> = { roadMap: road.color, snowMap: snow.color };
  if (road.normal) urls.roadNormal = road.normal;
  if (road.rough) urls.roadRough = road.rough;
  if (snow.rough) urls.snowRough = snow.rough;
  const loaded = useTexture(urls) as Record<string, Texture>;

  const textures = useMemo(() => {
    const roadRepeat = 1 / textureSets.road.tileMetres;
    const out: SurfaceTextures = {
      roadMap: configure(loaded.roadMap!, true, roadRepeat),
      snowMap: configure(loaded.snowMap!, true, 1),
    };
    if (loaded.roadNormal) out.roadNormal = configure(loaded.roadNormal, false, roadRepeat);
    if (loaded.roadRough) out.roadRough = configure(loaded.roadRough, false, roadRepeat);
    if (loaded.snowRough) out.snowRough = configure(loaded.snowRough, false, 1);
    return out;
  }, [loaded]);

  useEffect(
    () => () => {
      Object.values(textures).forEach((texture) => texture?.dispose());
    },
    [textures],
  );
  return textures;
}
