import { create } from 'zustand';
import { isQualityTier, lowerTier, raiseTier, type QualityTier } from '@/lib/quality';

export const QUALITY_STORAGE_KEY = 'night-patrol:quality';

function readStoredTier(): QualityTier | null {
  try {
    const value = window.localStorage.getItem(QUALITY_STORAGE_KEY);
    return isQualityTier(value) ? value : null;
  } catch {
    return null;
  }
}

function writeStoredTier(tier: QualityTier): void {
  try {
    window.localStorage.setItem(QUALITY_STORAGE_KEY, tier);
  } catch {
    // Storage can be blocked (private mode, site data cleared); the tier just won't persist.
  }
}

interface QualityState {
  tier: QualityTier;
  /** Loads the saved tier once on the client, after hydration. */
  hydrate: () => void;
  setTier: (tier: QualityTier) => void;
  lower: () => void;
  raise: () => void;
}

export const useQualityStore = create<QualityState>((set, get) => ({
  tier: 'high',
  hydrate: () => {
    const stored = readStoredTier();
    if (stored) set({ tier: stored });
  },
  setTier: (tier) => {
    if (tier === get().tier) return;
    set({ tier });
    writeStoredTier(tier);
  },
  lower: () => get().setTier(lowerTier(get().tier)),
  raise: () => get().setTier(raiseTier(get().tier)),
}));
