import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { stations, stops } from '@/content';
import { useDriveStore } from '@/store/drive';
import { MAGNETS } from '@/lib/patrolLoop';
import { placeCar, resetDrive } from '@/store/driveTestUtils';
import { DriveControls } from '../DriveControls';
import { StationControls } from './StationControls';

const state = () => useDriveStore.getState();
const RRC = stops.findIndex((s) => s.id === stations[0]!.stopId);

function renderBoth() {
  return render(
    <>
      <DriveControls />
      <StationControls />
    </>,
  );
}

function park() {
  act(() => {
    state().goToStop(RRC);
    state().openStation();
    state().finishManeuver();
  });
}

describe('StationControls', () => {
  beforeEach(() => {
    act(() => {
      resetDrive();
    });
  });

  it('shows nothing away from a station', () => {
    render(<StationControls />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('offers Open Education at the RRC stop, and opens it', async () => {
    const user = userEvent.setup();
    render(<StationControls />);
    act(() => state().goToStop(RRC));
    await user.click(screen.getByRole('button', { name: 'Open Education' }));
    expect(state().station.phase).toBe('turning-in');
    // The Open button goes while the car turns in.
    expect(screen.queryByRole('button', { name: 'Open Education' })).toBeNull();
  });

  it('offers it at the red light before the stop too, heading out and heading back', () => {
    render(<StationControls />);
    for (const direction of [1, -1] as const) {
      const light = MAGNETS.find(
        (m) => m.kind === 'light' && m.ref === 0 && m.direction === direction,
      )!;
      act(() => placeCar(light.s));
      expect(state().atLight).toBe(0);
      expect(screen.getByRole('button', { name: 'Open Education' })).toBeInTheDocument();
    }
  });

  it('does not take focus when it appears', () => {
    renderBoth();
    act(() => state().goToStop(RRC));
    expect(document.body).toHaveFocus();
  });

  it('is reached with Tab after the drive controls', async () => {
    const user = userEvent.setup();
    renderBoth();
    act(() => state().goToStop(RRC));
    screen.getByRole('button', { name: 'Start over' }).focus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Open Education' })).toHaveFocus();
  });

  it('announces the station when parked, and shows a Leave button', () => {
    render(<StationControls />);
    park();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Education station opened. Press Escape to leave.',
    );
    expect(screen.getByRole('button', { name: 'Leave station' })).toBeInTheDocument();
  });

  it('leaves with the Leave button and hands focus back to Next stop', async () => {
    const user = userEvent.setup();
    renderBoth();
    park();
    const leave = screen.getByRole('button', { name: 'Leave station' });
    leave.focus();
    await user.click(leave);
    expect(state().station.phase).toBe('backing-out');
    expect(screen.getByRole('button', { name: 'Next stop ›' })).toHaveFocus();
  });

  it('leaves with Escape while parked, and while turning in', async () => {
    const user = userEvent.setup();
    render(<StationControls />);
    park();
    await user.keyboard('{Escape}');
    expect(state().station.phase).toBe('backing-out');

    act(() => state().finishManeuver());
    act(() => state().openStation());
    expect(state().station.phase).toBe('turning-in');
    await user.keyboard('{Escape}');
    expect(state().station.phase).toBe('backing-out');
  });

  it('ignores Escape when there is no station to leave', async () => {
    const user = userEvent.setup();
    render(<StationControls />);
    act(() => state().goToStop(RRC));
    await user.keyboard('{Escape}');
    expect(state().station.phase).toBe('idle');
  });

  it('hides its Leave button when the content opens in the sheet, which has its own', () => {
    render(<StationControls />);
    park();
    act(() => state().setWallLegible(false));
    expect(screen.queryByRole('button', { name: 'Leave station' })).toBeNull();
  });
});
