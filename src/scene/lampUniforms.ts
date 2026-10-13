import { MathUtils, Vector3, Vector4 } from 'three';
import { lampWindow } from '@/lib/snow';
import { carState } from './carState';
import { lamps } from './Road/lamps';
import { stationView } from './Stations/stationView';

/** Slots in the lamp arrays: the nearest streetlights, then the two headlights. */
export const MAX_LAMPS = 14;
const LAMPS_BEHIND = 3;
const LAMPS_AHEAD = 8;
const STREET_SLOTS = MAX_LAMPS - 2;

// A streetlight lights a wide cone below its head; the headlights use a tight cone.
const STREET_COS_HALF = Math.cos(MathUtils.degToRad(62));
const STREET_GAIN = 2.8;
const STREET_RANGE_PER_METRE = 3.4;
const HEADLIGHT_COS_HALF = Math.cos(0.42);
const HEADLIGHT_RANGE = 34;
const HEADLIGHT_COLOR: [number, number, number] = [1, 0.92, 0.77];
const HEADLIGHT_GAIN = 1.5;
// Parked at a station wall, the headlights are stronger, reach further, spread wider and tip up.
const PARKED_GAIN = 1.6;
const PARKED_RANGE = 0.5;
const PARKED_COS_HALF = Math.cos(0.75);
const PARKED_AIM_Y = 0.32;

const lampUs = lamps.map((lamp) => lamp.u);

/**
 * The lamps nearest the car, as shader uniforms shared by everything that is lit by them (the
 * falling snow and the trees): position and range (xyz, w), cone axis and cosine of the half angle
 * (xyz, w), and colour times strength. Unused slots have zero colour. Module-level so per-frame
 * writes stay out of React state and memoised materials.
 */
export const lampUniforms = {
  uLampPos: { value: Array.from({ length: MAX_LAMPS }, () => new Vector4()) },
  uLampDir: { value: Array.from({ length: MAX_LAMPS }, () => new Vector4(0, -1, 0, 1)) },
  uLampCol: { value: Array.from({ length: MAX_LAMPS }, () => new Vector3()) },
};

const forward = new Vector3();
const right = new Vector3();
const aim = new Vector3();

/** Refreshes the lamp uniforms for route progress `t`. Called once per frame by AtmosphereDriver. */
export function updateLampUniforms(t: number): void {
  const { uLampPos, uLampDir, uLampCol } = lampUniforms;

  const [start, end] = lampWindow(lampUs, t, LAMPS_BEHIND, LAMPS_AHEAD);
  let n = 0;
  for (let i = start; i < end && n < STREET_SLOTS; i++, n++) {
    const lamp = lamps[i]!;
    uLampPos.value[n]!.set(
      lamp.head.x,
      lamp.head.y,
      lamp.head.z,
      lamp.height * STREET_RANGE_PER_METRE,
    );
    uLampDir.value[n]!.set(0, -1, 0, STREET_COS_HALF);
    uLampCol.value[n]!.set(...lamp.color).multiplyScalar(lamp.intensity * STREET_GAIN);
  }

  forward.copy(carState.forward);
  right.set(forward.z, 0, -forward.x);
  const glow = stationView.glow;
  aim.set(forward.x, -0.09 + (PARKED_AIM_Y + 0.09) * glow, forward.z).normalize();
  const cosHalf = HEADLIGHT_COS_HALF + (PARKED_COS_HALF - HEADLIGHT_COS_HALF) * glow;
  for (const side of [-1, 1]) {
    uLampPos.value[n]!.set(
      carState.position.x + forward.x * 2.1 + right.x * 0.65 * side,
      carState.position.y + 0.75,
      carState.position.z + forward.z * 2.1 + right.z * 0.65 * side,
      HEADLIGHT_RANGE * (1 + PARKED_RANGE * glow),
    );
    uLampDir.value[n]!.set(aim.x, aim.y, aim.z, cosHalf);
    uLampCol.value[n]!.set(...HEADLIGHT_COLOR).multiplyScalar(
      HEADLIGHT_GAIN * (1 + PARKED_GAIN * glow),
    );
    n++;
  }
  for (; n < MAX_LAMPS; n++) uLampCol.value[n]!.set(0, 0, 0);
}
