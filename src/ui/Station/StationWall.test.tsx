import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { stations, stops } from '@/content';
import { INITIAL_STATION } from '@/lib/station';
import { WALL_DESIGN_WIDTH } from '@/lib/stationCamera';
import { wallDom } from '@/lib/wallDom';
import { useDriveStore } from '@/store/drive';
import { StationWall } from './StationWall';

const state = () => useDriveStore.getState();
const RRC = stops.findIndex((s) => s.id === stations[0]!.stopId);
const wall = () => screen.getByTestId('station-wall');

function park() {
  act(() => {
    state().goToStop(RRC);
    state().openStation();
    state().finishManeuver();
  });
}

describe('StationWall', () => {
  beforeEach(() => {
    act(() => {
      useDriveStore.setState({ station: INITIAL_STATION, wallLegible: true });
      state().goToStop(0);
    });
  });

  it('registers its element and layout size for the scene to place on the wall', () => {
    const { unmount } = render(<StationWall />);
    expect(wallDom.element).toBe(wall());
    expect(wallDom.width).toBe(WALL_DESIGN_WIDTH);
    unmount();
    expect(wallDom.element).toBeNull();
  });

  it('is hidden and out of reach until the car is parked', () => {
    render(<StationWall />);
    expect(wall()).toHaveAttribute('aria-hidden', 'true');
    expect(wall()).toHaveAttribute('inert');
    expect(wall()).toHaveStyle({ visibility: 'hidden' });
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('shows the Education content as real, readable DOM when parked', () => {
    render(<StationWall />);
    park();
    expect(wall()).toHaveAttribute('aria-hidden', 'false');
    expect(wall()).not.toHaveAttribute('inert');
    // The scene turns the wall visible each frame; here only the markup and its attributes matter.
    const region = screen.getByRole('region', { hidden: true });
    // It is named by its heading.
    const heading = screen.getByText('Diploma in Full Stack Web Development');
    expect(heading.tagName).toBe('H2');
    expect(region).toHaveAttribute('aria-labelledby', heading.id);
    expect(region).toHaveTextContent('Red River College Polytechnic');
    expect(region).toHaveTextContent('Aug 2023 – Aug 2025');
    expect(region).toHaveTextContent('Sprint-Innovation 2025: Winner');
    // Plain text in the document, not a picture.
    expect(screen.getByText('Red River College Polytechnic').tagName).toBe('P');
  });

  it('draws the layout at the design size, from the wall rectangle', () => {
    render(<StationWall />);
    park();
    const rect = stations[0]!.wall.rect;
    expect(wall()).toHaveStyle({
      width: `${WALL_DESIGN_WIDTH}px`,
      height: `${Math.round((WALL_DESIGN_WIDTH * rect.height) / rect.width)}px`,
    });
    expect(wallDom.height).toBe(Math.round((WALL_DESIGN_WIDTH * rect.height) / rect.width));
  });

  it('is only a picture while the car is turning in or backing out', () => {
    render(<StationWall />);
    act(() => {
      state().goToStop(RRC);
      state().openStation();
    });
    expect(wall()).toHaveAttribute('aria-hidden', 'true');
    expect(wall()).toHaveAttribute('inert');
    // The content is already there to fade in.
    expect(wall()).toHaveTextContent('Diploma in Full Stack Web Development');
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('opens the content in a bottom sheet too when the wall is too small to read, and reads it once', () => {
    render(<StationWall />);
    park();
    act(() => state().setWallLegible(false));
    const sheet = screen.getByRole('complementary', {
      name: 'Diploma in Full Stack Web Development',
    });
    expect(sheet).toHaveTextContent('Red River College Polytechnic');
    // The wall copy is visual only.
    expect(wall()).toHaveAttribute('aria-hidden', 'true');
    expect(wall()).toHaveAttribute('inert');
    expect(screen.queryByRole('region')).toBeNull();
    // Only one copy is in the accessibility tree.
    expect(
      screen.getAllByRole('heading', { name: 'Diploma in Full Stack Web Development' }),
    ).toHaveLength(1);
  });

  it('leaves from the sheet with its close button', async () => {
    const user = userEvent.setup();
    render(<StationWall />);
    park();
    act(() => state().setWallLegible(false));
    await user.click(screen.getByRole('button', { name: 'Leave station' }));
    expect(state().station.phase).toBe('backing-out');
  });

  it('keeps the content while backing out, then drops the sheet when the car is on the road', () => {
    render(<StationWall />);
    park();
    act(() => state().setWallLegible(false));
    act(() => state().closeStation());
    expect(wall()).toHaveTextContent('Diploma in Full Stack Web Development');
    expect(screen.queryByRole('complementary')).toBeNull();
    act(() => state().finishManeuver());
    expect(wall()).toHaveAttribute('aria-hidden', 'true');
  });
});
