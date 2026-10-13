import type { Library } from './schema';

/**
 * The Millennium Library (the Projects station): its shelves in order, the call number prefix on each
 * shelf, and the book on the display stand at the entrance. A book's call number is its shelf's prefix
 * and its position on that shelf (the order in projects.ts, published projects only), for example
 * WEB-01. Which shelf a project is on is its `category` in projects.ts.
 * TODO(content): owner to confirm the shelves and which project is featured.
 */
export const library: Library = {
  featured: 'eventflow',
  categories: [
    { id: 'web', label: 'Web', prefix: 'WEB' },
    { id: 'mobile', label: 'Mobile', prefix: 'MOB' },
    { id: 'systems', label: 'Systems', prefix: 'SYS' },
    { id: 'ai', label: 'AI', prefix: 'AI' },
  ],
};
