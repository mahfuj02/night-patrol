import type { ComponentType } from 'react';
import type { LandmarkId } from '@/content/schema';
import { CityServices } from './CityServices';
import { ExchangeWarehouses } from './ExchangeWarehouses';
import { RrcCampus } from './RrcCampus';

/** Props every landmark component takes. */
export interface LandmarkComponentProps {
  reducedMotion: boolean;
}

/**
 * The landmark components by landmark id. A stop whose landmark is not in this table simply has
 * none yet; adding a landmark is one component plus one entry here (docs/adding-a-stop.md).
 */
export const landmarkComponents: Partial<
  Record<LandmarkId, ComponentType<LandmarkComponentProps>>
> = {
  'rrc-campus': RrcCampus,
  'exchange-warehouses': ExchangeWarehouses,
  'city-services': CityServices,
};

/** Draws every landmark that has been built. */
export function Landmarks({ reducedMotion }: LandmarkComponentProps) {
  return (
    <>
      {Object.entries(landmarkComponents).map(([id, Component]) => (
        <Component key={id} reducedMotion={reducedMotion} />
      ))}
    </>
  );
}
