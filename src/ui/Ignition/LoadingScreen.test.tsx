import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { INTRO_PATIENCE_MS } from '@/lib/intro';
import { INITIAL_STATION } from '@/lib/station';
import { useDriveStore } from '@/store/drive';
import { useIntroStore } from '@/store/intro';
import { LoadingScreen } from './LoadingScreen';

const intro = () => useIntroStore.getState();
const screenEl = () => screen.getByTestId('loading-screen');

describe('LoadingScreen', () => {
  beforeEach(() => {
    act(() => {
      useIntroStore.getState().reset();
      useDriveStore.setState({ station: INITIAL_STATION, pendingOpen: null });
      useDriveStore.getState().goToStop(0);
    });
    window.history.replaceState({}, '', '/');
  });
  afterEach(() => vi.useRealTimers());

  it('shows the fuel gauge as a labelled progress bar and the percentage as text', () => {
    render(<LoadingScreen />);
    const bar = screen.getByRole('progressbar', { name: 'Fuel: engine start-up progress' });
    expect(bar).toHaveAttribute('aria-valuenow', '0');
    act(() => intro().report(42, true, 10));
    expect(bar).toHaveAttribute('aria-valuenow', '42');
    expect(screen.getByRole('status')).toHaveTextContent('Starting the engine… 42%');
    expect(screen.queryByRole('button', { name: 'Start Patrol' })).toBeNull();
  });

  it('always offers the skip link to the simple view', () => {
    render(<LoadingScreen />);
    expect(screen.getByRole('link', { name: 'Skip to simple view' })).toHaveAttribute(
      'href',
      '/simple',
    );
  });

  it('offers Start Patrol when ready, and puts focus on it', () => {
    render(<LoadingScreen />);
    act(() => {
      intro().report(100, false, 10);
      intro().markFramed();
    });
    const start = screen.getByRole('button', { name: 'Start Patrol' });
    expect(start).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Engine ready.');
  });

  it('starts the patrol with the mouse: the screen goes, the car pulls out to the next stop', async () => {
    const user = userEvent.setup();
    render(<LoadingScreen />);
    act(() => intro().giveUpWaiting());
    await user.click(screen.getByRole('button', { name: 'Start Patrol' }));
    expect(intro().phase).toBe('started');
    expect(screenEl()).toHaveAttribute('aria-hidden', 'true');
    expect(screenEl()).toHaveAttribute('inert');
    expect(useDriveStore.getState().stopIndex).toBe(1);
  });

  it('starts the patrol from the keyboard', async () => {
    const user = userEvent.setup();
    render(<LoadingScreen />);
    act(() => intro().giveUpWaiting());
    await user.keyboard('{Enter}');
    expect(intro().phase).toBe('started');
  });

  it('offers Start Patrol after a wait even if the scene never finishes', () => {
    vi.useFakeTimers();
    render(<LoadingScreen />);
    expect(screenEl()).toHaveAttribute('data-phase', 'loading');
    act(() => {
      vi.advanceTimersByTime(INTRO_PATIENCE_MS);
    });
    expect(screenEl()).toHaveAttribute('data-phase', 'ready');
    expect(screen.getByRole('button', { name: 'Start Patrol' })).toBeInTheDocument();
  });

  it('is skipped with ?intro=off', () => {
    window.history.replaceState({}, '', '/?intro=off');
    render(<LoadingScreen />);
    expect(intro().phase).toBe('started');
    expect(screenEl()).toHaveAttribute('aria-hidden', 'true');
    // Skipping does not move the car.
    expect(useDriveStore.getState().stopIndex).toBe(0);
  });
});
