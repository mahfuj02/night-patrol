'use client';

import { useId } from 'react';
import { simpleCopy } from '@/content/ui';
import { groupShelves, type Book } from '@/lib/library';
import { formatTemplate } from '@/lib/template';
import { library } from './books';

const copy = simpleCopy.library;

/**
 * The books that match the catalog, grouped by shelf. On a phone each shelf is a swipeable row of
 * spines (scroll snap); on a wide screen the spines stack. Every spine is a button: its call number
 * and name, and "Featured" on the book on the display stand. `onOpen` gets the book's id.
 */
export function Shelf({ books, onOpen }: { books: readonly Book[]; onOpen: (id: string) => void }) {
  const headingPrefix = useId();
  const shelves = groupShelves(books, library);

  if (shelves.length === 0) {
    return <p className="text-snow mt-4">{copy.none}</p>;
  }

  return (
    <div className="mt-4 space-y-4" aria-label={copy.shelf}>
      {shelves.map((shelf) => (
        <section key={shelf.category} aria-labelledby={`${headingPrefix}-${shelf.category}`}>
          <h3
            id={`${headingPrefix}-${shelf.category}`}
            className="text-hud mb-1 font-mono text-xs tracking-wide uppercase"
          >
            {shelf.label}
          </h3>
          <ul className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2 lg:snap-none lg:flex-col lg:overflow-visible lg:pb-0">
            {shelf.books.map((book) => (
              <li key={book.id} className="shrink-0 snap-start lg:shrink">
                <button
                  type="button"
                  data-book={book.id}
                  aria-label={formatTemplate(copy.bookButton, { call: book.call, name: book.name })}
                  onClick={() => onOpen(book.id)}
                  className="border-hud/40 bg-night hover:border-street focus-visible:outline-hud flex min-h-14 w-40 flex-col justify-center rounded-md border px-3 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 lg:w-full"
                >
                  <span aria-hidden="true" className="text-hud font-mono text-xs">
                    {book.call}
                    {book.id === library.featured && (
                      <span className="text-street ml-2">{copy.featured}</span>
                    )}
                  </span>
                  <span aria-hidden="true" className="text-snow text-base font-semibold">
                    {book.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
