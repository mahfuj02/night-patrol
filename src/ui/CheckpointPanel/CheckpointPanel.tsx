'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { checkpoints } from '@/content/checkpoints';
import { experience } from '@/content/experience';
import { projects } from '@/content/projects';
import { stops } from '@/content/stops';
import { simpleCopy } from '@/content/ui';
import { resolveCheckpoint, type CheckpointView, type ResolvedCheckpoint } from '@/lib/checkpoint';
import { formatTemplate } from '@/lib/template';
import { useDriveStore } from '@/store/drive';

const copy = simpleCopy;
const sources = { checkpoints, experience, projects };
const chipClass = 'rounded-full border border-night bg-night px-3 py-1 text-sm text-snow';
const linkKeys = ['live', 'github', 'caseStudy'] as const;

function ExperienceBody({ view }: { view: Extract<CheckpointView, { kind: 'experience' }> }) {
  return (
    <>
      <p className="text-snow mt-1">{view.org}</p>
      {view.dates && (
        <p className="text-hud mt-1 font-mono text-sm">
          <time dateTime={view.isoDate}>{view.dates}</time>
        </p>
      )}
      {view.summary && <p className="text-snow mt-3">{view.summary}</p>}
      {view.bullets.length > 0 && (
        <ul className="text-snow mt-3 list-disc pl-5">
          {view.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      )}
    </>
  );
}

function ProjectBody({ view }: { view: Extract<CheckpointView, { kind: 'project' }> }) {
  return (
    <>
      <p className="text-snow mt-1">{view.tagline}</p>
      <dl className="text-snow mt-4 space-y-3">
        <div>
          <dt className="text-hud font-mono text-sm">{copy.labels.problem}</dt>
          <dd>{view.problem}</dd>
        </div>
        <div>
          <dt className="text-hud font-mono text-sm">{copy.labels.built}</dt>
          <dd>{view.built}</dd>
        </div>
      </dl>
      <h3 className="sr-only">{copy.labels.stack}</h3>
      <ul className="mt-4 flex flex-wrap gap-2">
        {view.stack.map((tech) => (
          <li key={tech} className={chipClass}>
            {tech}
          </li>
        ))}
      </ul>
      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        {linkKeys.map((key) => {
          const href = view.links[key];
          if (!href) return null;
          return (
            <li key={key}>
              <a href={href} className="text-hud underline underline-offset-4">
                {copy.links[key]} <span className="sr-only">for {view.title}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** Closes the panel for the stop the visitor is at, handing focus back if it was inside. */
function closePanel(panel: HTMLElement | null) {
  const hadFocus = panel?.contains(document.activeElement) ?? false;
  useDriveStore.getState().dismissPanel();
  if (hadFocus) document.querySelector<HTMLElement>('[data-drive-next]')?.focus();
}

/**
 * The checkpoint panel: what a stop is about, as plain DOM (not 3D text), on the right of the
 * screen on desktop and as a bottom sheet on a phone. It slides in when the car reaches a stop
 * that has a checkpoint and slides out when the visitor drives on; under reduced motion it just
 * appears and disappears.
 *
 * Focus: the panel never takes focus by itself, because the visitor may be driving with the wheel
 * or the arrow keys. It is announced through a live region and comes right after the drive
 * controls in the tab order, so Tab reaches it next. Escape (or the close button) closes it and,
 * if focus was inside, hands focus back to the Next stop button. While it is closed it is `inert`,
 * so nothing in it can be tabbed to or read.
 */
export function CheckpointPanel() {
  const stopIndex = useDriveStore((s) => s.stopIndex);
  const atStop = useDriveStore((s) => s.atStop);
  const dismissedStop = useDriveStore((s) => s.dismissedStop);
  const headingId = useId();
  const panel = useRef<HTMLElement>(null);

  const stop = stops[stopIndex];
  const resolved = useMemo(() => resolveCheckpoint(stop, sources), [stop]);
  const open = atStop && resolved !== null && dismissedStop !== stopIndex;

  // Keep showing the last checkpoint while the panel slides out.
  const [last, setLast] = useState<ResolvedCheckpoint | null>(resolved);
  if (resolved && resolved !== last) setLast(resolved);
  const content = resolved ?? last;
  const title = (content && stops.find((s) => s.id === content.stopId)?.title) ?? '';

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      closePanel(panel.current);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  if (!content) return null;

  return (
    <>
      <p role="status" className="sr-only">
        {open ? formatTemplate(copy.checkpoint.opened, { title }) : ''}
      </p>
      <aside
        ref={panel}
        aria-labelledby={headingId}
        inert={!open}
        data-open={open}
        className={[
          'bg-night-2 text-snow border-hud/40 fixed z-10 overflow-y-auto border p-5 shadow-xl',
          'transition-[transform,visibility] duration-300 motion-reduce:transition-none',
          'inset-x-0 bottom-[9.5rem] max-h-[45dvh] rounded-t-xl',
          'sm:inset-x-auto sm:top-16 sm:right-3 sm:bottom-32 sm:max-h-none sm:w-96 sm:rounded-xl',
          open
            ? 'visible translate-x-0 translate-y-0'
            : 'invisible translate-y-full sm:translate-x-[110%] sm:translate-y-0',
        ].join(' ')}
      >
        <button
          type="button"
          onClick={() => closePanel(panel.current)}
          aria-label={copy.checkpoint.close}
          className="text-snow hover:text-street absolute top-2 right-2 rounded-md px-2 py-1 text-xl leading-none"
        >
          <span aria-hidden="true">×</span>
        </button>
        <h2 id={headingId} className="text-street pr-8 text-xl font-semibold">
          {content.main.title}
        </h2>
        {content.main.kind === 'experience' ? (
          <ExperienceBody view={content.main} />
        ) : (
          <ProjectBody view={content.main} />
        )}
        {content.teaser && (
          <p className="border-night text-snow mt-4 border-t pt-3 text-sm">
            <span className="text-hud font-mono">{copy.checkpoint.teaser}:</span>{' '}
            {content.teaser.title}
          </p>
        )}
      </aside>
    </>
  );
}
