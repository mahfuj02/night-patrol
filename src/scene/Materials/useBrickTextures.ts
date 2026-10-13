import { useTexture } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { NoColorSpace, RepeatWrapping, SRGBColorSpace, type Texture } from 'three';
import type { QualityTier } from '@/lib/quality';
import { textureFiles } from '@/lib/textures';

export interface BrickTextures {
  /** Colour map: the wall shader uses only its brightness. */
  color: Texture;
  /** Normal map for the brick relief. High and medium only. */
  normal?: Texture;
}

function configure(texture: Texture, srgb: boolean): Texture {
  // Clone so the wall material can set its own colour space without touching the cache.
  const copy = texture.clone();
  copy.wrapS = copy.wrapT = RepeatWrapping;
  copy.colorSpace = srgb ? SRGBColorSpace : NoColorSpace;
  copy.anisotropy = 8;
  copy.needsUpdate = true;
  return copy;
}

/**
 * The brick maps for walls (see src/lib/textures.ts): colour and normal on high and medium, the
 * colour map alone on low. The wall shader samples them by metres along each face. Suspends while
 * loading, so callers wrap it in <Suspense>.
 */
export function useBrickTextures(tier: QualityTier): BrickTextures {
  const files = textureFiles('brick', tier);
  const urls: Record<string, string> = { color: files.color };
  if (files.normal) urls.normal = files.normal;
  const loaded = useTexture(urls) as Record<string, Texture>;
  const textures = useMemo(() => {
    const out: BrickTextures = { color: configure(loaded.color!, true) };
    if (loaded.normal) out.normal = configure(loaded.normal, false);
    return out;
  }, [loaded]);
  useEffect(
    () => () => {
      textures.color.dispose();
      textures.normal?.dispose();
    },
    [textures],
  );
  return textures;
}
