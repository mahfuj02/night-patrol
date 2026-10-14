import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { stations, stops } from '@/content';
import { INITIAL_STATION } from '@/lib/station';
import { useDriveStore } from '@/store/drive';
import { StationControls } from '../Station';
import { ExperiencePanel, experienceEntries } from './ExperiencePanel';

const state = () => useDriveStore.getState();
const EXPERIENCE = stations.findIndex((s) => s.section === 'experience');
const EXPERIENCE_STOP = stops.findIndex((s) => s.id === stations[EXPERIENCE]!.stopId);
const EDUCATION_STOP = stops.findIndex((s) => s.id === stations[0]!.stopId);

function park(index: number) {
  act(() => {
    state().goToStop(index);
    state().openStation();
    state().finishManeuver();
  });
}

describe('experienceEntries', () => {
  it('returns the entries in the order given and skips an unknown one', () => {
    expect(experienceEntries(['sprint-innovation-2025', 'liilab']).map((e) => e.id)).toEqual([
      'sprint-innovation-2025',
      'liilab',
    ]);
    expect(experienceEntries(['liilab', 'nothing']).map((e) => e.id)).toEqual(['liilab']);
    expect(experienceEntries(undefined)).toEqual([]);
  });
});

describe('ExperiencePanel', () => {
  beforeEach(() => {
    act(() => {
      useDriveStore.setState({ station: INITIAL_STATION, pendingOpen: null, wallLegible: true });
      state().goToStop(0);
    });
  });

  it('shows nothing away from the office, and nothing at another station', () => {
    render(<ExperiencePanel />);
    expect(screen.queryByRole('complementary')).toBeNull();
    park(EDUCATION_STOP);
    expect(screen.queryByRole('complementary')).toBeNull();
  });

  it('lists LIILAB, the Industrial Project and the Sprint-Innovation win in order, with dates', () => {
    render(<ExperiencePanel />);
    park(EXPERIENCE_STOP);
    const panel = screen.getByRole('complementary', { name: 'Experience' });
    const titles = within(panel)
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent);
    expect(titles).toEqual([
      'Junior Software Engineer',
      'Industrial Project (Mobile App Development)',
      'Sprint-Innovation 2025: Winner',
    ]);
    const liilab = within(panel).getByRole('article', { name: 'Junior Software Engineer' });
    expect(liilab).toHaveTextContent('LIILAB');
    expect(liilab).toHaveTextContent('Feb 2021 – May 2023');
    expect(within(liilab).getByText('Feb 2021 – May 2023')).toHaveAttribute('datetime', '2021-02');
    expect(within(liilab).getAllByRole('listitem').length).toBeGreaterThan(1);
    // Opening does not move focus: the visitor may be driving with the keyboard.
    expect(panel.contains(document.activeElement)).toBe(false);
  });

  it('leaves from its close button and with Escape', async () => {
    const user = userEvent.setup();
    render(
      <>
        <StationControls />
        <ExperiencePanel />
      </>,
    );
    park(EXPERIENCE_STOP);
    await user.click(
      within(screen.getByRole('complementary')).getByRole('button', { name: 'Leave station' }),
    );
    expect(state().station.phase).toBe('backing-out');
    act(() => state().finishManeuver());
    expect(screen.queryByRole('complementary')).toBeNull();
    park(EXPERIENCE_STOP);
    await user.keyboard('{Escape}');
    expect(state().station.phase).toBe('backing-out');
  });
});
