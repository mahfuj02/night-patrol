import { describe, expect, it } from 'vitest';
import { library } from '@/content/library';
import { projects } from '@/content/projects';
import { bookLinks, buildBooks, findBook, groupShelves, searchBooks } from './library';

const books = buildBooks(projects, library);
const byId = (id: string) => books.find((b) => b.id === id)!;

describe('buildBooks', () => {
  it('makes a book of every published project, in shelf order', () => {
    expect(books).toHaveLength(projects.length);
    expect(books.map((b) => b.category)).toEqual(
      [...books.map((b) => b.category)].sort(
        (a, b) =>
          library.categories.findIndex((k) => k.id === a) -
          library.categories.findIndex((k) => k.id === b),
      ),
    );
  });

  it('numbers each book by its shelf prefix and its position on the shelf', () => {
    expect(byId('eventflow').call).toBe('WEB-01');
    expect(byId('civictrack').call).toBe('WEB-02');
    expect(byId('game-hub').call).toBe('WEB-03');
    expect(byId('safe-drive-ai').call).toBe('MOB-01');
    expect(byId('connexions-spectrum').call).toBe('MOB-02');
    expect(byId('av-device-controller').call).toBe('SYS-01');
    expect(byId('roleready').call).toBe('AI-01');
  });

  it('gives every call number once', () => {
    const calls = books.map((b) => b.call);
    expect(new Set(calls).size).toBe(calls.length);
  });

  it('leaves out projects that are not published, so they take no call number', () => {
    expect(books.some((b) => b.id === 'akari' || b.id === 'site-audit-extension')).toBe(false);
  });

  it('skips a project with no shelf', () => {
    const odd = [{ ...projects[0]!, category: 'ai' as const }];
    const only = { ...library, categories: library.categories.filter((k) => k.id !== 'ai') };
    expect(buildBooks(odd, only)).toEqual([]);
  });
});

describe('groupShelves', () => {
  it('groups the books by shelf in shelf order and leaves out empty shelves', () => {
    const shelves = groupShelves(books, library);
    expect(shelves.map((s) => s.label)).toEqual(['Web', 'Mobile', 'Systems', 'AI']);
    expect(shelves[0]!.books.map((b) => b.id)).toEqual(['eventflow', 'civictrack', 'game-hub']);
    expect(
      groupShelves(
        books.filter((b) => b.category === 'ai'),
        library,
      ),
    ).toHaveLength(1);
  });
});

describe('searchBooks', () => {
  it('matches everything for an empty query and for the all filter', () => {
    expect(searchBooks(books, '')).toEqual(books);
    expect(searchBooks(books, '   ', 'all')).toEqual(books);
  });

  it('matches name, call number, tagline and stack, in any case', () => {
    expect(searchBooks(books, 'eventflow').map((b) => b.id)).toEqual(['eventflow']);
    expect(searchBooks(books, 'mob-02').map((b) => b.id)).toEqual(['connexions-spectrum']);
    expect(searchBooks(books, 'REACT NATIVE').map((b) => b.id)).toEqual([
      'safe-drive-ai',
      'connexions-spectrum',
    ]);
    expect(searchBooks(books, 'interview').map((b) => b.id)).toEqual(['roleready']);
  });

  it('needs every word, in any order', () => {
    expect(searchBooks(books, 'native react').length).toBe(2);
    expect(searchBooks(books, 'react kitten')).toEqual([]);
  });

  it('filters by shelf, together with the query', () => {
    expect(searchBooks(books, '', 'systems').map((b) => b.id)).toEqual(['av-device-controller']);
    expect(searchBooks(books, 'react', 'web').map((b) => b.id)).toEqual(['game-hub']);
    expect(searchBooks(books, 'eventflow', 'mobile')).toEqual([]);
  });
});

describe('findBook and bookLinks', () => {
  it('finds a book by id, or nothing', () => {
    expect(findBook(books, 'roleready')?.name).toBe('RoleReady');
    expect(findBook(books, 'nothing')).toBeUndefined();
    expect(findBook(books, null)).toBeUndefined();
  });

  it('lists only the links a project has, in order', () => {
    expect(bookLinks(byId('eventflow').project).map((l) => l.kind)).toEqual([
      'live',
      'github',
      'caseStudy',
    ]);
    expect(bookLinks(byId('safe-drive-ai').project).map((l) => l.kind)).toEqual(['caseStudy']);
    expect(bookLinks({ ...byId('eventflow').project, links: {} })).toEqual([]);
  });
});
