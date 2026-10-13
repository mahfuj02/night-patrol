/**
 * The DOM element that carries the wall content, shared between the UI (which renders and registers
 * it) and the scene (which positions it on the projected wall every frame the car is parked). A plain
 * object, so per-frame writes stay out of React state.
 */
export const wallDom: {
  element: HTMLElement | null;
  /** Layout size in CSS pixels, set by the component that renders the wall. */
  width: number;
  height: number;
} = { element: null, width: 720, height: 400 };
