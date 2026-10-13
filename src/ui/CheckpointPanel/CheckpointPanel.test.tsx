import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { stops } from '@/content';
import { STOP_TS, useDriveStore } from '@/store/drive';
import { DriveControls } from '../DriveControls';
import { CheckpointPanel } from './CheckpointPanel';

const state = () => useDriveStore.getState();
// EventFlow, the Exchange District warehouses, is a drive-by stop with a side panel. The stop
// before it (the RRC campus) is a station, and the one after it (City services) has no panel yet.
const EF = stops.findIndex((s) => s.id === 'exchange-warehouses');
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

  it('opens at the Exchange District warehouses with the EventFlow project', () => {
    render(<CheckpointPanel />);
    act(() => state().goToStop(EF));
    const open = screen.getByRole('complementary', { name: 'EventFlow' });
    expect(open).toHaveAttribute('data-open', 'true');
    expect(open).not.toHaveAttribute('inert');
    expect(screen.getByText('Scoped ticketing and CRM platform for events.')).toBeInTheDocument();
    expect(screen.getByText('Vue 3')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Checkpoint opened: Exchange District warehouses. Press Escape to close it.',
    );
  });

  it('does not open at the RRC campus, which is a station and shows its content on the wall', () => {
    render(<CheckpointPanel />);
    act(() => state().goToStop(stops.findIndex((s) => s.id === 'rrc-campus')));
    expect(screen.queryByRole('complementary', { hidden: true })).toBeNull();
  });

  it('does not take focus when it opens, so driving by keyboard keeps working', () => {
    renderBoth();
    act(() => state().goToStop(EF));
    expect(document.body).toHaveFocus();
  });

  it('closes with Escape, and stays closed while the visitor stays at the stop', async () => {
    const user = userEvent.setup();
    render(<CheckpointPanel />);
    act(() => state().goToStop(EF));
    await user.keyboard('{Escape}');
    expect(panel()).toHaveAttribute('data-open', 'false');
    expect(panel()).toHaveAttribute('inert');
    expect(state().dismissedStop).toBe(EF);
    expect(screen.getAllByRole('status').every((el) => el.textContent === '')).toBe(true);
  });

  it('closes with the close button and gives focus back to Next stop', async () => {
    const user = userEvent.setup();
    renderBoth();
    act(() => state().goToStop(EF));
    const close = screen.getByRole('button', { name: 'Close checkpoint' });
    close.focus();
    await user.keyboard('{Enter}');
    expect(panel()).toHaveAttribute('data-open', 'false');
    expect(screen.getByRole('button', { name: 'Next stop ›' })).toHaveFocus();
  });

  it('hands focus back to Next stop when Escape closes it from inside', async () => {
    const user = userEvent.setup();
    renderBoth();
    act(() => state().goToStop(EF));
    screen.getByRole('button', { name: 'Close checkpoint' }).focus();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Next stop ›' })).toHaveFocus();
  });

  it('is reached with Tab straight after the drive controls', async () => {
    const user = userEvent.setup();
    renderBoth();
    act(() => state().goToStop(EF));
    screen.getByRole('button', { name: 'Next stop ›' }).focus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Close checkpoint' })).toHaveFocus();
  });

  it('slides out when the visitor drives on, and opens again on the way back', async () => {
    const user = userEvent.setup();
    renderBoth();
    // City services is the last stop with a panel; Portage & Main, after it, has none yet.
    act(() => state().goToStop(EF + 1));
    await user.click(screen.getByRole('button', { name: 'Next stop ›' }));
    expect(panel()).toHaveAttribute('data-open', 'false');
    await user.click(screen.getByRole('button', { name: '‹ Prev' }));
    expect(panel()).toHaveAttribute('data-open', 'true');
  });

  it('shows the project links, including the case study on mahfuj.dev', () => {
    render(<CheckpointPanel />);
    act(() => state().goToStop(EF));
    expect(screen.getByRole('link', { name: /GitHub repository/ })).toHaveAttribute(
      'href',
      'https://github.com/mahfuj02/eventflow',
    );
    expect(screen.getByRole('link', { name: /Case study/ })).toHaveAttribute(
      'href',
      'https://mahfuj.dev/projects/eventflow',
    );
  });

  it('stays closed while the car is between stops', () => {
    render(<CheckpointPanel />);
    act(() => state().goToStop(EF));
    act(() => state().nudge((STOP_TS[EF]! + STOP_TS[EF + 1]!) / 2 - STOP_TS[EF]!));
    expect(state().atStop).toBe(false);
    expect(panel()).toHaveAttribute('data-open', 'false');
  });

  it('ignores Escape when it is closed', async () => {
    const user = userEvent.setup();
    render(<CheckpointPanel />);
    act(() => state().goToStop(EF + 1));
    act(() => state().next());
    await user.keyboard('{Escape}');
    expect(state().dismissedStop).toBeNull();
  });
});
