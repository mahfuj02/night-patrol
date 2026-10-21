import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SHIFT_FADE_MS } from '@/lib/shift';
import { useDriveStore } from '@/store/drive';
import { arriveAt, resetDrive } from '@/store/driveTestUtils';
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
      resetDrive();
      arriveAt(6, -1);
    });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('is invisible and out of the way until the patrol starts over', () => {
    stubMotion(false);
    render(<ShiftFade />);
    expect(veil()).toHaveStyle({ opacity: '0' });
    expect(veil()).toHaveAttribute('aria-hidden', 'true');
    expect(veil()).toHaveClass('pointer-events-none');
  });

  it('fades to black, cuts back to the first stop heading out, and fades back', () => {
    stubMotion(false);
    render(<ShiftFade />);
    act(() => state().startOver());
    expect(state().shift).toBe('fading-out');
    expect(veil()).toHaveStyle({ opacity: '1' });
    act(() => {
      vi.advanceTimersByTime(SHIFT_FADE_MS);
    });
    expect(state().shift).toBe('fading-in');
    expect(state().stopIndex).toBe(0);
    expect(state().direction).toBe(1);
    expect(veil()).toHaveStyle({ opacity: '0' });
    act(() => {
      vi.advanceTimersByTime(SHIFT_FADE_MS);
    });
    expect(state().shift).toBe('idle');
  });

  it('cuts under reduced motion: no veil, and the reset runs at once', () => {
    stubMotion(true);
    render(<ShiftFade />);
    act(() => state().startOver());
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
