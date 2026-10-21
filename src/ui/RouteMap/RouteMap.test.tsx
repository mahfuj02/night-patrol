import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { allProjects, projects, stations, stops } from '@/content';
import { progress } from '@/scene/progress';
import { useDriveStore } from '@/store/drive';
import { resetDrive, visitOf } from '@/store/driveTestUtils';
import { RouteMap } from './RouteMap';

const state = () => useDriveStore.getState();
const RRC = stops.findIndex((s) => s.id === stations[0]!.stopId);

function stubViewport(wide: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: wide,
      addEventListener: () => {},
      removeEventListener: () => {},
    })),
  );
}

describe('RouteMap', () => {
  beforeEach(() => {
    stubViewport(true);
    act(() => {
      resetDrive();
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('is open on a wide screen and lists every stop', () => {
    render(<RouteMap />);
    const nav = screen.getByRole('navigation', { name: 'Route map' });
    expect(within(nav).getAllByRole('listitem').length).toBeGreaterThanOrEqual(stops.length);
    expect(screen.getByRole('button', { name: /Route map/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('starts collapsed on a phone and opens from the toggle', async () => {
    stubViewport(false);
    const user = userEvent.setup();
    render(<RouteMap />);
    expect(screen.queryByRole('navigation', { name: 'Route map' })).toBeNull();
    await user.click(screen.getByRole('button', { name: /Route map/ }));
    expect(screen.getByRole('navigation', { name: 'Route map' })).toBeInTheDocument();
  });

  it('drives to a stop and says so, with the mouse', async () => {
    const user = userEvent.setup();
    render(<RouteMap />);
    const stop = stops.findIndex((s) => s.id === 'dispatch');
    await user.click(screen.getByRole('button', { name: new RegExp(stops[stop]!.title) }));
    expect(state().target).toBeCloseTo(visitOf(stop).s, 6);
    expect(screen.getByRole('status')).toHaveTextContent(`Driving to ${stops[stop]!.title}`);
  });

  it('says Arrived once the car has reached the stop', async () => {
    const user = userEvent.setup();
    render(<RouteMap />);
    const stop = stops.findIndex((s) => s.id === 'dispatch');
    await user.click(screen.getByRole('button', { name: new RegExp(stops[stop]!.title) }));
    progress.s = visitOf(stop).s;
    expect(await screen.findByText(`Arrived: ${stops[stop]!.title}`)).toBeInTheDocument();
  });

  it('forgets the destination when the visitor drives elsewhere', async () => {
    const user = userEvent.setup();
    render(<RouteMap />);
    const stop = stops.findIndex((s) => s.id === 'dispatch');
    await user.click(screen.getByRole('button', { name: new RegExp(stops[stop]!.title) }));
    act(() => state().nudge(0.05));
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('drives to a station from the keyboard and opens it on arrival', async () => {
    const user = userEvent.setup();
    render(<RouteMap />);
    const button = screen.getByRole('button', { name: /Education station/ });
    button.focus();
    await user.keyboard('{Enter}');
    expect(state().target).toBeCloseTo(visitOf(RRC).s, 6);
    expect(state().pendingOpen).toBe(0);
  });

  it('has a section button for every built station', async () => {
    const user = userEvent.setup();
    render(<RouteMap />);
    const group = screen.getByRole('group', { name: 'Sections' });
    await user.click(within(group).getByRole('button', { name: 'Education' }));
    expect(state().pendingOpen).toBe(0);
  });

  it('shows project details, returns focus on Escape, and offers Drive to it only with a stop', async () => {
    const user = userEvent.setup();
    render(<RouteMap />);
    const withStop = projects.find((p) => p.id === 'eventflow')!;
    const opener = screen.getByRole('button', { name: withStop.name });
    await user.click(opener);
    expect(screen.getByRole('button', { name: 'Drive to it' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(opener).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Drive to it' })).toBeNull();

    const without = projects.find((p) => p.id === 'game-hub')!;
    await user.click(screen.getByRole('button', { name: without.name }));
    expect(screen.queryByRole('button', { name: 'Drive to it' })).toBeNull();
  });

  it('drives to the project from its details', async () => {
    const user = userEvent.setup();
    render(<RouteMap />);
    await user.click(screen.getByRole('button', { name: 'EventFlow' }));
    await user.click(screen.getByRole('button', { name: 'Drive to it' }));
    const stop = stops.findIndex((s) => s.id === 'exchange-warehouses');
    expect(state().target).toBeCloseTo(visitOf(stop).s, 6);
  });

  it('lists only the published projects', () => {
    render(<RouteMap />);
    for (const p of projects)
      expect(screen.getByRole('button', { name: p.name })).toBeInTheDocument();
    for (const p of allProjects.filter((x) => x.published === false)) {
      expect(screen.queryByRole('button', { name: p.name })).toBeNull();
    }
  });

  it('links to the resume and the contact details', () => {
    render(<RouteMap />);
    expect(screen.getByRole('link', { name: 'Resume (PDF)' })).toHaveAttribute(
      'href',
      expect.stringContaining('Resume.pdf'),
    );
    expect(screen.getByRole('link', { name: 'Contact details' })).toHaveAttribute(
      'href',
      '/simple#contact-heading',
    );
  });

  it('closes the sheet after choosing on a phone', async () => {
    stubViewport(false);
    const user = userEvent.setup();
    render(<RouteMap />);
    await user.click(screen.getByRole('button', { name: /Route map/ }));
    await user.click(screen.getByRole('button', { name: /Education station/ }));
    expect(screen.queryByRole('navigation', { name: 'Route map' })).toBeNull();
  });
});
