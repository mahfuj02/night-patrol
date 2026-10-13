import { buildingStretches } from '@/content/buildings';
import { reservedRect, landmarkFrame, rrcPlacement } from '../Landmarks/placement';
import { crossings } from '../Road/crossings';
import { routeModel } from '../Road/route';
import { buildBuildings } from './buildingLayout';

/** The ground the landmarks stand on, which ordinary buildings leave free. */
export const reservedForLandmarks = [
  reservedRect(landmarkFrame(routeModel, rrcPlacement), rrcPlacement),
];

/** Every ordinary building in the scene, built once and shared by the buildings and back lanes. */
export const sceneBuildings = buildBuildings(
  routeModel,
  buildingStretches,
  crossings,
  reservedForLandmarks,
);
