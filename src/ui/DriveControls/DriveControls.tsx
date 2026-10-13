'use client';

import Link from 'next/link';
import { stops } from '@/content/stops';
import { simpleCopy } from '@/content/ui';
import { formatTemplate } from '@/lib/template';
import { useDriveStore } from '@/store/drive';

const buttonClass =
  'rounded-md border border-hud bg-night-2 px-4 py-3 text-sm font-medium text-snow hover:bg-night aria-disabled:cursor-not-allowed aria-disabled:border-night-2 aria-disabled:text-snow/50 sm:text-base';

/**
 * Keyboard and pointer controls for the drive, plus the current stop. Everything here is plain
 * DOM so it works with assistive tech; the 3D scene itself is hidden from it. Only the stop
 * announcement is a live region, and it updates when a stop is reached, not while driving.
 */
export function DriveControls() {
  const stopIndex = useDriveStore((s) => s.stopIndex);
  const atStop = useDriveStore((s) => s.atStop);
  const next = useDriveStore((s) => s.next);
  const prev = useDriveStore((s) => s.prev);
  const stop = stops[stopIndex];
  const total = stops.length;
  const copy = simpleCopy.drive;

  const announcement =
    atStop && stop
      ? formatTemplate(copy.atStop, { n: stopIndex + 1, total, title: stop.title })
      : '';
  const atFirst = atStop && stopIndex === 0;
  const atLast = atStop && stopIndex === total - 1;

  return (
    <>
      <Link
        href="/simple"
        prefetch={false}
        className="bg-night-2 text-hud fixed top-3 right-3 z-10 rounded-md px-3 py-2 text-sm underline underline-offset-4"
      >
        {copy.simpleView}
      </Link>
      <nav
        aria-label={copy.navLabel}
        className="fixed inset-x-0 bottom-0 z-10 flex flex-col items-center gap-3 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <p
          aria-hidden="true"
          className="bg-night-2 text-snow rounded-md px-3 py-1 font-mono text-sm"
        >
          {announcement || copy.enRoute}
        </p>
        <p role="status" className="sr-only">
          {announcement}
        </p>
        <div className="flex w-full max-w-md justify-between gap-3">
          <button
            type="button"
            className={buttonClass}
            onClick={atFirst ? undefined : prev}
            aria-disabled={atFirst}
          >
            {copy.prev}
          </button>
          <button
            type="button"
            className={buttonClass}
            data-drive-next
            onClick={atLast ? undefined : next}
            aria-disabled={atLast}
          >
            {copy.next}
          </button>
        </div>
        <p className="text-snow/80 hidden max-w-md text-center text-xs sm:block">{copy.hint}</p>
      </nav>
    </>
  );
}
