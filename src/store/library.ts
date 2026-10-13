import { create } from 'zustand';
import type { ShelfFilter } from '@/lib/library';

/**
 * The state of the Millennium Library panel: whether the visitor is looking at the shelf or at one
 * book, which book, and the catalog's search and shelf filter. It is reset when the station closes,
 * so every visit starts at the full shelf.
 */
interface LibraryState {
  /** The book open on the reading table, or null for the shelf. */
  bookId: string | null;
  query: string;
  filter: ShelfFilter;
  openBook: (id: string) => void;
  /** Back from a book to the shelf. */
  closeBook: () => void;
  setQuery: (query: string) => void;
  setFilter: (filter: ShelfFilter) => void;
  reset: () => void;
}

const INITIAL = { bookId: null, query: '', filter: 'all' } as const;

export const useLibraryStore = create<LibraryState>((set) => ({
  ...INITIAL,
  openBook: (id) => set({ bookId: id }),
  closeBook: () => set({ bookId: null }),
  setQuery: (query) => set({ query }),
  setFilter: (filter) => set({ filter }),
  reset: () => set({ ...INITIAL }),
}));
