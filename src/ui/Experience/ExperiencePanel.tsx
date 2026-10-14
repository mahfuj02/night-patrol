'use client';

import { useId } from 'react';
import { experience } from '@/content/experience';
import { stations } from '@/content/stations';
import { simpleCopy } from '@/content/ui';
import { formatDateRange } from '@/lib/dates';
import { useDriveStore } from '@/store/drive';

/** The entries an Experience station lists, in the order its data gives. */
export function experienceEntries(refs: readonly string[] | undefined) {
  return (refs ?? []).flatMap((ref) => {
    const entry = experience.find((e) => e.id === ref);
    return entry ? [entry] : [];
  });
}

/**
 * The Experience station's interface, shown while the car is parked at it: the entries the station
 * lists (LIILAB, the Industrial Project, the Sprint-Innovation win), each with its title,
 * organisation, dates, summary and bullets, in the order the station's data gives. A side panel on
 * a wide screen and a bottom sheet on a phone. Nothing here takes focus by itself; Escape, or the
 * close button, leaves the station. The 3D office behind it is a picture.
 */
export function ExperiencePanel() {
  const phase = useDriveStore((s) => s.station.phase);
  const index = useDriveStore((s) => s.station.index);
  const closeStation = useDriveStore((s) => s.closeStation);
  const headingId = useId();

  const station = index !== null ? stations[index] : undefined;
  if (!(phase === 'parked' && station?.section === 'experience')) return null;
  const entries = experienceEntries(station.entryRefs);

  return (
    <aside
      aria-labelledby={headingId}
      className="bg-night-2 text-snow border-hud/40 fixed inset-x-0 bottom-[9.5rem] z-10 max-h-[60dvh] overflow-y-auto rounded-t-xl border p-5 shadow-xl lg:inset-x-auto lg:top-28 lg:right-3 lg:bottom-36 lg:max-h-none lg:w-[28rem] lg:rounded-xl"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id={headingId} className="text-street text-lg font-semibold">
          {simpleCopy.station.sections.experience}
        </h2>
        <button
          type="button"
          onClick={closeStation}
          aria-label={simpleCopy.station.leave}
          className="text-snow hover:text-street rounded-md px-2 py-1 text-xl leading-none"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <ol className="space-y-5">
        {entries.map((entry) => {
          const dates = formatDateRange(entry.start, entry.end);
          return (
            <li key={entry.id}>
              <article aria-labelledby={`${headingId}-${entry.id}`}>
                <h3 id={`${headingId}-${entry.id}`} className="text-street text-base font-semibold">
                  {entry.title}
                </h3>
                <p className="text-snow">{entry.org}</p>
                {dates && (
                  <p className="text-hud font-mono text-sm">
                    <time dateTime={entry.start ?? entry.end}>{dates}</time>
                  </p>
                )}
                {entry.summary && <p className="text-snow mt-2">{entry.summary}</p>}
                {entry.bullets.length > 0 && (
                  <ul className="text-snow mt-2 list-disc pl-5">
                    {entry.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </article>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
