import { Vector3 } from 'three';

/** The car's world position and heading this frame. Written by Car, read by the snow. */
export const carState = {
  position: new Vector3(),
  forward: new Vector3(0, 0, 1),
};
