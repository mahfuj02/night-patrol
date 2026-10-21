'use client';

import { useEffect } from 'react';
import { stations } from '@/content/stations';
import { simpleCopy } from '@/content/ui';
import { formatTemplate } from '@/lib/template';
import { useDriveStore } from '@/store/drive';

const copy = simpleCopy.station;
const buttonClass =
  'rounded-md border border-street bg-street px-6 py-3 text-base font-semibold text-night shadow-lg hover:brightness-110';

/** Leaves the station and hands focus back to Next stop if it was on the button that just went away. */
function leave(active: HTMLElement | null) {
  const wasHere = active && document.activeElement === active;
  useDriveStore.getState().closeStation();
  if (wasHere) document.querySelector<HTMLElement>('[data-drive-next]')?.focus();
}

/**
 * The station controls: the Open button that appears at a station's red light (or its stop), and a
 * Leave button while the car is in the station. Escape leaves too, and any scroll or key that
 * drives on does as well (the drive store backs the car out first). Nothing here takes focus by
 * itself; a live region announces the station, and the button comes after the drive controls in
 * the tab order.
 */
export function StationControls() {
  const openable = useDriveStore((s) => s.openable);
  const phase = useDriveStore((s) => s.station.phase);
  const index = useDriveStore((s) => s.station.index);
  const openStation = useDriveStore((s) => s.openStation);
  // The Open button is not offered while the patrol starts over, nor on a roundabout or in a U-turn,
  // where the car cannot park.
  const shiftIdle = useDriveStore((s) => s.shift === 'idle');
  const driving = useDriveStore((s) => !s.arc && !s.turnRequest);
  // On a small screen the content opens in a sheet with its own close button.
  const legible = useDriveStore((s) => s.wallLegible);

  const visited = index !== null ? stations[index] : undefined;
  const offered = openable !== null ? stations[openable] : undefined;
  const inStation = phase === 'turning-in' || phase === 'parked';

  useEffect(() => {
    if (!inStation) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      leave(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [inStation]);

  const section = (visited ?? offered)?.section;
  const label = section ? simpleCopy.station.sections[section] : '';

  return (
    <>
      <p role="status" className="sr-only">
        {phase === 'parked' && label ? formatTemplate(copy.opened, { section: label }) : ''}
      </p>
      <div className="pointer-events-none fixed inset-x-0 bottom-[10.5rem] z-20 flex justify-center px-4 sm:bottom-[13.5rem]">
        {phase === 'idle' && shiftIdle && driving && offered && (
          <button
            type="button"
            className={`${buttonClass} pointer-events-auto`}
            onClick={openStation}
          >
            {formatTemplate(copy.open, { section: simpleCopy.station.sections[offered.section] })}
          </button>
        )}
      </div>
      {phase === 'parked' && legible && (
        <div className="fixed top-14 right-3 z-20">
          <button
            type="button"
            className={buttonClass}
            onClick={(event) => leave(event.currentTarget)}
          >
            {copy.leave}
          </button>
        </div>
      )}
    </>
  );
}
