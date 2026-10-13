/**
 * What the station driver tells the car, the camera and the lights each frame. A plain mutable
 * object, written once per frame by StationDriver, so nothing here goes through React state.
 */
export const stationView = {
  /** True from the moment the car leaves the road for a bay until it is back on it. */
  active: false,
  /** The car's pose while active: ground position and heading (the car faces (sin h, cos h)). */
  x: 0,
  z: 0,
  heading: 0,
  /** How lit the headlights and the wall are, 0 to 1. */
  glow: 0,
  /** The index of the station being visited, or -1. */
  station: -1,
  /** Where the camera should be and what it looks at, when `glow` pulls it toward the wall. */
  camera: { x: 0, y: 0, z: 0, lookX: 0, lookY: 0, lookZ: 0, fov: 55 },
};
