import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Vector3 } from 'three';
import { easeInOut, parkingPath, type ParkingPath } from '@/lib/parking';
import {
  BACK_OUT_SECONDS,
  TURN_IN_SECONDS,
  advanceManeuver,
  stationGlow,
  type StationPhase,
} from '@/lib/station';
import { fitDistance, isWallLegible } from '@/lib/stationCamera';
import { matrix3dFor, quadWidth, type Quad } from '@/lib/homography';
import { wallDom } from '@/lib/wallDom';
import { stops } from '@/content/stops';
import { signedGap } from '@/lib/loopRoute';
import { STOP_VISITS, patrolLoop as loop } from '@/lib/patrolLoop';
import { useDriveStore } from '@/store/drive';
import { progress } from '../progress';
import { loopPoseAt } from '../Road/loop';
import { CAR_HALF_LENGTH } from './stationGeometry';
import { stationFrames } from './stationFrames';
import { stationView } from './stationView';

/** How close (in metres of driving) the car must be to a stop for a station chosen from the map to open. */
const ARRIVED = 2.5;

/** The stop index of every station, to tell when the car has arrived at one from either direction. */
const stationStopIndex = stationFrames.map((frame) =>
  stops.findIndex((stop) => stop.id === frame.station.stopId),
);

/** True when the car is at a visit to the stop (outbound or heading back). */
function atStopVisit(stopIndex: number): boolean {
  return STOP_VISITS.some(
    (v) => v.stop === stopIndex && Math.abs(signedGap(loop, progress.s, v.s)) < ARRIVED,
  );
}

const corner = new Vector3();

/** Progress of the wall content fade, over the later part of the turn in. */
const contentOpacity = (glow: number) => Math.min(1, Math.max(0, (glow - 0.35) / 0.65));

/**
 * Runs the station arrival each frame: while the store says the car is turning in, parked or backing
 * out, it moves the car along a smooth path between the road and the bay, ramps the headlight and
 * wall glow, works out where the camera should be, and tells the store when a manoeuvre is done.
 * Under reduced motion every manoeuvre finishes at once (a cut). Runs before the car and camera.
 */
export function StationDriver({ reducedMotion }: { reducedMotion: boolean }) {
  const local = useRef<{
    phase: StationPhase;
    p: number;
    s: number;
    sStart: number;
    path: ParkingPath | null;
  }>({ phase: 'idle', p: 0, s: 0, sStart: 1, path: null });

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const { station, finishManeuver, pendingOpen, openStation } = useDriveStore.getState();
    const l = local.current;

    // A station chosen from the map opens as soon as the car has arrived at its stop.
    if (pendingOpen !== null && station.phase === 'idle') {
      if (atStopVisit(stationStopIndex[pendingOpen] ?? -1)) openStation();
    }
    const frame = station.index !== null ? stationFrames[station.index] : undefined;

    if (station.phase !== l.phase) {
      if (station.phase === 'turning-in' && frame) {
        // From where the car is on the road, with the road's heading, to the bay.
        l.path = parkingPath(loopPoseAt(progress.s), frame.geometry.car);
        l.p = 0;
        l.s = 0;
      } else if (station.phase === 'backing-out') {
        l.p = 0;
        l.sStart = l.s;
      } else if (station.phase === 'parked') {
        l.s = 1;
        l.p = 1;
      } else {
        l.path = null;
        l.s = 0;
        l.p = 0;
      }
      l.phase = station.phase;
    }

    if (!frame || !l.path || station.phase === 'idle') {
      stationView.active = false;
      stationView.glow = 0;
      stationView.station = -1;
      return;
    }

    if (station.phase === 'turning-in') {
      l.p = advanceManeuver(l.p, dt, TURN_IN_SECONDS, reducedMotion);
      l.s = easeInOut(l.p);
      if (l.p >= 1) finishManeuver();
    } else if (station.phase === 'backing-out') {
      l.p = advanceManeuver(l.p, dt, BACK_OUT_SECONDS, reducedMotion);
      l.s = l.sStart * (1 - easeInOut(l.p));
      if (l.p >= 1) finishManeuver();
    }

    const pose = l.path.pose(l.s);
    stationView.active = true;
    stationView.station = frame.index;
    stationView.x = pose.x;
    stationView.z = pose.z;
    stationView.heading = pose.heading;
    stationView.glow = stationGlow(station.phase, l.p);

    // The parked view: behind the car on the line to the wall, far enough that the rectangle fits.
    const { geometry, station: data } = frame;
    const aspect = state.size.width / Math.max(1, state.size.height);
    const rect = data.wall.rect;
    const distance = Math.max(
      data.bay.depth + CAR_HALF_LENGTH + data.camera.back,
      fitDistance(rect.width, rect.height, data.camera.fov, aspect),
    );
    const view = stationView.camera;
    view.x = geometry.wall.centre.x + geometry.wall.normal.x * distance;
    view.z = geometry.wall.centre.z + geometry.wall.normal.z * distance;
    view.y = data.camera.up;
    view.lookX = geometry.wall.centre.x;
    view.lookY = geometry.wall.centre.y;
    view.lookZ = geometry.wall.centre.z;
    view.fov = data.camera.fov;
  }, -0.8);

  return null;
}

/**
 * Puts the wall content on the wall: once the camera has moved this frame, it projects the four
 * corners of the lit rectangle to the screen and gives the wall element the CSS transform that lands
 * it there. Also decides whether the text is big enough to read, and if not, asks for the sheet.
 * It must run after the camera, so it is mounted after the camera rig and keeps the default priority:
 * a positive useFrame priority would take over rendering, and the low tier (which has no
 * post-processing to render for it) would draw nothing.
 */
export function WallProjector() {
  const last = useRef<string>('');

  useFrame((state) => {
    const element = wallDom.element;
    if (!element) return;
    const { station, setWallLegible } = useDriveStore.getState();
    const frame = stationView.station >= 0 ? stationFrames[stationView.station] : undefined;
    if (!stationView.active || !frame || station.phase === 'idle') {
      if (element.style.visibility !== 'hidden') element.style.visibility = 'hidden';
      return;
    }

    const { camera, size } = state;
    camera.updateMatrixWorld();
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    const quad = frame.geometry.wall.corners.flatMap((c) => {
      corner.copy(c).project(camera);
      return [(corner.x * 0.5 + 0.5) * size.width, (0.5 - corner.y * 0.5) * size.height];
    }) as Quad;

    const css = matrix3dFor(wallDom.width, wallDom.height, quad);
    if (css && css !== last.current) {
      element.style.transform = css;
      last.current = css;
    }
    element.style.opacity = String(contentOpacity(stationView.glow));
    if (element.style.visibility !== 'visible') element.style.visibility = 'visible';

    if (station.phase === 'parked') {
      setWallLegible(isWallLegible(quadWidth(quad), wallDom.width, size.width));
    }
  });

  return null;
}
