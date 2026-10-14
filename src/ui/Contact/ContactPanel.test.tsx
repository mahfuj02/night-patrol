import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { profile, stations, stops } from '@/content';
import { INITIAL_STATION } from '@/lib/station';
import { useDriveStore } from '@/store/drive';
import { StationControls } from '../Station';
import { ContactPanel } from './ContactPanel';

const state = () => useDriveStore.getState();
const CONTACT = stations.findIndex((s) => s.section === 'contact');
const CONTACT_STOP = stops.findIndex((s) => s.id === stations[CONTACT]!.stopId);
const EDUCATION_STOP = stops.findIndex((s) => s.id === stations[0]!.stopId);

function park(index: number) {
  act(() => {
    state().goToStop(index);
    state().openStation();
    state().finishManeuver();
  });
}

describe('ContactPanel', () => {
  beforeEach(() => {
    act(() => {
      useDriveStore.setState({ station: INITIAL_STATION, pendingOpen: null, wallLegible: true });
      state().goToStop(0);
    });
  });

  it('shows nothing away from The Forks, and nothing at another station', () => {
    render(<ContactPanel />);
    expect(screen.queryByRole('complementary')).toBeNull();
    park(EDUCATION_STOP);
    expect(screen.queryByRole('complementary')).toBeNull();
  });

  it('lists the email, LinkedIn, GitHub, the portfolio and the resume, and does not take focus', () => {
    render(<ContactPanel />);
    park(CONTACT_STOP);
    const panel = screen.getByRole('complementary', { name: 'Contact' });
    expect(within(panel).getByRole('link', { name: profile.email })).toHaveAttribute(
      'href',
      `mailto:${profile.email}`,
    );
    expect(within(panel).getByRole('link', { name: profile.links.linkedin })).toHaveAttribute(
      'href',
      profile.links.linkedin,
    );
    expect(within(panel).getByRole('link', { name: profile.links.github })).toHaveAttribute(
      'href',
      profile.links.github,
    );
    expect(within(panel).getByRole('link', { name: profile.links.portfolio })).toHaveAttribute(
      'href',
      'https://mahfuj.dev',
    );
    expect(within(panel).getByRole('link', { name: 'Download resume (PDF)' })).toHaveAttribute(
      'href',
      profile.resumeUrl,
    );
    expect(panel.contains(document.activeElement)).toBe(false);
  });

  it('never shows a phone number', () => {
    render(<ContactPanel />);
    park(CONTACT_STOP);
    expect(screen.getByRole('complementary').textContent).not.toMatch(/\+?\d[\d\s().-]{8,}\d/);
  });

  it('leaves from its close button and with Escape', async () => {
    const user = userEvent.setup();
    render(
      <>
        <StationControls />
        <ContactPanel />
      </>,
    );
    park(CONTACT_STOP);
    await user.click(
      within(screen.getByRole('complementary')).getByRole('button', { name: 'Leave station' }),
    );
    expect(state().station.phase).toBe('backing-out');
    act(() => state().finishManeuver());
    expect(screen.queryByRole('complementary')).toBeNull();
    park(CONTACT_STOP);
    await user.keyboard('{Escape}');
    expect(state().station.phase).toBe('backing-out');
  });
});
