import { simpleCopy } from '@/content/ui';
import { skillCategories, type Skill } from '@/content/schema';
import { chipClass, h2Class, sectionClass } from '../styles';

export function SkillList({ skills }: { skills: Skill[] }) {
  return (
    <section aria-labelledby="skills-heading" className={sectionClass}>
      <h2 id="skills-heading" className={h2Class}>
        {simpleCopy.sections.skills}
      </h2>
      {skillCategories.map((category) => {
        const inGroup = skills.filter((s) => s.category === category);
        if (inGroup.length === 0) return null;
        return (
          <div key={category} className="mb-6">
            <h3 className="text-hud mb-3 font-mono text-sm">
              {simpleCopy.skillCategories[category]}
            </h3>
            <ul className="flex flex-wrap gap-2">
              {inGroup.map((skill) => (
                <li key={skill.id} className={chipClass}>
                  {skill.name}
                  {skill.note ? ` (${skill.note})` : ''}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
