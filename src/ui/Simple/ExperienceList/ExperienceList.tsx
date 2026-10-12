import { simpleCopy } from '@/content/ui';
import type { Experience } from '@/content/schema';
import { formatDateRange } from '@/lib/dates';
import { cardClass, h2Class, sectionClass } from '../styles';

export function ExperienceList({ entries }: { entries: Experience[] }) {
  return (
    <section aria-labelledby="experience-heading" className={sectionClass}>
      <h2 id="experience-heading" className={h2Class}>
        {simpleCopy.sections.experience}
      </h2>
      <ol className="grid gap-6">
        {entries.map((entry) => {
          const range = formatDateRange(entry.start, entry.end);
          return (
            <li key={entry.id}>
              <article className={cardClass} aria-labelledby={`experience-${entry.id}`}>
                <h3 id={`experience-${entry.id}`} className="text-snow text-xl font-semibold">
                  {entry.title}
                </h3>
                <p className="text-snow mt-1">
                  {entry.org}
                  {entry.location ? ` · ${entry.location}` : ''}
                </p>
                {range && (
                  <p className="text-hud mt-1 font-mono text-sm">
                    <time dateTime={entry.start}>{range}</time>
                  </p>
                )}
                {entry.summary && <p className="text-snow mt-3">{entry.summary}</p>}
                {entry.bullets.length > 0 && (
                  <ul className="text-snow mt-3 list-disc pl-5">
                    {entry.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                )}
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
