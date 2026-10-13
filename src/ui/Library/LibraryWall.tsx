import { simpleCopy } from '@/content/ui';
import { books } from './books';

/**
 * The library's lit wall, seen from the car: the stack of titles, call number and name. It is a
 * picture only (the accessible shelf is the library panel), so the wall always hides it from
 * assistive tech. It is real DOM so the wall stays crisp, not a texture.
 */
export function LibraryWall() {
  return (
    <div>
      <h2 className="text-street text-4xl font-semibold">{simpleCopy.station.sections.projects}</h2>
      <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-xl">
        {books.map((book) => (
          <li key={book.id} className="text-snow truncate">
            <span className="text-hud">{book.call}</span> {book.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
