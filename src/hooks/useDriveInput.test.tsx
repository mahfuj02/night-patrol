import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { patrolLoop as loop, START_S } from '@/lib/patrolLoop';
import { KEY_NUDGE, wheelToDelta } from '@/lib/route';
import { useDriveStore } from '@/store/drive';
import { resetDrive } from '@/store/driveTestUtils';
import { useDriveInput } from './useDriveInput';

const state = () => useDriveStore.getState();
/** How far the request is ahead of the first stop, in metres. */
const ahead = () => state().target - START_S;

function setup(reducedMotion = false) {
  const container = document.createElement('div');
  document.body.append(container);
  const ref = { current: container };
  const hook = renderHook(() => useDriveInput(ref, reducedMotion));
  return { container, hook };
}

function touch(container: HTMLElement, type: string, y: number) {
  const event = new Event(type, { bubbles: true });
  Object.assign(event, { touches: type === 'touchend' ? [] : [{ clientY: y }] });
  container.dispatchEvent(event);
}

describe('useDriveInput', () => {
  beforeEach(() => {
    resetDrive();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  it('nudges on wheel', () => {
    const { container } = setup();
    container.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }));
    expect(ahead()).toBeCloseTo(wheelToDelta(100, 0) * loop.spec.road, 6);
    // Scrolling back brakes: the request comes back to the car, which has not moved.
    container.dispatchEvent(new WheelEvent('wheel', { deltaY: -100 }));
    expect(ahead()).toBeCloseTo(0, 6);
    expect(state().braked).toBe(true);
  });

  it('drives on with Page Down and the down arrow, and brakes with Page Up and the up arrow', () => {
    setup();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));
    expect(state().stopIndex).toBe(1);
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true }));
    // The car has not moved (nothing is driving it here), so braking pulls the request back to it.
    expect(state().braked).toBe(true);
    expect(state().stopIndex).toBe(0);
    resetDrive();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(ahead()).toBeCloseTo(KEY_NUDGE * loop.spec.road, 6);
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(state().braked).toBe(true);
    expect(ahead()).toBeCloseTo(0, 6);
  });

  it('does not steal keys from focused controls or modified shortcuts', () => {
    setup();
    const button = document.createElement('button');
    document.body.append(button);
    button.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(ahead()).toBe(0);
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'PageDown', ctrlKey: true, bubbles: true }),
    );
    expect(ahead()).toBe(0);
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(ahead()).toBe(0);
  });

  it('never prevents the default action of a key', () => {
    setup();
    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    document.body.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('nudges on upward swipe', () => {
    const { container } = setup();
    touch(container, 'touchstart', 400);
    touch(container, 'touchmove', 300);
    expect(ahead()).toBeGreaterThan(0);
    touch(container, 'touchmove', 400);
    touch(container, 'touchend', 0);
    expect(ahead()).toBeCloseTo(0, 6);
  });

  it('ignores a touch move that never started', () => {
    const { container } = setup();
    touch(container, 'touchmove', 300);
    expect(ahead()).toBe(0);
  });

  it('under reduced motion, steps one stop per wheel gesture with a cooldown', () => {
    vi.useFakeTimers();
    const { container } = setup(true);
    container.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }));
    container.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }));
    expect(state().stopIndex).toBe(1);
    vi.advanceTimersByTime(600);
    container.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }));
    expect(state().stopIndex).toBe(2);
    vi.advanceTimersByTime(600);
    container.dispatchEvent(new WheelEvent('wheel', { deltaY: -100 }));
    expect(state().braked).toBe(true);
    expect(state().stopIndex).toBe(0);
    vi.advanceTimersByTime(600);
    container.dispatchEvent(new WheelEvent('wheel', { deltaY: 0 }));
    expect(state().stopIndex).toBe(0);
  });

  it('under reduced motion, steps on a long swipe and ignores a short one', () => {
    vi.useFakeTimers();
    const { container } = setup(true);
    touch(container, 'touchstart', 400);
    touch(container, 'touchmove', 380);
    touch(container, 'touchend', 0);
    expect(ahead()).toBe(0);
    touch(container, 'touchstart', 400);
    touch(container, 'touchmove', 300);
    touch(container, 'touchend', 0);
    expect(state().stopIndex).toBe(1);
  });

  it('under reduced motion, arrow keys step', () => {
    setup(true);
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(state().stopIndex).toBe(1);
  });

  it('removes its listeners on unmount', () => {
    const { container, hook } = setup();
    hook.unmount();
    container.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }));
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));
    expect(ahead()).toBe(0);
  });

  it('does nothing without a container', () => {
    const ref = { current: null };
    expect(() => renderHook(() => useDriveInput(ref, false))).not.toThrow();
  });
});
