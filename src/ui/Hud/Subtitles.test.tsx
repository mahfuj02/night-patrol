import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { radioLines, stops } from '@/content';
import { STOP_TS, useDriveStore } from '@/store/drive';
import { Subtitles } from './Subtitles';

const state = () => useDriveStore.getState();
const region = () => screen.getByRole('region', { name: 'Dispatch radio' });
const indexOf = (id: string) => stops.findIndex((s) => s.id === id);

describe('Subtitles', () => {
  beforeEach(() => {
    act(() => state().goToStop(0));
  });

  it('is a polite live region that is empty at a stop without a radio line', () => {
    render(<Subtitles />);
    expect(region()).toHaveAttribute('aria-live', 'polite');
    expect(region()).toHaveTextContent('');
  });

  it('captions the dispatch line at the first stop with one', () => {
    render(<Subtitles />);
    act(() => state().goToStop(indexOf('dispatch')));
    expect(region()).toHaveTextContent(radioLines.find((l) => l.id === 'dispatch')!.text);
  });

  it('captions the RRC campus line', () => {
    render(<Subtitles />);
    act(() => state().goToStop(indexOf('rrc-campus')));
    expect(region()).toHaveTextContent(
      'Unit 02, Exchange District. RRC campus on your left. This is where my Winnipeg tech journey started.',
    );
  });

  it('also carries the words on the sign at a project stop, for screen readers', () => {
    render(<Subtitles />);
    act(() => state().goToStop(indexOf('exchange-warehouses')));
    expect(region()).toHaveTextContent(
      "Sign: EventFlow. Book your ticket. Tonight's show starts here.",
    );
  });

  it('announces a sign even at a stop with no radio line', () => {
    render(<Subtitles />);
    act(() => state().goToStop(indexOf('dashcam')));
    expect(region()).toHaveTextContent('Sign: Safe Drive AI. Eyes on the road. AI on your side.');
  });

  it('clears the caption while the car is between stops', () => {
    render(<Subtitles />);
    const i = indexOf('rrc-campus');
    act(() => state().goToStop(i));
    act(() => state().nudge((STOP_TS[i + 1]! - STOP_TS[i]!) / 2));
    expect(region()).toHaveTextContent('');
  });

  it('shows "New patrol starting." while the shift resets, wherever the car is', () => {
    render(<Subtitles />);
    act(() => state().goToStop(stops.length - 1));
    expect(region()).toHaveTextContent('Shift complete.');
    act(() => useDriveStore.setState({ shift: 'fading-out' }));
    expect(region()).toHaveTextContent('New patrol starting.');
    act(() => useDriveStore.setState({ shift: 'idle' }));
    expect(region()).not.toHaveTextContent('New patrol starting.');
  });
});
