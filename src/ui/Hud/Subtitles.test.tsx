import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { radioLines, stops } from '@/content';
import { useDriveStore } from '@/store/drive';
import { arriveAt, placeCar, resetDrive, visitOf } from '@/store/driveTestUtils';
import { Subtitles } from './Subtitles';

const state = () => useDriveStore.getState();
const region = () => screen.getByRole('region', { name: 'Dispatch radio' });
const indexOf = (id: string) => stops.findIndex((s) => s.id === id);

describe('Subtitles', () => {
  beforeEach(() => {
    act(() => resetDrive());
  });

  it('is a polite live region that is empty at a stop without a radio line', () => {
    render(<Subtitles />);
    expect(region()).toHaveAttribute('aria-live', 'polite');
    expect(region()).toHaveTextContent('');
  });

  it('captions the dispatch line at the first stop with one', () => {
    render(<Subtitles />);
    act(() => arriveAt(indexOf('dispatch')));
    expect(region()).toHaveTextContent(radioLines.find((l) => l.id === 'dispatch')!.text);
  });

  it('captions the RRC campus line', () => {
    render(<Subtitles />);
    act(() => arriveAt(indexOf('rrc-campus')));
    expect(region()).toHaveTextContent(
      'Unit 02, Exchange District. RRC campus on your left. This is where my Winnipeg tech journey started.',
    );
  });

  it('also carries the words on the sign at a project stop, for screen readers', () => {
    render(<Subtitles />);
    act(() => arriveAt(indexOf('exchange-warehouses')));
    expect(region()).toHaveTextContent(
      "Sign: EventFlow. Book your ticket. Tonight's show starts here.",
    );
  });

  it('announces a sign even at a stop with no radio line, and on the way back too', () => {
    render(<Subtitles />);
    act(() => arriveAt(indexOf('dashcam')));
    expect(region()).toHaveTextContent('Sign: Safe Drive AI. Eyes on the road. AI on your side.');
    act(() => arriveAt(indexOf('dashcam'), -1));
    expect(region()).toHaveTextContent('Sign: Safe Drive AI. Eyes on the road. AI on your side.');
  });

  it('clears the caption while the car is between stops', () => {
    render(<Subtitles />);
    act(() => arriveAt(indexOf('rrc-campus')));
    act(() => placeCar((visitOf(2).s + visitOf(3).s) / 2));
    expect(region()).toHaveTextContent('');
  });

  it('shows "Shift complete." at The Forks', () => {
    render(<Subtitles />);
    act(() => arriveAt(stops.length - 1));
    expect(region()).toHaveTextContent('Shift complete.');
  });

  it('reuses the outbound line heading back unless the stop has a return line of its own', () => {
    render(<Subtitles />);
    act(() => arriveAt(indexOf('rrc-campus'), -1));
    expect(region()).toHaveTextContent('RRC campus on your left.');
    act(() => arriveAt(indexOf('dispatch'), -1));
    expect(region()).toHaveTextContent('Unit 02, heading back to base.');
    expect(region()).not.toHaveTextContent('starting patrol');
  });

  it('says the call that starts the patrol on the first lap only', () => {
    render(<Subtitles />);
    act(() => arriveAt(indexOf('dispatch')));
    expect(region()).toHaveTextContent('starting patrol');
    act(() => useDriveStore.setState({ laps: 1 }));
    expect(region()).not.toHaveTextContent('starting patrol');
    expect(state().atStop).toBe(true);
  });

  it('never says "New patrol starting."', () => {
    expect(radioLines.some((l) => l.text.includes('New patrol'))).toBe(false);
  });
});
