import { route } from '@/content/route';
import { buildCrossings } from './crossStreets';
import { routeModel } from './route';

/** Every cross street along the route, built once. Shared by the roads, buildings and signs. */
export const crossings = buildCrossings(routeModel, route.intersections ?? []);
