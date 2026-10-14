import { create } from 'zustand';
import { gaugePercent } from '@/lib/intro';

/**
 * The Ignition loading screen: `loading` until the scene has drawn a frame and its assets are in,
 * then `ready` (Start Patrol is offered), then `started` once the visitor starts (or `?intro=off`
 * skipped it). The scene reports its progress here through a small component under `src/scene`,
 * so the UI never imports three.js.
 */
interface IntroState {
  phase: 'loading' | 'ready' | 'started';
  /** The fuel gauge, 0 to 100, never going backwards. */
  percent: number;
  /** True once the scene has drawn a few frames. */
  framed: boolean;
  /** True once the loader has reported at least once (before that, nothing is known). */
  reported: boolean;
  /** Assets the loader knows about, and whether it is still loading any. */
  total: number;
  active: boolean;
  /** Progress from the scene's asset loader (0 to 100). */
  report: (progress: number, active: boolean, total: number) => void;
  markFramed: () => void;
  /** Offer Start Patrol even though the scene has not finished (a slow or stuck load). */
  giveUpWaiting: () => void;
  start: () => void;
  reset: () => void;
}

const INITIAL = {
  phase: 'loading',
  percent: 0,
  framed: false,
  reported: false,
  total: 0,
  active: false,
} as const;

/** The loading is done when the scene has drawn and the loader has nothing left. */
function settle(
  state: Pick<IntroState, 'phase' | 'framed' | 'reported' | 'active' | 'percent' | 'total'>,
) {
  if (state.phase !== 'loading') return state.phase;
  if (!state.reported) return 'loading';
  const loaded = state.total === 0 ? !state.active : state.percent >= 100 && !state.active;
  return state.framed && loaded ? 'ready' : 'loading';
}

export const useIntroStore = create<IntroState>((set, get) => ({
  ...INITIAL,
  report: (progress, active, total) => {
    const s = get();
    const percent = gaugePercent(total === 0 && !active ? 100 : progress, s.percent);
    const next = { ...s, percent, active, total, reported: true };
    set({ percent, active, total, reported: true, phase: settle(next) });
  },
  markFramed: () => {
    const s = get();
    if (s.framed) return;
    set({ framed: true, phase: settle({ ...s, framed: true }) });
  },
  giveUpWaiting: () => {
    if (get().phase === 'loading') set({ percent: 100, phase: 'ready' });
  },
  start: () => {
    if (get().phase !== 'started') set({ phase: 'started' });
  },
  reset: () => set({ ...INITIAL }),
}));
