'use client';

import { useCallback, useEffect, useId, useMemo, useRef } from 'react';
import { stations } from '@/content/stations';
import { simpleCopy } from '@/content/ui';
import { findBook, searchBooks } from '@/lib/library';
import { useDriveStore } from '@/store/drive';
import { useLibraryStore } from '@/store/library';
import { BookView } from './BookView';
import { Catalog } from './Catalog';
import { Shelf } from './Shelf';
import { books } from './books';

/**
 * The Millennium Library's interface, shown while the car is parked at the Projects station: the
 * catalog (search and shelf filters) and the shelf of books, and, when one is chosen, its book
 * view with the live site, source, case study and "Drive to it". It is a side panel on a wide
 * screen and a bottom sheet on a phone. It never takes focus by itself; choosing a book moves
 * focus to the open book, and going back returns it to that book's button. Escape goes back from a
 * book, then leaves the station. The 3D wall behind it is a picture only.
 */
export function LibraryPanel() {
  const phase = useDriveStore((s) => s.station.phase);
  const index = useDriveStore((s) => s.station.index);
  const closeStation = useDriveStore((s) => s.closeStation);
  const goToStop = useDriveStore((s) => s.goToStop);

  const bookId = useLibraryStore((s) => s.bookId);
  const query = useLibraryStore((s) => s.query);
  const filter = useLibraryStore((s) => s.filter);
  const openBook = useLibraryStore((s) => s.openBook);
  const closeBook = useLibraryStore((s) => s.closeBook);
  const reset = useLibraryStore((s) => s.reset);

  const headingId = useId();
  const bookHeadingId = useId();
  const returnTo = useRef<string | null>(null);

  const station = index !== null ? stations[index] : undefined;
  const open = phase === 'parked' && station?.section === 'projects';

  // Every visit starts at the full shelf.
  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const results = useMemo(() => searchBooks(books, query, filter), [query, filter]);
  const book = findBook(books, bookId);

  const handleOpen = useCallback(
    (id: string) => {
      returnTo.current = id;
      openBook(id);
    },
    [openBook],
  );

  const handleBack = useCallback(() => closeBook(), [closeBook]);

  // Once the shelf is back, hand focus to the book the visitor came from.
  const hasBook = book !== undefined;
  useEffect(() => {
    if (hasBook || !returnTo.current) return;
    document.querySelector<HTMLElement>(`[data-book="${returnTo.current}"]`)?.focus();
    returnTo.current = null;
  }, [hasBook]);

  if (!open) return null;

  return (
    <aside
      aria-labelledby={headingId}
      className={`bg-night-2 text-snow border-hud/40 fixed inset-x-0 bottom-[12.5rem] z-10 max-h-[60dvh] overflow-y-auto rounded-t-xl border p-5 shadow-xl lg:inset-x-auto lg:top-28 lg:right-3 lg:bottom-36 lg:max-h-none lg:rounded-xl ${
        book ? 'lg:w-[44rem]' : 'lg:w-[26rem]'
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id={headingId} className="text-street text-lg font-semibold">
          {simpleCopy.station.sections.projects}
        </h2>
        <button
          type="button"
          onClick={closeStation}
          aria-label={simpleCopy.station.leave}
          className="text-snow hover:text-street rounded-md px-2 py-1 text-xl leading-none"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      {book ? (
        <BookView
          book={book}
          headingId={bookHeadingId}
          onBack={handleBack}
          onDrive={(stopIndex) => goToStop(stopIndex)}
        />
      ) : (
        <>
          <Catalog count={results.length} />
          <Shelf books={results} onOpen={handleOpen} />
        </>
      )}
    </aside>
  );
}
