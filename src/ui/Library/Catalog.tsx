'use client';

import { useId } from 'react';
import { simpleCopy } from '@/content/ui';
import { formatTemplate } from '@/lib/template';
import type { ShelfFilter } from '@/lib/library';
import { useLibraryStore } from '@/store/library';
import { library } from './books';

const copy = simpleCopy.library;
const filterClass =
  'rounded-full border px-3 py-1 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hud';

/**
 * The catalog terminal: a search box and the shelf filters, with a live count of the matching books.
 * It is the fast way to find a book: typing narrows the shelf below it, and the count is announced.
 */
export function Catalog({ count }: { count: number }) {
  const query = useLibraryStore((s) => s.query);
  const filter = useLibraryStore((s) => s.filter);
  const setQuery = useLibraryStore((s) => s.setQuery);
  const setFilter = useLibraryStore((s) => s.setFilter);
  const searchId = useId();

  const filters: { id: ShelfFilter; label: string }[] = [
    { id: 'all', label: copy.all },
    ...library.categories.map((k) => ({ id: k.id, label: k.label })),
  ];

  return (
    <form role="search" aria-label={copy.catalog} onSubmit={(event) => event.preventDefault()}>
      <label htmlFor={searchId} className="sr-only">
        {copy.searchLabel}
      </label>
      <input
        id={searchId}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={copy.searchPlaceholder}
        autoComplete="off"
        className="border-hud/50 bg-night text-snow placeholder:text-snow/60 focus-visible:outline-hud w-full rounded-md border px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2"
      />
      <div role="group" aria-label={copy.filters} className="mt-3 flex flex-wrap gap-2">
        {filters.map(({ id, label }) => {
          const pressed = filter === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={pressed}
              onClick={() => setFilter(id)}
              className={`${filterClass} ${
                pressed
                  ? 'border-street bg-street text-night'
                  : 'border-hud/50 text-snow hover:border-street'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <p role="status" className="text-hud mt-2 font-mono text-sm">
        {count === 1 ? copy.countOne : formatTemplate(copy.countMany, { n: count })}
      </p>
    </form>
  );
}
