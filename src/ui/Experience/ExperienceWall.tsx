import { stations } from '@/content/stations';
import { simpleCopy } from '@/content/ui';
import { formatDateRange } from '@/lib/dates';
import { experienceEntries } from './ExperiencePanel';

const station = stations.find((s) => s.section === 'experience');

/**
 * The LIILAB office's lit wall, seen from the car: each entry's title, organisation and dates, like
 * monitors in a row. It is a picture only (the accessible list is the experience panel), so the wall
 * always hides it from assistive tech. It is real DOM so the wall stays crisp, not a texture.
 */
export function ExperienceWall() {
  const entries = experienceEntries(station?.entryRefs);
  return (
    <div>
      <h2 className="text-street text-4xl font-semibold">
        {simpleCopy.station.sections.experience}
      </h2>
      <div className="mt-3 space-y-2">
        {entries.map((entry) => (
          <div key={entry.id} className="text-xl">
            <span className="text-snow line-clamp-1 font-semibold">{entry.title}</span>
            <span className="text-hud line-clamp-1 font-mono text-lg">
              {entry.org.split(',')[0]} {formatDateRange(entry.start, entry.end)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
