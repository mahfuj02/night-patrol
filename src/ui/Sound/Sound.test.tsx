import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SOUND_STORAGE_KEY, useSoundStore } from '@/store/sound';
import { SoundDriver } from './SoundDriver';
import { SoundToggle } from './SoundToggle';

const engine = vi.hoisted(() => ({
  setSpeed: vi.fn(),
  blip: vi.fn(),
  wipe: vi.fn(),
  dispose: vi.fn(),
  created: vi.fn(),
}));
vi.mock('@/audio/engine', () => ({
  createEngine: () => {
    engine.created();
    return engine;
  },
}));

class FakeContext {
  resume = vi.fn(() => Promise.resolve());
}

describe('sound', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useSoundStore.setState({ enabled: false, unlocked: false });
    vi.stubGlobal('AudioContext', FakeContext);
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} })),
    );
    for (const fn of Object.values(engine)) fn.mockClear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('is off by default and starts no audio', async () => {
    render(
      <>
        <SoundToggle />
        <SoundDriver />
      </>,
    );
    expect(screen.getByRole('button', { name: 'Sound: off' })).toBeInTheDocument();
    await act(async () => {
      await Promise.resolve();
    });
    expect(engine.created).not.toHaveBeenCalled();
  });

  it('turns on with the button, remembers it, and turns off again', async () => {
    const user = userEvent.setup();
    render(
      <>
        <SoundToggle />
        <SoundDriver />
      </>,
    );
    await user.click(screen.getByRole('button', { name: 'Sound: off' }));
    expect(screen.getByRole('button', { name: 'Sound: on' })).toBeInTheDocument();
    expect(window.localStorage.getItem(SOUND_STORAGE_KEY)).toBe('on');
    await waitFor(() => expect(engine.created).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole('button', { name: 'Sound: on' }));
    expect(window.localStorage.getItem(SOUND_STORAGE_KEY)).toBe('off');
    await waitFor(() => expect(engine.dispose).toHaveBeenCalled());
  });

  it('never autoplays from a saved "on": it waits for the first click or key', async () => {
    window.localStorage.setItem(SOUND_STORAGE_KEY, 'on');
    render(
      <>
        <SoundToggle />
        <SoundDriver />
      </>,
    );
    expect(screen.getByRole('button', { name: 'Sound: on' })).toBeInTheDocument();
    await act(async () => {
      await Promise.resolve();
    });
    expect(engine.created).not.toHaveBeenCalled();
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    });
    await waitFor(() => expect(engine.created).toHaveBeenCalledTimes(1));
  });

  it('survives blocked storage', async () => {
    const user = userEvent.setup();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    render(<SoundToggle />);
    await user.click(screen.getByRole('button', { name: 'Sound: off' }));
    expect(screen.getByRole('button', { name: 'Sound: on' })).toBeInTheDocument();
    vi.restoreAllMocks();
  });
});
