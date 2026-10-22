import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { stops } from '@/content';
import { useDriveStore } from '@/store/drive';
import { arriveAt, placeCar, resetDrive, visitOf } from '@/store/driveTestUtils';
import { DriveControls } from './DriveControls';

const state = () => useDriveStore.getState();

describe('DriveControls', () => {
  beforeEach(() => {
    act(() => resetDrive());
  });

  it('announces the first stop and which way the car is heading', () => {
    render(<DriveControls />);
    expect(screen.getByRole('status')).toHaveTextContent(
      `Stop 1 of ${stops.length}: Ignition · outbound`,
    );
    expect(screen.getByRole('button', { name: '‹ Brake' })).toHaveAttribute(
      'aria-disabled',
      'false',
    );
  });

  it('says heading back on the way back', () => {
    render(<DriveControls />);
    act(() => arriveAt(6, -1));
    expect(screen.getByRole('status')).toHaveTextContent(
      `Stop 7 of ${stops.length}: Millennium Library · heading back`,
    );
  });

  it('moves to the next stop with the mouse, and brakes with the Brake button', async () => {
    const user = userEvent.setup();
    render(<DriveControls />);
    await user.click(screen.getByRole('button', { name: 'Next stop ›' }));
    expect(screen.getByRole('status')).toHaveTextContent('Stop 2 of 11: Dispatch · outbound');
    // The car has not moved (nothing is driving it here): braking pulls the request back to it.
    await user.click(screen.getByRole('button', { name: '‹ Brake' }));
    expect(state().braked).toBe(true);
    expect(screen.getByRole('status')).toHaveTextContent('Stop 1 of 11: Ignition · outbound');
  });

  it('moves one stop per Enter or Space press on a focused button', async () => {
    const user = userEvent.setup();
    render(<DriveControls />);
    const next = screen.getByRole('button', { name: 'Next stop ›' });
    next.focus();
    await user.keyboard('{Enter}');
    expect(state().stopIndex).toBe(1);
    await user.keyboard(' ');
    expect(state().stopIndex).toBe(2);
  });

  it('is reachable by Tab: the simple-view link, then Brake, Next stop, Turn around, Start over', async () => {
    const user = userEvent.setup();
    render(<DriveControls />);
    await user.tab();
    expect(screen.getByRole('link', { name: 'Simple view' })).toHaveFocus();
    expect(screen.getByRole('link', { name: 'Simple view' })).toHaveAttribute('href', '/simple');
    for (const name of ['‹ Brake', 'Next stop ›', 'Turn around', 'Start over']) {
      await user.tab();
      expect(screen.getByRole('button', { name })).toHaveFocus();
    }
  });

  it('stays quiet while driving between stops and shows En route with the direction', () => {
    act(() => placeCar((visitOf(1).s + visitOf(2).s) / 2));
    render(<DriveControls />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(screen.getByText('En route · outbound')).toBeInTheDocument();
  });

  it('offers the Turn around hint after braking, and not before', async () => {
    const user = userEvent.setup();
    render(<DriveControls />);
    expect(screen.queryByText(/To drive the other way/)).toBeNull();
    await user.click(screen.getByRole('button', { name: '‹ Brake' }));
    expect(screen.getByText(/Stopped\. To drive the other way, press Turn around/)).toBeVisible();
    // Driving on takes it away.
    act(() => state().nudge(0.02));
    expect(screen.queryByText(/To drive the other way/)).toBeNull();
  });

  it('turns the car round with the Turn around button, once', async () => {
    const user = userEvent.setup();
    render(<DriveControls />);
    await user.click(screen.getByRole('button', { name: 'Turn around' }));
    expect(state().turnRequest).toBe(true);
    // Inert while it turns: another press changes nothing and Brake does nothing either.
    expect(screen.getByRole('button', { name: 'Turn around' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('button', { name: '‹ Brake' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await user.click(screen.getByRole('button', { name: 'Turn around' }));
    expect(state().turnRequest).toBe(true);
  });

  it('is inert on a roundabout, where the car drives itself', () => {
    act(() => state().setArc(true));
    render(<DriveControls />);
    expect(screen.getByRole('button', { name: 'Turn around' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('button', { name: '‹ Brake' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('starts over with the Start over button: fades out and goes back to the first stop', async () => {
    const user = userEvent.setup();
    act(() => arriveAt(6, -1));
    render(<DriveControls />);
    await user.click(screen.getByRole('button', { name: 'Start over' }));
    expect(state().shift).toBe('fading-out');
    expect(screen.getByRole('button', { name: 'Start over' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    act(() => state().completeFadeOut());
    expect(screen.getByRole('status')).toHaveTextContent('Stop 1 of 11: Ignition · outbound');
  });

  it('never offers New patrol, and has no Prev', () => {
    render(<DriveControls />);
    expect(screen.queryByRole('button', { name: /New patrol/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Prev/ })).toBeNull();
    act(() => arriveAt(stops.length - 1));
    expect(screen.getByRole('button', { name: 'Next stop ›' })).toBeInTheDocument();
  });

  it('labels the navigation landmark', () => {
    render(<DriveControls />);
    expect(screen.getByRole('navigation', { name: 'Patrol controls' })).toBeInTheDocument();
  });
});
