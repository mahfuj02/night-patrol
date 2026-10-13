import { useTexture } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { RepeatWrapping, SRGBColorSpace, type Texture } from 'three';
import type { QualityTier } from '@/lib/quality';
import { textureFiles } from '@/lib/textures';

/**
 * The brick colour map for walls. The wall shader samples it by metres along each face and uses
 * only its brightness. Suspends while loading, so callers wrap it in <Suspense>.
 */
export function useBrickTexture(tier: QualityTier): Texture {
  const loaded = useTexture(textureFiles('brick', tier).color);
  const texture = useMemo(() => {
    const copy = loaded.clone();
    copy.wrapS = copy.wrapT = RepeatWrapping;
    copy.colorSpace = SRGBColorSpace;
    copy.anisotropy = 8;
    copy.needsUpdate = true;
    return copy;
  }, [loaded]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}
