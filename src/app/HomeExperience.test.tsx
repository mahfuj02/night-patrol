import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { START_S } from '@/lib/patrolLoop';
import { useDriveStore } from '@/store/drive';
import { useIntroStore } from '@/store/intro';
import { HomeExperience } from './HomeExperience';

const webgl = vi.hoisted(() => ({ value: true as boolean | null }));

vi.mock('@/hooks/useWebGLSupport', () => ({ useWebGLSupport: () => webgl.value }));
vi.mock('next/dynamic', () => ({
  default: () =>
    function MockScene() {
      return <div data-testid="scene" />;
    },
}));

const state = () => useDriveStore.getState();

describe('HomeExperience', () => {
  beforeEach(() => {
    webgl.value = true;
    // Most tests are about the drive, so start past the loading screen.
    useIntroStore.getState().start();
    state().goToStop(0);
  });

  it('shows the simple-version fallback without WebGL, with no controls', () => {
    webgl.value = false;
    render(<HomeExperience />);
    expect(screen.getByRole('heading', { level: 1, name: 'Night Patrol' })).toBeInTheDocument();
    expect(screen.getByText(/cannot show the 3D drive/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View the simple version' })).toHaveAttribute(
      'href',
      '/simple',
    );
    expect(screen.queryByTestId('scene')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next stop ›' })).not.toBeInTheDocument();
  });

  it('shows a loading message while WebGL support is unknown', () => {
    webgl.value = null;
    render(<HomeExperience />);
    expect(screen.getByText('Starting the engine…')).toBeInTheDocument();
    expect(screen.queryByTestId('scene')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next stop ›' })).toBeInTheDocument();
  });

  it('hides the scene from assistive tech but keeps the controls and h1 reachable', () => {
    render(<HomeExperience />);
    expect(screen.getByTestId('scene').parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('heading', { level: 1, name: 'Night Patrol' })).toBeVisible();
    expect(screen.getByRole('navigation', { name: 'Patrol controls' })).toBeInTheDocument();
  });

  it('drives with the keyboard and announces the new stop', () => {
    render(<HomeExperience />);
    act(() => {
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));
    });
    // The stop announcement is in the drive controls; the station and the panel have their own.
    const controls = screen.getByRole('navigation', { name: 'Patrol controls' });
    expect(within(controls).getByRole('status')).toHaveTextContent('Stop 2 of 11: Dispatch');
  });

  it('drives with the wheel over the scene', () => {
    render(<HomeExperience />);
    fireEvent.wheel(screen.getByTestId('scene').parentElement!, { deltaY: 100 });
    expect(state().target).toBeGreaterThan(START_S);
  });

  it('does not trap the keyboard: Tab reaches the link and buttons, and Space on a button acts once', async () => {
    const user = userEvent.setup();
    render(<HomeExperience />);
    await user.tab();
    expect(screen.getByRole('link', { name: 'Simple view' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: '‹ Brake' })).toHaveFocus();
    await user.tab();
    const next = screen.getByRole('button', { name: 'Next stop ›' });
    expect(next).toHaveFocus();
    await user.keyboard(' ');
    expect(state().stopIndex).toBe(1);
  });

  describe('the Ignition loading screen', () => {
    it('covers the page and makes the controls inert until Start Patrol', () => {
      useIntroStore.getState().reset();
      render(<HomeExperience />);
      expect(screen.getByTestId('loading-screen')).toHaveAttribute('data-phase', 'loading');
      const controls = screen.getByRole('navigation', { name: 'Patrol controls', hidden: true });
      expect(controls.closest('[inert]')).not.toBeNull();
      act(() => useIntroStore.getState().start());
      expect(controls.closest('[inert]')).toBeNull();
    });

    it('does not drive the car from the keyboard while it is up', async () => {
      const user = userEvent.setup();
      useIntroStore.getState().reset();
      render(<HomeExperience />);
      await user.keyboard('{ArrowDown}{ArrowDown}{PageDown}');
      expect(state().stopIndex).toBe(0);
      expect(state().target).toBe(START_S);
    });

    it('is not shown without WebGL', () => {
      useIntroStore.getState().reset();
      webgl.value = false;
      render(<HomeExperience />);
      expect(screen.queryByTestId('loading-screen')).toBeNull();
    });
  });
});
