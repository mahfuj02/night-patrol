import { buildingStretches } from '@/content/buildings';
import {
  landmarkFrame,
  landmarkPlacements,
  reservedRect,
  sceneryPlacements,
} from '../Landmarks/placement';
import { crossings } from '../Road/crossings';
import { routeModel } from '../Road/route';
import { buildBuildings } from './buildingLayout';

/** The ground the landmarks and the scenery stand on, which ordinary buildings leave free. */
export const reservedForLandmarks = [...landmarkPlacements, ...sceneryPlacements].map((placement) =>
  reservedRect(landmarkFrame(routeModel, placement), placement),
);

/** Every ordinary building in the scene, built once and shared by the buildings and back lanes. */
export const sceneBuildings = buildBuildings(
  routeModel,
  buildingStretches,
  crossings,
  reservedForLandmarks,
);
