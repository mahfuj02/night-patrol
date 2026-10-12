import { KEY_NUDGE } from './route';

export type DriveAction = { type: 'nudge'; delta: number } | { type: 'step'; dir: 1 | -1 };

/**
 * Maps a key press to a drive action, or null if the key is not ours.
 * In reduced-motion mode arrows step between stops instead of scrubbing continuously.
 */
export function actionForKey(
  key: string,
  shiftKey: boolean,
  reducedMotion: boolean,
): DriveAction | null {
  switch (key) {
    case ' ':
      return { type: 'step', dir: shiftKey ? -1 : 1 };
    case 'PageDown':
      return { type: 'step', dir: 1 };
    case 'PageUp':
      return { type: 'step', dir: -1 };
    case 'ArrowDown':
    case 'ArrowRight':
      return reducedMotion ? { type: 'step', dir: 1 } : { type: 'nudge', delta: KEY_NUDGE };
    case 'ArrowUp':
    case 'ArrowLeft':
      return reducedMotion ? { type: 'step', dir: -1 } : { type: 'nudge', delta: -KEY_NUDGE };
    default:
      return null;
  }
}

const INTERACTIVE_SELECTOR = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  'summary',
  '[contenteditable=""]',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
  '[role="button"]',
  '[role="link"]',
  '[role="slider"]',
  '[role="textbox"]',
  '[role="menuitem"]',
  '[role="tab"]',
  '[role="dialog"]',
].join(',');

/**
 * True when a key press happened on (or inside) something that has its own keyboard behaviour.
 * Drive shortcuts must never steal keys from focused controls, so keyboard and screen reader
 * users keep normal behaviour everywhere except the bare page.
 */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE_SELECTOR) !== null;
}
