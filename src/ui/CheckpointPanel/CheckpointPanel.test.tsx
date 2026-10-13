import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { stops } from '@/content';
import { STOP_TS, useDriveStore } from '@/store/drive';
import { DriveControls } from '../DriveControls';
import { CheckpointPanel } from './CheckpointPanel';

const state = () => useDriveStore.getState();
const RRC = stops.findIndex((s) => s.id === 'rrc-campus');
const panel = () => screen.getByRole('complementary', { hidden: true });

function renderBoth() {
  return render(
    <>
      <DriveControls />
      <CheckpointPanel />
    </>,
  );
}

describe('CheckpointPanel', () => {
  beforeEach(() => {
    act(() => state().goToStop(0));
  });

  it('renders nothing until a stop with a checkpoint is reached', () => {
    render(<CheckpointPanel />);
    expect(screen.queryByRole('complementary', { hidden: true })).toBeNull();
  });

  it('opens at the RRC campus with the diploma and the Sprint-Innovation teaser', () => {
    render(<CheckpointPanel />);
    act(() => state().goToStop(RRC));
    const open = screen.getByRole('complementary', {
      name: 'Diploma in Full Stack Web Development',
    });
    expect(open).toHaveAttribute('data-open', 'true');
    expect(open).not.toHaveAttribute('inert');
    expect(screen.getByText('Red River College Polytechnic')).toBeInTheDocument();
    expect(screen.getByText('Sep 2023 \u2013 Aug 2025')).toBeInTheDocument();
    expect(screen.getByText(/Sprint-Innovation 2025: Winner/)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Checkpoint opened: RRC Polytechnic, Exchange District Campus. Press Escape to close it.',
    );
  });

  it('does not take focus when it opens, so driving by keyboard keeps working', () => {
    renderBoth();
    act(() => state().goToStop(RRC));
    expect(document.body).toHaveFocus();
  });

  it('closes with Escape, and stays closed while the visitor stays at the stop', async () => {
    const user = userEvent.setup();
    render(<CheckpointPanel />);
    act(() => state().goToStop(RRC));
    await user.keyboard('{Escape}');
    expect(panel()).toHaveAttribute('data-open', 'false');
    expect(panel()).toHaveAttribute('inert');
    expect(state().dismissedStop).toBe(RRC);
    expect(screen.getAllByRole('status').every((el) => el.textContent === '')).toBe(true);
  });

  it('closes with the close button and gives focus back to Next stop', async () => {
    const user = userEvent.setup();
    renderBoth();
    act(() => state().goToStop(RRC));
    const close = screen.getByRole('button', { name: 'Close checkpoint' });
    close.focus();
    await user.keyboard('{Enter}');
    expect(panel()).toHaveAttribute('data-open', 'false');
    expect(screen.getByRole('button', { name: 'Next stop ›' })).toHaveFocus();
  });

  it('hands focus back to Next stop when Escape closes it from inside', async () => {
    const user = userEvent.setup();
    renderBoth();
    act(() => state().goToStop(RRC));
    screen.getByRole('button', { name: 'Close checkpoint' }).focus();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Next stop ›' })).toHaveFocus();
  });

  it('is reached with Tab straight after the drive controls', async () => {
    const user = userEvent.setup();
    renderBoth();
    act(() => state().goToStop(RRC));
    screen.getByRole('button', { name: 'Next stop ›' }).focus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Close checkpoint' })).toHaveFocus();
  });

  it('slides out when the visitor drives on, and opens again on the way back', async () => {
    const user = userEvent.setup();
    renderBoth();
    act(() => state().goToStop(RRC));
    await user.click(screen.getByRole('button', { name: 'Next stop ›' }));
    expect(panel()).toHaveAttribute('data-open', 'false');
    await user.click(screen.getByRole('button', { name: '‹ Prev' }));
    expect(panel()).toHaveAttribute('data-open', 'true');
  });

  it('stays closed while the car is between stops', () => {
    render(<CheckpointPanel />);
    act(() => state().goToStop(RRC));
    act(() => state().nudge((STOP_TS[RRC]! + STOP_TS[RRC + 1]!) / 2 - STOP_TS[RRC]!));
    expect(state().atStop).toBe(false);
    expect(panel()).toHaveAttribute('data-open', 'false');
  });

  it('ignores Escape when it is closed', async () => {
    const user = userEvent.setup();
    render(<CheckpointPanel />);
    act(() => state().goToStop(RRC));
    act(() => state().next());
    await user.keyboard('{Escape}');
    expect(state().dismissedStop).toBeNull();
  });
});
