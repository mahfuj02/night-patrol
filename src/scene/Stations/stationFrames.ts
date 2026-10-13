import { route } from '@/content/route';
import { stations } from '@/content/stations';
import { stops } from '@/content/stops';
import type { Station } from '@/content/schema';
import { offsetT } from '@/lib/station';
import { routeModel } from '../Road/route';
import { stationGeometry, type StationGeometry } from './stationGeometry';

/** A station with everything the scene needs, worked out once from its data and the route. */
export interface StationFrame {
  index: number;
  station: Station;
  geometry: StationGeometry;
  /** Where the car stops at the red light, as `t`. */
  lightT: number;
  /** The `t` of the stop the station sits on. */
  stopT: number;
}

export const stationFrames: StationFrame[] = stations.map((station, index) => {
  const stopT = stops.find((s) => s.id === station.stopId)?.t ?? 0;
  return {
    index,
    station,
    geometry: stationGeometry(routeModel, station),
    lightT: offsetT(stopT, station.light.offset, route.lengthMetres),
    stopT,
  };
});
