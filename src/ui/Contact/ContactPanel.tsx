'use client';

import { useId } from 'react';
import { profile } from '@/content/profile';
import { stations } from '@/content/stations';
import { simpleCopy } from '@/content/ui';
import { contactItems } from '@/lib/contact';
import { useDriveStore } from '@/store/drive';

const labels = {
  email: simpleCopy.links.email,
  linkedin: simpleCopy.links.linkedin,
  github: simpleCopy.links.githubProfile,
  portfolio: simpleCopy.links.portfolio,
} as const;

const linkClass =
  'text-hud underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hud';

/**
 * The Contact station's interface, shown while the car is parked at The Forks: email, LinkedIn,
 * GitHub, the main portfolio at mahfuj.dev and the resume (PDF), the same links as /simple. A side
 * panel on a wide screen and a bottom sheet on a phone. Nothing here takes focus by itself;
 * Escape, or the close button, leaves the station. The 3D market behind it is a picture.
 */
export function ContactPanel() {
  const phase = useDriveStore((s) => s.station.phase);
  const index = useDriveStore((s) => s.station.index);
  const closeStation = useDriveStore((s) => s.closeStation);
  const headingId = useId();

  const station = index !== null ? stations[index] : undefined;
  if (!(phase === 'parked' && station?.section === 'contact')) return null;

  return (
    <aside
      aria-labelledby={headingId}
      className="bg-night-2 text-snow border-hud/40 fixed inset-x-0 bottom-[12.5rem] z-10 max-h-[60dvh] overflow-y-auto rounded-t-xl border p-5 shadow-xl lg:inset-x-auto lg:top-28 lg:right-3 lg:bottom-36 lg:max-h-none lg:w-[26rem] lg:rounded-xl"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id={headingId} className="text-street text-lg font-semibold">
          {simpleCopy.station.sections.contact}
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
      <ul className="grid gap-3">
        {contactItems(profile).map((item) => (
          <li key={item.id}>
            <span className="text-hud font-mono text-sm">{labels[item.id]}: </span>
            <a href={item.href} className={`${linkClass} break-all`}>
              {item.text}
            </a>
          </li>
        ))}
        <li>
          <a href={profile.resumeUrl} className={linkClass}>
            {simpleCopy.links.resume}
          </a>
        </li>
      </ul>
    </aside>
  );
}
