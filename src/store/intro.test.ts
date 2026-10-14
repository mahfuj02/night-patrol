import { beforeEach, describe, expect, it } from 'vitest';
import { useIntroStore } from './intro';

const state = () => useIntroStore.getState();

describe('intro store', () => {
  beforeEach(() => state().reset());

  it('starts loading, at zero', () => {
    expect(state().phase).toBe('loading');
    expect(state().percent).toBe(0);
  });

  it('follows the loader and never goes backwards', () => {
    state().report(30, true, 10);
    expect(state().percent).toBe(30);
    state().report(20, true, 12);
    expect(state().percent).toBe(30);
    state().report(64.4, true, 12);
    expect(state().percent).toBe(64);
  });

  it('is ready only when the scene has drawn and the loader has finished', () => {
    state().report(100, false, 10);
    expect(state().phase).toBe('loading');
    state().markFramed();
    expect(state().phase).toBe('ready');
  });

  it('waits for the loader even after the scene has drawn', () => {
    state().markFramed();
    state().report(50, true, 10);
    expect(state().phase).toBe('loading');
    state().report(100, false, 10);
    expect(state().phase).toBe('ready');
  });

  it('treats a scene with nothing to load as loaded as soon as it has drawn', () => {
    state().report(0, false, 0);
    expect(state().percent).toBe(100);
    state().markFramed();
    expect(state().phase).toBe('ready');
  });

  it('does not stall on a loader that is still working with nothing counted yet', () => {
    state().markFramed();
    state().report(0, true, 0);
    expect(state().phase).toBe('loading');
  });

  it('can give up waiting, filling the gauge and offering Start Patrol', () => {
    state().report(40, true, 10);
    state().giveUpWaiting();
    expect(state().phase).toBe('ready');
    expect(state().percent).toBe(100);
  });

  it('starts once, and a late report does not undo it', () => {
    state().start();
    expect(state().phase).toBe('started');
    state().report(10, true, 5);
    state().giveUpWaiting();
    state().markFramed();
    expect(state().phase).toBe('started');
  });

  it('ignores a repeated frame mark', () => {
    state().markFramed();
    state().markFramed();
    expect(state().framed).toBe(true);
  });
});
