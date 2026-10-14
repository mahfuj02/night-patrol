import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { stops } from '@/content';
import { LOOP_STALL_MS, SHIFT_FADE_MS } from '@/lib/shift';
import { INITIAL_STATION } from '@/lib/station';
import { useDriveStore } from '@/store/drive';
import { ShiftFade } from './ShiftFade';

const state = () => useDriveStore.getState();
const veil = () => screen.getByTestId('shift-fade');

function stubMotion(reduced: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: reduced,
      addEventListener: () => {},
      removeEventListener: () => {},
    })),
  );
}

describe('ShiftFade', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    act(() => {
      useDriveStore.setState({
        station: INITIAL_STATION,
        pendingOpen: null,
        shift: 'idle',
        resetCount: 0,
      });
      state().goToStop(stops.length - 1);
    });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('is invisible and out of the way until the shift ends', () => {
    stubMotion(false);
    render(<ShiftFade />);
    expect(veil()).toHaveStyle({ opacity: '0' });
    expect(veil()).toHaveAttribute('aria-hidden', 'true');
    expect(veil()).toHaveClass('pointer-events-none');
  });

  it('stays clear while the car loops, fades to black after the lap, resets at the cut and fades back', () => {
    stubMotion(false);
    render(<ShiftFade />);
    act(() => state().startNewPatrol());
    expect(state().shift).toBe('looping');
    expect(veil()).toHaveStyle({ opacity: '0' });
    // The scene ends the lap.
    act(() => state().finishLoop());
    expect(veil()).toHaveStyle({ opacity: '1' });
    act(() => {
      vi.advanceTimersByTime(SHIFT_FADE_MS);
    });
    expect(state().shift).toBe('fading-in');
    expect(state().stopIndex).toBe(0);
    expect(veil()).toHaveStyle({ opacity: '0' });
    act(() => {
      vi.advanceTimersByTime(SHIFT_FADE_MS);
    });
    expect(state().shift).toBe('idle');
  });

  it('moves on from a lap the scene has stopped drawing, after the stall limit', () => {
    stubMotion(false);
    render(<ShiftFade />);
    act(() => state().startNewPatrol());
    act(() => {
      vi.advanceTimersByTime(LOOP_STALL_MS - 1);
    });
    expect(state().shift).toBe('looping');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(state().shift).toBe('fading-out');
  });

  it('never cuts short a lap that is still being drawn, however slowly: each frame restarts the clock', () => {
    stubMotion(false);
    render(<ShiftFade />);
    act(() => state().startNewPatrol());
    // A slow machine: a frame every 20 seconds for ten minutes, far longer than the stall limit.
    for (let i = 0; i < 30; i++) {
      act(() => {
        vi.advanceTimersByTime(LOOP_STALL_MS - 10_000);
        state().tickLoop();
      });
      expect(state().shift).toBe('looping');
    }
    // Then it stops drawing: the stall limit applies from the last frame.
    act(() => {
      vi.advanceTimersByTime(LOOP_STALL_MS);
    });
    expect(state().shift).toBe('fading-out');
  });

  it('only counts frames while looping', () => {
    stubMotion(false);
    render(<ShiftFade />);
    const before = state().loopTicks;
    act(() => state().tickLoop());
    expect(state().loopTicks).toBe(before);
    act(() => state().startNewPatrol());
    act(() => state().tickLoop());
    expect(state().loopTicks).toBe(before + 1);
  });

  it('cuts under reduced motion: no lap, no veil, and the reset runs at once', () => {
    stubMotion(true);
    render(<ShiftFade />);
    act(() => state().startNewPatrol());
    expect(veil()).toHaveStyle({ visibility: 'hidden' });
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(state().shift).toBe('fading-out');
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(state().shift).toBe('fading-in');
    expect(state().stopIndex).toBe(0);
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(state().shift).toBe('idle');
  });
});
