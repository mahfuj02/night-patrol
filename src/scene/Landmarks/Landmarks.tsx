import type { ComponentType } from 'react';
import type { LandmarkId } from '@/content/schema';
import { CityServices } from './CityServices';
import { ExchangeWarehouses } from './ExchangeWarehouses';
import { ForksMarket } from './ForksMarket';
import { MillenniumLibrary } from './MillenniumLibrary';
import { OfficeBuilding } from './OfficeBuilding';
import { RoleReadyTower } from './RoleReadyTower';
import { RrcCampus } from './RrcCampus';
import { SkillsBuilding } from './SkillsBuilding';
import { Scenery } from './Scenery';

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
  'portage-main': RoleReadyTower,
  'millennium-library': MillenniumLibrary,
  'skills-station': SkillsBuilding,
  'liilab-office': OfficeBuilding,
  'the-forks': ForksMarket,
};

/** Draws every landmark that has been built, and the scenery (lit buildings with no stop). */
export function Landmarks({ reducedMotion }: LandmarkComponentProps) {
  return (
    <>
      {Object.entries(landmarkComponents).map(([id, Component]) => (
        <Component key={id} reducedMotion={reducedMotion} />
      ))}
      <Scenery reducedMotion={reducedMotion} />
    </>
  );
}
