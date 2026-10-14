import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { useDriveStore } from '@/store/drive';
import { progress } from '../progress';
import { stationView } from '../Stations/stationView';
import { ROUNDABOUT, loopPath, type LoopPath } from './roundabout';
import { routeModel } from './route';

/** The car speeds up over this many metres and slows down over the same at the end of the loop. */
const EASE_METRES = 12;
/** It never slows below this share of its speed, so the loop does not stall at the ends. */
const MIN_SPEED = 0.3;

/**
 * Drives the end-of-shift loop: while the store says the shift is `looping`, the car follows the
 * loop path (along the road to its end, then once round the roundabout) and the chase camera
 * follows behind it, through the same pose the station arrival uses. When the lap is done it tells
 * the store, which fades out; the car holds its last pose behind the veil until the reset. Under
 * reduced motion the loop never runs (the shift cuts straight to the fade). Runs after the
 * station driver, before the car and camera.
 */
export function RoundaboutDriver() {
  const run = useRef<{ path: LoopPath; distance: number } | null>(null);

  useFrame((_, delta) => {
    const { shift, finishLoop } = useDriveStore.getState();
    if (shift === 'idle' || shift === 'fading-in') {
      run.current = null;
      return;
    }
    if (shift === 'looping' && !run.current) {
      run.current = { path: loopPath(routeModel, progress.t), distance: 0 };
    }
    const r = run.current;
    if (!r) return;

    if (shift === 'looping') {
      const { distance, path } = r;
      const ease = Math.min(
        1,
        (distance + 1) / EASE_METRES,
        (path.length - distance + 1) / EASE_METRES,
      );
      const speed = ROUNDABOUT.speed * Math.max(MIN_SPEED, ease);
      r.distance = Math.min(path.length, distance + Math.min(delta, 0.1) * speed);
      if (r.distance >= path.length) finishLoop();
    }

    const pose = r.path.pose(r.distance);
    stationView.active = true;
    stationView.station = -1;
    stationView.glow = 0;
    stationView.x = pose.x;
    stationView.z = pose.z;
    stationView.heading = pose.heading;
  }, -0.7);

  return null;
}
