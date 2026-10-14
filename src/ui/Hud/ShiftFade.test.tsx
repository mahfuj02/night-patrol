import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { stops } from '@/content';
import { SHIFT_FADE_MS } from '@/lib/shift';
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

  it('fades to black, resets at the cut, fades back and finishes', () => {
    stubMotion(false);
    render(<ShiftFade />);
    act(() => state().startNewPatrol());
    expect(veil()).toHaveStyle({ opacity: '1' });
    expect(state().shift).toBe('fading-out');
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

  it('cuts under reduced motion: no veil is shown and the reset runs at once', () => {
    stubMotion(true);
    render(<ShiftFade />);
    act(() => state().startNewPatrol());
    expect(veil()).toHaveStyle({ visibility: 'hidden' });
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
