import { loopMetres, route } from '@/content/route';
import { stations } from '@/content/stations';
import { stops } from '@/content/stops';
import {
  createLoop,
  magnetPoints,
  stationLightPoints,
  stopVisits,
  type MagnetPoint,
  type StopPlace,
  type Visit,
} from './loopRoute';

/**
 * The patrol loop of this site, built from the content: the road's length, the two roundabout
 * passes and every stop and station on it. The store and the scene share this one object, so what
 * the visitor asks for and what the car drives can never disagree.
 */
export const patrolLoop = createLoop({ road: route.lengthMetres, ...loopMetres });

/** Where each stop stands, in metres along the road. */
export const stopPlaces: StopPlace[] = stops.map((stop) => ({
  metres: stop.t * route.lengthMetres,
  onReturn: stop.onReturn !== false,
}));

/** Every visit to every stop, in loop order. */
export const STOP_VISITS: readonly Visit[] = stopVisits(patrolLoop, stopPlaces);

/** The stop index of every station, and how far before its stop its red light stands. */
const stationStops = stations.map((station) => ({
  stop: stops.findIndex((s) => s.id === station.stopId),
  offset: station.light.offset,
}));

/**
 * Where the magnet holds the car: every stop visit, and the red light of every station on the way
 * to it, in either direction. The light is `offset` metres before the stop along the way the car is
 * driving, so heading back it is on the other side of the stop.
 */
export const MAGNETS: readonly MagnetPoint[] = magnetPoints(
  STOP_VISITS,
  stationLightPoints(STOP_VISITS, patrolLoop, stationStops),
);

/** Where the patrol starts: the first stop, outbound. */
export const START_S: number = STOP_VISITS.find((v) => v.stop === 0 && v.direction === 1)?.s ?? 0;
