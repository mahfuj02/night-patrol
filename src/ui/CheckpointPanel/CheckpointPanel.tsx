'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { checkpoints } from '@/content/checkpoints';
import { experience } from '@/content/experience';
import { projects } from '@/content/projects';
import { stops } from '@/content/stops';
import { simpleCopy } from '@/content/ui';
import { resolveCheckpoint, type ResolvedCheckpoint } from '@/lib/checkpoint';
import { formatTemplate } from '@/lib/template';
import { useDriveStore } from '@/store/drive';
import { CheckpointContent } from './CheckpointContent';

const copy = simpleCopy;
const sources = { checkpoints, experience, projects };
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
        <CheckpointContent content={content} headingId={headingId} />
      </aside>
    </>
  );
}
