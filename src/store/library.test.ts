import { beforeEach, describe, expect, it } from 'vitest';
import { useLibraryStore } from './library';

const state = () => useLibraryStore.getState();

describe('library store', () => {
  beforeEach(() => state().reset());

  it('starts at the full shelf', () => {
    expect(state().bookId).toBeNull();
    expect(state().query).toBe('');
    expect(state().filter).toBe('all');
  });

  it('opens a book and goes back to the shelf, keeping the search', () => {
    state().setQuery('react');
    state().setFilter('web');
    state().openBook('game-hub');
    expect(state().bookId).toBe('game-hub');
    state().closeBook();
    expect(state().bookId).toBeNull();
    expect(state().query).toBe('react');
    expect(state().filter).toBe('web');
  });

  it('resets everything for the next visit', () => {
    state().setQuery('x');
    state().setFilter('ai');
    state().openBook('roleready');
    state().reset();
    expect(state().bookId).toBeNull();
    expect(state().query).toBe('');
    expect(state().filter).toBe('all');
  });
});
