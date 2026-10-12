import { describe, expect, it } from 'vitest';
import {
  communityNotes,
  experience,
  profile,
  projects,
  radioLines,
  skills,
  stops,
  ProfileSchema,
  ProjectSchema,
  SkillSchema,
  StopSchema,
  ExperienceSchema,
} from './index';
import { assertContentIntegrity, findContentProblems } from './integrity';

const bundle = { stops, projects, experience, communityNotes, radioLines };

describe('content data', () => {
  it('has one stop per route entry, in order', () => {
    expect(stops).toHaveLength(12);
    expect(stops.map((s) => s.order)).toEqual(stops.map((_, i) => i));
  });

  it('is internally consistent', () => {
    expect(findContentProblems(bundle)).toEqual([]);
    expect(() => assertContentIntegrity(bundle)).not.toThrow();
  });

  it('keeps the phone number off the site', () => {
    expect(JSON.stringify({ profile, projects, experience })).not.toMatch(/\+?\d[\d\s().-]{8,}\d/);
  });

  it('gives the warming shelter note its resource links', () => {
    const note = communityNotes.find((n) => n.id === 'warming-shelter');
    expect(note?.links.length).toBeGreaterThanOrEqual(3);
  });

  it('includes every project in the patrol route or marks it as simple-only', () => {
    for (const p of projects) {
      if (p.stopId) expect(stops.some((s) => s.id === p.stopId)).toBe(true);
    }
  });

  it('has skills with unique ids', () => {
    expect(new Set(skills.map((s) => s.id)).size).toBe(skills.length);
  });
});

describe('schemas', () => {
  it('rejects a bad email and URL in the profile', () => {
    expect(ProfileSchema.safeParse({ ...profile, email: 'nope' }).success).toBe(false);
    expect(
      ProfileSchema.safeParse({ ...profile, links: { ...profile.links, github: 'x' } }).success,
    ).toBe(false);
  });

  it('rejects a non-kebab project id and an empty stack', () => {
    const first = projects[0]!;
    expect(ProjectSchema.safeParse({ ...first, id: 'Bad Id' }).success).toBe(false);
    expect(ProjectSchema.safeParse({ ...first, stack: [] }).success).toBe(false);
  });

  it('rejects stop t outside 0..1 and unknown landmarks', () => {
    const first = stops[0]!;
    expect(StopSchema.safeParse({ ...first, t: 1.2 }).success).toBe(false);
    expect(StopSchema.safeParse({ ...first, landmark: 'moon-base' }).success).toBe(false);
  });

  it('rejects skill levels outside 1..5', () => {
    const first = skills[0]!;
    expect(SkillSchema.safeParse({ ...first, level: 6 }).success).toBe(false);
  });

  it('accepts YYYY and YYYY-MM dates but rejects others', () => {
    const first = experience[0]!;
    expect(ExperienceSchema.safeParse({ ...first, start: '2025' }).success).toBe(true);
    expect(ExperienceSchema.safeParse({ ...first, start: '2025-13' }).success).toBe(false);
    expect(ExperienceSchema.safeParse({ ...first, start: 'Feb 2021' }).success).toBe(false);
  });
});

describe('findContentProblems', () => {
  it('reports duplicates, ordering and dangling references', () => {
    const [a, b, ...rest] = stops;
    const broken = {
      ...bundle,
      stops: [
        { ...a!, t: 0.5 },
        { ...b!, id: a!.id, t: 0.4, contentRef: 'missing', radioId: 'missing' },
        ...rest.map((s) => ({ ...s, order: s.order + 1 })),
      ],
      projects: [{ ...projects[0]!, stopId: 'nowhere' }, ...projects.slice(1)],
      radioLines: [{ ...radioLines[0]!, stopId: 'nowhere' }, ...radioLines.slice(1)],
    };
    const problems = findContentProblems(broken).join('\n');
    expect(problems).toContain('Duplicate stop id');
    expect(problems).toContain('contiguous');
    expect(problems).toContain('strictly increase');
    expect(problems).toContain('unknown contentRef');
    expect(problems).toContain('unknown radioId');
    expect(problems).toContain('unknown stopId nowhere');
    expect(() => assertContentIntegrity(broken)).toThrow(/Invalid content/);
  });

  it('reports a stop that does not reference its project back', () => {
    const swapped = {
      ...bundle,
      stops: stops.map((s) => (s.id === 'arcade' ? { ...s, contentRef: 'eventflow' } : s)),
    };
    expect(findContentProblems(swapped).join('\n')).toContain('does not reference it back');
  });

  it('reports duplicate project, experience and radio ids', () => {
    const problems = findContentProblems({
      ...bundle,
      projects: [...projects, projects[0]!],
      experience: [...experience, experience[0]!],
      radioLines: [...radioLines, radioLines[0]!],
    }).join('\n');
    expect(problems).toContain('Duplicate project id');
    expect(problems).toContain('Duplicate experience id');
    expect(problems).toContain('Duplicate radio id');
  });
});
