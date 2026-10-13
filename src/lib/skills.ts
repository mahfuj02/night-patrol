import type { Skill, skillCategories } from '@/content/schema';

type Category = (typeof skillCategories)[number];

/** A group of skills under one heading. */
export interface SkillGroup {
  category: Category;
  skills: Skill[];
}

/** The skills grouped by category, in the order of `categories`, leaving out empty groups. */
export function groupSkills(
  skills: readonly Skill[],
  categories: readonly Category[],
): SkillGroup[] {
  return categories
    .map((category) => ({ category, skills: skills.filter((s) => s.category === category) }))
    .filter((group) => group.skills.length > 0);
}

/** How many of the five pips are filled for a level, as a list of booleans for drawing. */
export function pips(level: number, total = 5): boolean[] {
  return Array.from({ length: total }, (_, i) => i < level);
}
