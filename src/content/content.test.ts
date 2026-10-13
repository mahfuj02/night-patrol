import { describe, expect, it } from 'vitest';
import {
  atmosphereZones,
  communityNotes,
  experience,
  profile,
  projects,
  radioLines,
  route,
  skills,
  stops,
  ProfileSchema,
  ProjectSchema,
  SkillSchema,
  StopSchema,
  ExperienceSchema,
} from './index';
import { assertContentIntegrity, findContentProblems } from './integrity';

const bundle = {
  atmosphere: atmosphereZones,
  route,
  stops,
  projects,
  experience,
  communityNotes,
  radioLines,
};

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

describe('route integrity', () => {
  it('breaks the ridge and tree rows at Portage & Main, and rejects unknown intersection stops', () => {
    expect(route.intersections?.map((x) => x.id)).toContain('portage-main');
    expect(route.intersections).toHaveLength(5);
    const broken = {
      ...bundle,
      route: { ...route, intersections: [{ id: 'x', stopId: 'nope', halfLength: 5 }] },
    };
    expect(findContentProblems(broken).join(' | ')).toContain('unknown stop nope');
  });

  it('pins every stop exactly once, in order', () => {
    const pins = route.points.flatMap((p) => (p.stopId ? [p.stopId] : []));
    expect(pins).toEqual(stops.map((s) => s.id));
  });

  it('reports unknown, duplicate, missing and misordered pins', () => {
    const points = route.points.map((p) => ({ ...p }));
    points[1]!.stopId = 'nowhere';
    points[3]!.stopId = 'ignition';
    const problems = findContentProblems({ ...bundle, route: { points } }).join('\n');
    expect(problems).toContain('Duplicate route stop pin id');
    expect(problems).toContain('pins unknown stop nowhere');
    expect(problems).toContain('Stop dispatch has no route point');

    const swapped = route.points.map((p) => ({ ...p }));
    const a = swapped.findIndex((p) => p.stopId === 'dispatch');
    const b = swapped.findIndex((p) => p.stopId === 'rrc-campus');
    swapped[a]!.stopId = 'rrc-campus';
    swapped[b]!.stopId = 'dispatch';
    expect(findContentProblems({ ...bundle, route: { points: swapped } }).join('\n')).toContain(
      'in stop order',
    );
  });
});

describe('atmosphere zones', () => {
  it('cover the route in order and match the planned zones', () => {
    expect(atmosphereZones.map((z) => z.id)).toEqual([
      'exchange',
      'downtown',
      'shelter',
      'avenue',
      'forks',
      'sunrise',
    ]);
  });

  it('puts snow off and the moon up on the avenue, and heavy snow in the Exchange', () => {
    const byId = Object.fromEntries(atmosphereZones.map((z) => [z.id, z]));
    expect(byId.avenue!.snow.density).toBe(0);
    expect(byId.avenue!.moon).toBe(1);
    expect(byId.exchange!.snow.density).toBe(1);
    expect(byId.exchange!.light.type).toBe('sodium');
    expect(byId.shelter!.light.intensity).toBeLessThan(byId.downtown!.light.intensity);
    expect(byId.downtown!.snow.gust).toBeGreaterThan(byId.exchange!.snow.gust);
    expect(byId.sunrise!.sunrise).toBe(1);
  });

  it('lines the avenue with elms and keeps downtown nearly bare', () => {
    const byId = Object.fromEntries(atmosphereZones.map((z) => [z.id, z]));
    expect(byId.avenue!.trees).toBe(1);
    expect(byId.downtown!.trees).toBeLessThan(byId.avenue!.trees);
    expect(byId.downtown!.trees).toBeLessThan(byId.exchange!.trees);
  });

  it('keeps the shelter calm and warm-lit only', () => {
    const shelter = atmosphereZones.find((z) => z.id === 'shelter')!;
    expect(shelter.windows.cool).toBe(0);
    expect(shelter.snow.gust).toBe(0);
  });

  it('reports zone problems through the integrity check', () => {
    const broken = { ...bundle, atmosphere: [{ ...atmosphereZones[0]!, from: 'nowhere' }] };
    expect(findContentProblems(broken).join('\n')).toContain('unknown stop nowhere');
  });
});
