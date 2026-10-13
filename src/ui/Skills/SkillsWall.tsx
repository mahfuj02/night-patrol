import { skillCategories } from '@/content/schema';
import { skills } from '@/content/skills';
import { simpleCopy } from '@/content/ui';
import { groupSkills } from '@/lib/skills';

const groups = groupSkills(skills, skillCategories);

/**
 * The Skills building's lit wall, seen from the car: each group and its skills on a line. It is a
 * picture only (the accessible list is the skills panel), so the wall always hides it from assistive
 * tech. It is real DOM so the wall stays crisp, not a texture.
 */
export function SkillsWall() {
  return (
    <div>
      <h2 className="text-street text-4xl font-semibold">{simpleCopy.station.sections.skills}</h2>
      <div className="mt-3 space-y-1.5">
        {groups.map((group) => (
          <div key={group.category} className="flex gap-4 text-xl">
            <span className="text-hud w-28 shrink-0 font-mono">
              {simpleCopy.skillCategories[group.category]}
            </span>
            <span className="text-snow line-clamp-1">
              {group.skills.map((skill) => skill.name).join(' · ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
