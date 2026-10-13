import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { profile, skills, stations, stops } from '@/content';
import { INITIAL_STATION } from '@/lib/station';
import { useDriveStore } from '@/store/drive';
import { StationControls } from '../Station';
import { SkillsPanel } from './SkillsPanel';

const state = () => useDriveStore.getState();
const SKILLS = stations.findIndex((s) => s.section === 'skills');
const SKILLS_STOP = stops.findIndex((s) => s.id === stations[SKILLS]!.stopId);
const EDUCATION_STOP = stops.findIndex((s) => s.id === stations[0]!.stopId);

function park(index: number) {
  act(() => {
    state().goToStop(index);
    state().openStation();
    state().finishManeuver();
  });
}

describe('SkillsPanel', () => {
  beforeEach(() => {
    act(() => {
      useDriveStore.setState({ station: INITIAL_STATION, pendingOpen: null, wallLegible: true });
      state().goToStop(0);
    });
  });

  it('shows nothing away from the skills building, and nothing at another station', () => {
    render(<SkillsPanel />);
    expect(screen.queryByRole('complementary')).toBeNull();
    park(EDUCATION_STOP);
    expect(screen.queryByRole('complementary')).toBeNull();
  });

  it('lists every group and every skill with its level as text, and does not take focus', () => {
    render(<SkillsPanel />);
    park(SKILLS_STOP);
    const panel = screen.getByRole('complementary', { name: 'Skills' });
    for (const group of ['Web', 'Backend', 'Embedded', 'AI tools', 'Mobile']) {
      expect(within(panel).getByRole('heading', { name: group })).toBeInTheDocument();
    }
    expect(within(panel).getAllByRole('listitem').length).toBeGreaterThanOrEqual(skills.length);
    const typescript = within(panel).getByText('TypeScript').closest('li')!;
    expect(typescript).toHaveTextContent('Level 4 of 5');
    expect(panel.contains(document.activeElement)).toBe(false);
  });

  it('shows a skill note in place, with no tooltip', () => {
    render(<SkillsPanel />);
    park(SKILLS_STOP);
    const wordpress = screen.getByText('WordPress').closest('li')!;
    expect(wordpress).toHaveTextContent('Theme performance at LIILAB');
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('shows the lines that are not graded skills under Also', () => {
    render(<SkillsPanel />);
    park(SKILLS_STOP);
    const also = screen.getByRole('region', { name: 'Also' });
    expect(also).toHaveTextContent(profile.highlights[0]!);
  });

  it('leaves from its close button and with Escape (through the station controls)', async () => {
    const user = userEvent.setup();
    render(
      <>
        <StationControls />
        <SkillsPanel />
      </>,
    );
    park(SKILLS_STOP);
    await user.click(
      within(screen.getByRole('complementary')).getByRole('button', { name: 'Leave station' }),
    );
    expect(state().station.phase).toBe('backing-out');
    act(() => state().finishManeuver());
    expect(screen.queryByRole('complementary')).toBeNull();
    park(SKILLS_STOP);
    await user.keyboard('{Escape}');
    expect(state().station.phase).toBe('backing-out');
  });
});
