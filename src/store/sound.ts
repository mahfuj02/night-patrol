import { create } from 'zustand';

export const SOUND_STORAGE_KEY = 'night-patrol:sound';

function readStored(): boolean {
  try {
    return window.localStorage.getItem(SOUND_STORAGE_KEY) === 'on';
  } catch {
    return false;
  }
}

function writeStored(on: boolean): void {
  try {
    window.localStorage.setItem(SOUND_STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    // Storage can be blocked (private mode); the choice just will not persist.
  }
}

interface SoundState {
  /** The visitor's choice. Off until they turn it on (CLAUDE.md rule 6): never autoplay. */
  enabled: boolean;
  /**
   * True once the visitor has done something in this page (a click, a key). Browsers only let audio
   * start after that, and a saved "on" choice must not start sound before it either.
   */
  unlocked: boolean;
  /** Loads the saved choice once after hydration. It never starts audio by itself. */
  hydrate: () => void;
  toggle: () => void;
  unlock: () => void;
}

export const useSoundStore = create<SoundState>((set, get) => ({
  enabled: false,
  unlocked: false,
  hydrate: () => set({ enabled: readStored() }),
  toggle: () => {
    const enabled = !get().enabled;
    writeStored(enabled);
    // Turning it on is itself the gesture that unlocks audio.
    set({ enabled, unlocked: get().unlocked || enabled });
  },
  unlock: () => {
    if (!get().unlocked) set({ unlocked: true });
  },
}));
