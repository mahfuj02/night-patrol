'use client';

import { useId } from 'react';
import { skillCategories } from '@/content/schema';
import { profile } from '@/content/profile';
import { skills } from '@/content/skills';
import { stations } from '@/content/stations';
import { simpleCopy } from '@/content/ui';
import { groupSkills, pips } from '@/lib/skills';
import { formatTemplate } from '@/lib/template';
import { useDriveStore } from '@/store/drive';

const copy = simpleCopy.skills;
const groups = groupSkills(skills, skillCategories);

/**
 * The Skills station's interface, shown while the car is parked at it: the skill groups, each skill
 * with its name, its level as text ("Level 4 of 5", also drawn as pips) and its note, in place (no
 * tooltips). A side panel on a wide screen and a bottom sheet on a phone. Nothing here takes focus
 * by itself; Escape, or the close button, leaves the station. The 3D wall behind it is a picture.
 */
export function SkillsPanel() {
  const phase = useDriveStore((s) => s.station.phase);
  const index = useDriveStore((s) => s.station.index);
  const closeStation = useDriveStore((s) => s.closeStation);
  const headingId = useId();

  const station = index !== null ? stations[index] : undefined;
  if (!(phase === 'parked' && station?.section === 'skills')) return null;

  return (
    <aside
      aria-labelledby={headingId}
      className="bg-night-2 text-snow border-hud/40 fixed inset-x-0 bottom-[12.5rem] z-10 max-h-[60dvh] overflow-y-auto rounded-t-xl border p-5 shadow-xl lg:inset-x-auto lg:top-28 lg:right-3 lg:bottom-36 lg:max-h-none lg:w-[26rem] lg:rounded-xl"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id={headingId} className="text-street text-lg font-semibold">
          {simpleCopy.station.sections.skills}
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
      <div className="space-y-4">
        {groups.map((group) => (
          <section key={group.category} aria-label={simpleCopy.skillCategories[group.category]}>
            <h3 className="text-hud mb-1 font-mono text-xs tracking-wide uppercase">
              {simpleCopy.skillCategories[group.category]}
            </h3>
            <ul className="space-y-1">
              {group.skills.map((skill) => (
                <li key={skill.id} className="flex flex-wrap items-baseline gap-x-3">
                  <span className="text-snow font-semibold">{skill.name}</span>
                  <span className="text-hud text-xs">
                    <span aria-hidden="true" className="mr-1.5 inline-flex gap-0.5 align-middle">
                      {pips(skill.level).map((on, i) => (
                        <span
                          key={i}
                          className={`h-2 w-2 rounded-full ${on ? 'bg-hud' : 'bg-hud/25'}`}
                        />
                      ))}
                    </span>
                    {formatTemplate(copy.levelOf, { n: skill.level })}
                  </span>
                  {skill.note && <span className="text-snow/80 text-xs">{skill.note}</span>}
                </li>
              ))}
            </ul>
          </section>
        ))}
        {profile.highlights.length > 0 && (
          <section aria-label={copy.also}>
            <h3 className="text-hud mb-1 font-mono text-xs tracking-wide uppercase">{copy.also}</h3>
            <ul className="space-y-1">
              {profile.highlights.map((line) => (
                <li key={line} className="text-snow">
                  {line}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </aside>
  );
}
