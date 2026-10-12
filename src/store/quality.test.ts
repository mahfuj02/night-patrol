import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QUALITY_STORAGE_KEY, useQualityStore } from './quality';

const state = () => useQualityStore.getState();

describe('quality store', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useQualityStore.setState({ tier: 'high' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defaults to high', () => {
    expect(state().tier).toBe('high');
  });

  it('persists tier changes', () => {
    state().setTier('medium');
    expect(state().tier).toBe('medium');
    expect(window.localStorage.getItem(QUALITY_STORAGE_KEY)).toBe('medium');
  });

  it('lowers and raises the tier', () => {
    state().lower();
    expect(state().tier).toBe('medium');
    state().lower();
    state().lower();
    expect(state().tier).toBe('low');
    state().raise();
    expect(state().tier).toBe('medium');
  });

  it('hydrates a saved tier and ignores junk', () => {
    window.localStorage.setItem(QUALITY_STORAGE_KEY, 'low');
    state().hydrate();
    expect(state().tier).toBe('low');

    useQualityStore.setState({ tier: 'high' });
    window.localStorage.setItem(QUALITY_STORAGE_KEY, 'ultra');
    state().hydrate();
    expect(state().tier).toBe('high');
  });

  it('survives blocked storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => state().hydrate()).not.toThrow();
    expect(() => state().setTier('low')).not.toThrow();
    expect(state().tier).toBe('low');
  });
});
