import type { Library, Project, ProjectCategory } from '@/content/schema';

/** One book on a shelf of the Millennium Library: a project with its call number and shelf. */
export interface Book {
  id: string;
  name: string;
  /** The call number, the shelf prefix and the position on that shelf: for example WEB-01. */
  call: string;
  category: ProjectCategory;
  /** The shelf's label, for example "Web". */
  shelf: string;
  project: Project;
}

/** A shelf: its category, label and its books in order. */
export interface Shelf {
  category: ProjectCategory;
  label: string;
  books: Book[];
}

/** The filter on the catalog: every shelf, or one. */
export type ShelfFilter = 'all' | ProjectCategory;

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Every project as a book, in shelf order and then the order in projects.ts. The call number is the
 * shelf's prefix and the book's position on that shelf, counted from 01 (a project that is not on a
 * shelf in `library` is left out; the content integrity check reports it).
 */
export function buildBooks(projects: readonly Project[], library: Library): Book[] {
  const books: Book[] = [];
  for (const shelf of library.categories) {
    projects
      .filter((p) => p.category === shelf.id)
      .forEach((project, i) => {
        books.push({
          id: project.id,
          name: project.name,
          call: `${shelf.prefix}-${pad(i + 1)}`,
          category: shelf.id,
          shelf: shelf.label,
          project,
        });
      });
  }
  return books;
}

/** The books grouped by shelf, in shelf order, leaving out shelves with no books. */
export function groupShelves(books: readonly Book[], library: Library): Shelf[] {
  return library.categories
    .map((shelf) => ({
      category: shelf.id,
      label: shelf.label,
      books: books.filter((b) => b.category === shelf.id),
    }))
    .filter((shelf) => shelf.books.length > 0);
}

/** What a search looks through: name, call number, shelf, tagline and stack, lower-cased. */
function haystack(book: Book): string {
  const { project } = book;
  return [book.name, book.call, book.shelf, project.tagline, ...project.stack]
    .join(' ')
    .toLowerCase();
}

/**
 * The books that match a search and a shelf filter. Every word of the query has to appear somewhere
 * in the book's name, call number, shelf, tagline or stack, in any order; an empty query matches all.
 */
export function searchBooks(
  books: readonly Book[],
  query: string,
  filter: ShelfFilter = 'all',
): Book[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return books.filter(
    (book) =>
      (filter === 'all' || book.category === filter) &&
      words.every((word) => haystack(book).includes(word)),
  );
}

/** The book with this id, or undefined. */
export function findBook(books: readonly Book[], id: string | null): Book | undefined {
  return id === null ? undefined : books.find((b) => b.id === id);
}

/** The links a book's page offers, in order, leaving out the ones the project does not have. */
export function bookLinks(
  project: Project,
): { kind: 'live' | 'github' | 'caseStudy'; href: string }[] {
  const kinds = ['live', 'github', 'caseStudy'] as const;
  return kinds.flatMap((kind) => {
    const href = project.links[kind];
    return href ? [{ kind, href }] : [];
  });
}
