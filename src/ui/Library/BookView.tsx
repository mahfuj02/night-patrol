'use client';

import { useEffect, useRef } from 'react';
import { stops } from '@/content/stops';
import { simpleCopy } from '@/content/ui';
import { bookLinks, type Book } from '@/lib/library';
import { formatTemplate } from '@/lib/template';

const copy = simpleCopy.library;
const buttonClass =
  'rounded-md border px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hud';
const linkLabel = { live: copy.checkOut, github: copy.source, caseStudy: copy.caseStudy } as const;

/**
 * One open book, as a two-page spread: the picture on the left (or a typographic cover when the
 * project has none), the slogan, the problem, what was built and the stack on the right, then the
 * links as buttons. "Drive to it" appears only when the project has a stop on the route. Opening
 * the book moves focus to its title (the visitor just chose it); Escape and the back button return
 * to the shelf. On a phone the two pages stack.
 */
export function BookView({
  book,
  headingId,
  onBack,
  onDrive,
}: {
  book: Book;
  headingId: string;
  onBack: () => void;
  onDrive: (stopIndex: number) => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const { project } = book;
  const image = project.images[0];
  const links = bookLinks(project);
  const stopIndex = project.stopId ? stops.findIndex((s) => s.id === project.stopId) : -1;

  useEffect(() => {
    heading.current?.focus();
  }, [book.id]);

  // Escape returns to the shelf. It runs in the capture phase and marks the event handled, so the
  // station's own Escape (leave the station) does not also fire.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      onBack();
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [onBack]);

  return (
    <article aria-labelledby={headingId}>
      <button
        type="button"
        onClick={onBack}
        className={`${buttonClass} border-hud/50 text-hud hover:border-street`}
      >
        <span aria-hidden="true">‹ </span>
        {copy.back}
      </button>
      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        <figure className="m-0">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element -- a small static WebP, loaded only when the book opens
            <img
              src={image.src}
              alt={image.alt}
              loading="lazy"
              decoding="async"
              className="border-hud/30 max-h-64 w-full rounded-md border object-contain object-top"
            />
          ) : (
            <div
              aria-hidden="true"
              className="border-hud/40 bg-night flex min-h-48 flex-col justify-center rounded-md border p-4 text-center"
            >
              <p className="text-hud font-mono text-sm">
                {formatTemplate(copy.cover, { call: book.call })}
              </p>
              <p className="text-snow mt-2 text-2xl font-semibold">{book.name}</p>
            </div>
          )}
          {image?.caption && (
            <figcaption className="text-snow/80 mt-1 text-xs">{image.caption}</figcaption>
          )}
        </figure>
        <div>
          <p className="text-hud font-mono text-sm">{book.call}</p>
          <h2
            ref={heading}
            id={headingId}
            tabIndex={-1}
            aria-label={formatTemplate(copy.book, { name: book.name })}
            className="text-street text-2xl font-semibold focus:outline-none"
          >
            {book.name}
          </h2>
          <p className="text-snow mt-1 font-medium">{project.sign?.slogan ?? project.tagline}</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {links.map(({ kind, href }) => (
              <li key={kind}>
                <a
                  href={href}
                  className={`${buttonClass} border-hud text-hud hover:bg-hud hover:text-night inline-block`}
                >
                  {linkLabel[kind]}
                  <span className="sr-only"> for {book.name}</span>
                </a>
              </li>
            ))}
            {stopIndex >= 0 && (
              <li>
                <button
                  type="button"
                  onClick={() => onDrive(stopIndex)}
                  className={`${buttonClass} border-street bg-street text-night hover:brightness-110`}
                >
                  {simpleCopy.menu.driveToIt}
                  <span className="sr-only"> to {book.name}</span>
                </button>
              </li>
            )}
          </ul>
          <dl className="text-snow mt-4 space-y-3">
            <div>
              <dt className="text-hud font-mono text-sm">{simpleCopy.labels.problem}</dt>
              <dd>{project.problem}</dd>
            </div>
            <div>
              <dt className="text-hud font-mono text-sm">{simpleCopy.labels.built}</dt>
              <dd>{project.built}</dd>
            </div>
          </dl>
          <h3 className="sr-only">{simpleCopy.labels.stack}</h3>
          <ul className="mt-4 flex flex-wrap gap-2">
            {project.stack.map((tech) => (
              <li
                key={tech}
                className="border-night bg-night text-snow rounded-full border px-3 py-1 text-sm"
              >
                {tech}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
