import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { stops } from '@/content';
import { useDriveStore } from '@/store/drive';
import { DriveControls } from './DriveControls';

const state = () => useDriveStore.getState();

describe('DriveControls', () => {
  beforeEach(() => {
    state().goToStop(0);
  });

  it('announces the first stop and disables Prev there', () => {
    render(<DriveControls />);
    expect(screen.getByRole('status')).toHaveTextContent(`Stop 1 of ${stops.length}: Ignition`);
    expect(screen.getByRole('button', { name: '‹ Prev' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Next stop ›' })).toHaveAttribute(
      'aria-disabled',
      'false',
    );
  });

  it('moves to the next stop with the mouse', async () => {
    const user = userEvent.setup();
    render(<DriveControls />);
    await user.click(screen.getByRole('button', { name: 'Next stop ›' }));
    expect(screen.getByRole('status')).toHaveTextContent('Stop 2 of 11: Dispatch');
    await user.click(screen.getByRole('button', { name: '‹ Prev' }));
    expect(screen.getByRole('status')).toHaveTextContent('Stop 1 of 11: Ignition');
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

  it('is reachable by Tab, simple-view link first', async () => {
    const user = userEvent.setup();
    render(<DriveControls />);
    await user.tab();
    expect(screen.getByRole('link', { name: 'Simple view' })).toHaveFocus();
    expect(screen.getByRole('link', { name: 'Simple view' })).toHaveAttribute('href', '/simple');
    await user.tab();
    // Prev is inert at the first stop but stays in the tab order, so focus is never lost.
    expect(screen.getByRole('button', { name: '‹ Prev' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Next stop ›' })).toHaveFocus();
  });

  it('stays quiet while driving between stops and shows En route', () => {
    state().nudge((stops[1]!.t + stops[2]!.t) / 2);
    render(<DriveControls />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(screen.getByText('En route')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '‹ Prev' })).toHaveAttribute(
      'aria-disabled',
      'false',
    );
  });

  it('disables Next at the last stop', () => {
    state().goToStop(stops.length - 1);
    render(<DriveControls />);
    expect(screen.getByRole('button', { name: 'Next stop ›' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('status')).toHaveTextContent('The Forks: End of shift');
  });

  it('keeps focus on a button that becomes inert, and ignores its clicks', async () => {
    const user = userEvent.setup();
    state().goToStop(stops.length - 2);
    render(<DriveControls />);
    const next = screen.getByRole('button', { name: 'Next stop ›' });
    next.focus();
    await user.keyboard('{Enter}');
    expect(state().stopIndex).toBe(stops.length - 1);
    expect(next).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.click(next);
    expect(state().stopIndex).toBe(stops.length - 1);
    expect(next).toHaveFocus();
  });

  it('labels the navigation landmark', () => {
    render(<DriveControls />);
    expect(screen.getByRole('navigation', { name: 'Patrol controls' })).toBeInTheDocument();
  });
});
