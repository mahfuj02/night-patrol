import { buildLamps } from './lampLayout';
import { routeModel } from './route';

/** Every lamp along the route, built once. Shared by the streetlights and the snow. */
export const lamps = buildLamps(routeModel);
