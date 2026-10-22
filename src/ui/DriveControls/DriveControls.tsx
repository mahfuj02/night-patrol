'use client';

import Link from 'next/link';
import { stops } from '@/content/stops';
import { simpleCopy } from '@/content/ui';
import { formatTemplate } from '@/lib/template';
import { useDriveStore } from '@/store/drive';

const buttonClass =
  'rounded-md border border-hud bg-night-2 px-4 py-3 text-sm font-medium text-snow hover:bg-night aria-disabled:cursor-not-allowed aria-disabled:border-night-2 aria-disabled:text-snow/50 sm:text-base';
const smallClass =
  'rounded-md border border-snow/30 bg-night-2 px-3 py-2 text-xs font-medium text-snow hover:bg-night aria-disabled:cursor-not-allowed aria-disabled:text-snow/50 sm:text-sm';

/**
 * Keyboard and pointer controls for the drive, plus the current stop. Everything here is plain
 * DOM so it works with assistive tech; the 3D scene itself is hidden from it. Only the stop
 * announcement is a live region, and it updates when a stop is reached, not while driving.
 *
 * The car only drives forward along the patrol loop: Next stop drives on to the next stop, Brake
 * stops it, and Turn around turns it round in the road. Start over fades back to the first stop.
 */
export function DriveControls() {
  const stopIndex = useDriveStore((s) => s.stopIndex);
  const atStop = useDriveStore((s) => s.atStop);
  const direction = useDriveStore((s) => s.direction);
  const braked = useDriveStore((s) => s.braked);
  const arc = useDriveStore((s) => s.arc);
  const turning = useDriveStore((s) => s.turnRequest);
  const next = useDriveStore((s) => s.next);
  const brake = useDriveStore((s) => s.brake);
  const turnAround = useDriveStore((s) => s.turnAround);
  const startOver = useDriveStore((s) => s.startOver);
  const shift = useDriveStore((s) => s.shift);
  const inStation = useDriveStore((s) => s.station.phase !== 'idle');
  const stop = stops[stopIndex];
  const total = stops.length;
  const copy = simpleCopy.drive;
  const way = direction === 1 ? copy.outbound : copy.headingBack;

  const announcement =
    atStop && stop
      ? formatTemplate(copy.atStop, { n: stopIndex + 1, total, title: stop.title, direction: way })
      : '';
  const busy = shift !== 'idle' || turning;

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
          {announcement || formatTemplate(copy.enRoute, { direction: way })}
        </p>
        <p role="status" className="sr-only">
          {announcement}
        </p>
        {braked && !busy && (
          <p className="bg-night-2/90 text-snow max-w-md rounded-md px-3 py-1 text-center text-xs sm:text-sm">
            {copy.brakeHint}
          </p>
        )}
        <div className="flex w-full max-w-md justify-between gap-3">
          <button
            type="button"
            className={buttonClass}
            data-drive-brake
            onClick={brake}
            aria-disabled={arc || busy}
          >
            {copy.brake}
          </button>
          <button type="button" className={buttonClass} data-drive-next onClick={next}>
            {copy.next}
          </button>
        </div>
        <div className="flex w-full max-w-md justify-between gap-3">
          <button
            type="button"
            className={smallClass}
            data-drive-turn
            onClick={turnAround}
            aria-disabled={arc || busy || inStation}
          >
            {copy.turnAround}
          </button>
          <button
            type="button"
            className={smallClass}
            data-drive-start-over
            onClick={startOver}
            aria-disabled={busy || inStation}
          >
            {copy.startOver}
          </button>
        </div>
        <p className="text-snow/80 hidden max-w-md text-center text-xs sm:block">{copy.hint}</p>
      </nav>
    </>
  );
}
