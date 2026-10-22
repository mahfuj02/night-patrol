import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { stations, stops } from '@/content';
import { useDriveStore } from '@/store/drive';
import { resetDrive, visitOf } from '@/store/driveTestUtils';
import { useLibraryStore } from '@/store/library';
import { StationControls } from '../Station';
import { LibraryPanel } from './LibraryPanel';

const state = () => useDriveStore.getState();
const LIBRARY = stations.findIndex((s) => s.section === 'projects');
const LIBRARY_STOP = stops.findIndex((s) => s.id === stations[LIBRARY]!.stopId);
const EDUCATION_STOP = stops.findIndex((s) => s.id === stations[0]!.stopId);
const stopIndex = (id: string) => stops.findIndex((s) => s.id === id);

function park(index: number) {
  act(() => {
    state().goToStop(index);
    state().openStation();
    state().finishManeuver();
  });
}

describe('LibraryPanel', () => {
  beforeEach(() => {
    act(() => {
      resetDrive();
      useLibraryStore.getState().reset();
    });
  });

  it('shows nothing away from the library, and nothing at another station', () => {
    render(<LibraryPanel />);
    expect(screen.queryByRole('complementary')).toBeNull();
    park(EDUCATION_STOP);
    expect(screen.queryByRole('complementary')).toBeNull();
  });

  it('opens at the library with the catalog and every book on its shelf', () => {
    render(<LibraryPanel />);
    park(LIBRARY_STOP);
    const panel = screen.getByRole('complementary', { name: 'Projects' });
    expect(within(panel).getByRole('search', { name: 'Catalog' })).toBeInTheDocument();
    expect(within(panel).getByRole('status')).toHaveTextContent('7 books');
    expect(within(panel).getByRole('button', { name: 'WEB-01 EventFlow' })).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: 'AI-01 RoleReady' })).toBeInTheDocument();
    // Opening does not move focus: the visitor may be driving with the keyboard.
    expect(panel.contains(document.activeElement)).toBe(false);
  });

  it('narrows the shelf as the visitor types and says how many books match', async () => {
    const user = userEvent.setup();
    render(<LibraryPanel />);
    park(LIBRARY_STOP);
    await user.type(screen.getByRole('searchbox', { name: 'Search the catalog' }), 'react native');
    expect(screen.getByRole('status')).toHaveTextContent('2 books');
    expect(screen.getByRole('button', { name: 'MOB-01 Safe Drive AI' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'WEB-01 EventFlow' })).toBeNull();
    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'zzzz');
    expect(screen.getByText('No books match.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('0 books');
  });

  it('filters by shelf with toggle buttons', async () => {
    const user = userEvent.setup();
    render(<LibraryPanel />);
    park(LIBRARY_STOP);
    const all = screen.getByRole('button', { name: 'All' });
    expect(all).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Systems' }));
    expect(screen.getByRole('button', { name: 'Systems' })).toHaveAttribute('aria-pressed', 'true');
    expect(all).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('status')).toHaveTextContent('1 book');
    expect(screen.getByRole('button', { name: 'SYS-01 AV Device Controller' })).toBeInTheDocument();
  });

  it('opens a book with its slogan, problem, picture and links', async () => {
    const user = userEvent.setup();
    render(<LibraryPanel />);
    park(LIBRARY_STOP);
    await user.click(screen.getByRole('button', { name: 'WEB-01 EventFlow' }));
    expect(screen.getByRole('heading', { name: 'Book: EventFlow' })).toHaveFocus();
    expect(screen.getByText("Book your ticket. Tonight's show starts here.")).toBeInTheDocument();
    expect(screen.getByText('The problem')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /EventFlow home page/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Check out/ })).toHaveAttribute(
      'href',
      expect.stringMatching(/^https:/),
    );
    expect(screen.getByRole('link', { name: /Source/ })).toHaveAttribute(
      'href',
      'https://github.com/mahfuj02/eventflow',
    );
    expect(screen.getByRole('link', { name: /Case study/ })).toHaveAttribute(
      'href',
      'https://mahfuj.dev/projects/eventflow',
    );
    expect(screen.getByRole('button', { name: /Drive to it/ })).toBeInTheDocument();
  });

  it('shows the concept caption under a mock-up, and a cover when there is no picture', async () => {
    const user = userEvent.setup();
    render(<LibraryPanel />);
    park(LIBRARY_STOP);
    await user.click(screen.getByRole('button', { name: 'MOB-01 Safe Drive AI' }));
    expect(screen.getByText('Concept design')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Back to the shelf/ }));
    await user.click(screen.getByRole('button', { name: 'WEB-03 Game Hub' }));
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('Call number WEB-03')).toBeInTheDocument();
  });

  it('offers Drive to it only for a project that has a stop', async () => {
    const user = userEvent.setup();
    render(<LibraryPanel />);
    park(LIBRARY_STOP);
    await user.click(screen.getByRole('button', { name: 'WEB-03 Game Hub' }));
    expect(screen.queryByRole('button', { name: /Drive to it/ })).toBeNull();
    await user.click(screen.getByRole('button', { name: /Back to the shelf/ }));
    await user.click(screen.getByRole('button', { name: 'SYS-01 AV Device Controller' }));
    expect(screen.queryByRole('button', { name: /Drive to it/ })).toBeNull();
  });

  it('drives to the project from its book: backs out first, then goes', async () => {
    const user = userEvent.setup();
    render(<LibraryPanel />);
    park(LIBRARY_STOP);
    await user.click(screen.getByRole('button', { name: 'AI-01 RoleReady' }));
    await user.click(screen.getByRole('button', { name: /Drive to it/ }));
    const portage = stopIndex('portage-main');
    expect(state().station.phase).toBe('backing-out');
    expect(state().station.pending).toEqual({ kind: 'go', index: portage });
    act(() => state().finishManeuver());
    expect(state().target).toBeCloseTo(visitOf(portage).s, 6);
  });

  it('goes back from the keyboard and returns focus to the book it came from', async () => {
    const user = userEvent.setup();
    render(<LibraryPanel />);
    park(LIBRARY_STOP);
    screen.getByRole('button', { name: 'WEB-02 CivicTrack' }).focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('heading', { name: 'Book: CivicTrack' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('heading', { name: 'Book: CivicTrack' })).toBeNull();
    expect(screen.getByRole('button', { name: 'WEB-02 CivicTrack' })).toHaveFocus();
    // Still in the station: Escape from a book only goes back to the shelf.
    expect(state().station.phase).toBe('parked');
  });

  it('lets Escape from the shelf leave the station, after a book has closed first', async () => {
    const user = userEvent.setup();
    render(
      <>
        <StationControls />
        <LibraryPanel />
      </>,
    );
    park(LIBRARY_STOP);
    await user.click(screen.getByRole('button', { name: 'WEB-01 EventFlow' }));
    await user.keyboard('{Escape}');
    expect(state().station.phase).toBe('parked');
    await user.keyboard('{Escape}');
    expect(state().station.phase).toBe('backing-out');
  });

  it('leaves from its close button, and starts the next visit at the full shelf', async () => {
    const user = userEvent.setup();
    render(<LibraryPanel />);
    park(LIBRARY_STOP);
    await user.type(screen.getByRole('searchbox'), 'react');
    await user.click(screen.getByRole('button', { name: 'Leave station' }));
    expect(state().station.phase).toBe('backing-out');
    act(() => state().finishManeuver());
    expect(screen.queryByRole('complementary')).toBeNull();
    park(LIBRARY_STOP);
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(screen.getByRole('status')).toHaveTextContent('7 books');
  });
});
