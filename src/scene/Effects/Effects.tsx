import { useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';
import { useRef } from 'react';
import { GRAIN_NIGHT, effectsForTier, grainOpacity, type QualityTier } from '@/lib/quality';
import { atmosphere } from '../atmosphere';

/**
 * Post-processing: bloom on the bright lamps and light-lit snow, then tone mapping, a vignette and
 * film grain. High and medium only; the low tier renders straight to the screen (and keeps the
 * renderer's own tone mapping). Grain is constantly shifting noise, so reduced motion drops it, and
 * its strength eases down at the sunrise (see `grainOpacity`).
 * The composer's MSAA keeps the alpha-to-coverage twig edges smooth.
 */
export function Effects({ tier, reducedMotion }: { tier: QualityTier; reducedMotion: boolean }) {
  const settings = effectsForTier(tier, reducedMotion);
  // The grain eases down as the sunrise comes up: on bright snow it would otherwise be very strong.
  const noise = useRef<{ blendMode: { opacity: { value: number } } } | null>(null);
  useFrame(() => {
    const effect = noise.current;
    if (effect) effect.blendMode.opacity.value = grainOpacity(atmosphere.sunrise);
  });
  if (!settings.enabled) return null;

  return (
    <EffectComposer multisampling={settings.multisampling} enableNormalPass={false}>
      <Bloom
        mipmapBlur
        intensity={0.85}
        luminanceThreshold={0.82}
        luminanceSmoothing={0.25}
        radius={0.7}
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.3} darkness={0.55} />
      {settings.grain && (
        <Noise
          ref={noise as never}
          premultiply
          blendFunction={BlendFunction.SOFT_LIGHT}
          opacity={GRAIN_NIGHT}
        />
      )}
    </EffectComposer>
  );
}
