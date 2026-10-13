import { describe, expect, it } from 'vitest';
import { skills } from '@/content/skills';
import { skillCategories } from '@/content/schema';
import { groupSkills, pips } from './skills';

describe('groupSkills', () => {
  it('groups every skill under its category, in category order', () => {
    const groups = groupSkills(skills, skillCategories);
    expect(groups.map((g) => g.category)).toEqual(['web', 'backend', 'embedded', 'ai', 'mobile']);
    expect(groups.flatMap((g) => g.skills)).toHaveLength(skills.length);
    expect(groups[0]!.skills.map((s) => s.name)).toContain('TypeScript');
    expect(groups[2]!.skills.map((s) => s.name)).toEqual(['C', 'C++']);
  });

  it('leaves out categories with no skills and follows the order it is given', () => {
    const groups = groupSkills(
      skills.filter((s) => s.category !== 'ai'),
      ['mobile', 'ai', 'web'],
    );
    expect(groups.map((g) => g.category)).toEqual(['mobile', 'web']);
  });
});

describe('pips', () => {
  it('fills as many as the level, out of five', () => {
    expect(pips(4)).toEqual([true, true, true, true, false]);
    expect(pips(1)).toEqual([true, false, false, false, false]);
    expect(pips(5).every(Boolean)).toBe(true);
    expect(pips(2, 3)).toEqual([true, true, false]);
  });
});
