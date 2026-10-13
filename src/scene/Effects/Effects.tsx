import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';
import { effectsForTier, type QualityTier } from '@/lib/quality';

/**
 * Post-processing: bloom on the bright lamps and light-lit snow, then tone mapping, a vignette and
 * film grain. High and medium only; the low tier renders straight to the screen (and keeps the
 * renderer's own tone mapping). Grain is constantly shifting noise, so reduced motion drops it.
 * The composer's MSAA keeps the alpha-to-coverage twig edges smooth.
 */
export function Effects({ tier, reducedMotion }: { tier: QualityTier; reducedMotion: boolean }) {
  const settings = effectsForTier(tier, reducedMotion);
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
        <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.35} />
      )}
    </EffectComposer>
  );
}
