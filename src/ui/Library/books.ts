import { library } from '@/content/library';
import { projects } from '@/content/projects';
import { buildBooks, groupShelves } from '@/lib/library';

/** The library's books and shelves, built once from content (published projects only). */
export const books = buildBooks(projects, library);
export const shelves = groupShelves(books, library);
export { library };
