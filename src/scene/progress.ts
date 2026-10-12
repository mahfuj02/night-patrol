/**
 * The eased, on-screen route progress (0..1). Written once per frame by ProgressDriver and read
 * by the car and camera. A plain mutable object keeps per-frame updates out of React state.
 */
export const progress = { t: 0 };
