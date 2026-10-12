import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

async function loadHook() {
  const mod = await import('./useWebGLSupport');
  return mod.useWebGLSupport;
}

describe('useWebGLSupport', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports false when no context is available', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const useWebGLSupport = await loadHook();
    const { result } = renderHook(() => useWebGLSupport());
    expect(result.current).toBe(false);
  });

  it('reports true when a context is created, and detects only once', async () => {
    const spy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as never);
    const useWebGLSupport = await loadHook();
    const first = renderHook(() => useWebGLSupport());
    const second = renderHook(() => useWebGLSupport());
    expect(first.result.current).toBe(true);
    expect(second.result.current).toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
