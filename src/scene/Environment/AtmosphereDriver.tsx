import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Color, Fog, SRGBColorSpace, type AmbientLight, type DirectionalLight } from 'three';
import { sampleAtmosphere } from '@/lib/atmosphere';
import { world } from '@/lib/palette';
import { atmosphere, resolvedZones } from '../atmosphere';
import { progress } from '../progress';

const AMBIENT_GAIN = 3.4;
const MOONLIGHT_GAIN = 0.7;

/**
 * Blends the lighting and weather zones for the current route progress and applies the result:
 * fog, ambient light and moonlight. The sky, snow and lamps read the same blended values.
 * Runs after ProgressDriver (priority -1) and before the sky and snow.
 */
export function AtmosphereDriver() {
  const ambient = useRef<AmbientLight>(null);
  const moonlight = useRef<DirectionalLight>(null);

  useFrame((state) => {
    sampleAtmosphere(resolvedZones, progress.t, atmosphere);

    const { fog, background } = state.scene;
    if (fog instanceof Fog) {
      fog.color.setRGB(...atmosphere.fogColor, SRGBColorSpace);
      fog.near = atmosphere.fogNear;
      fog.far = atmosphere.fogFar;
    }
    if (background instanceof Color) background.setRGB(...atmosphere.skyHorizon, SRGBColorSpace);

    if (ambient.current) {
      ambient.current.color.setRGB(...atmosphere.ambientColor, SRGBColorSpace);
      ambient.current.intensity = atmosphere.ambientIntensity * AMBIENT_GAIN;
    }
    if (moonlight.current) moonlight.current.intensity = atmosphere.moon * MOONLIGHT_GAIN;
  }, -0.5);

  return (
    <>
      <ambientLight ref={ambient} />
      <directionalLight ref={moonlight} position={[60, 80, 40]} color={world.moonLow} />
    </>
  );
}
