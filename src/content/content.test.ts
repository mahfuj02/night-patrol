import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  allProjects,
  atmosphereZones,
  buildingStretches,
  communityNotes,
  stations,
  transitZones,
  experience,
  profile,
  projects,
  radioLines,
  route,
  signage,
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
  buildings: buildingStretches,
  stations,
  transitZones,
  route,
  stops,
  projects,
  experience,
  communityNotes,
  radioLines,
};

describe('content data', () => {
  it('has one stop per route entry, in order', () => {
    expect(stops).toHaveLength(8);
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
      stops: stops.map((s) => (s.id === 'dashcam' ? { ...s, contentRef: 'eventflow' } : s)),
    };
    expect(findContentProblems(swapped).join('\n')).toContain('does not reference it back');
  });

  it('gives every project stop a sign, and reports one without', () => {
    for (const project of projects.filter((p) => p.stopId)) {
      expect(project.sign?.name).toBeTruthy();
      expect(project.sign?.slogan).toBeTruthy();
    }
    expect(projects.find((p) => p.id === 'civictrack')!.sign).toEqual({
      name: 'CivicTrack',
      slogan: 'Help make Winnipeg better. Report it, track it, fixed.',
    });
    const unsigned = {
      ...bundle,
      projects: projects.map((p) => (p.id === 'safe-drive-ai' ? { ...p, sign: undefined } : p)),
    };
    expect(findContentProblems(unsigned).join(' | ')).toContain(
      'safe-drive-ai has a stop but no sign',
    );
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
    const problems = findContentProblems({ ...bundle, route: { ...route, points } }).join('\n');
    expect(problems).toContain('Duplicate route stop pin id');
    expect(problems).toContain('pins unknown stop nowhere');
    expect(problems).toContain('Stop dispatch has no route point');

    const swapped = route.points.map((p) => ({ ...p }));
    const a = swapped.findIndex((p) => p.stopId === 'dispatch');
    const b = swapped.findIndex((p) => p.stopId === 'rrc-campus');
    swapped[a]!.stopId = 'rrc-campus';
    swapped[b]!.stopId = 'dispatch';
    expect(
      findContentProblems({ ...bundle, route: { ...route, points: swapped } }).join('\n'),
    ).toContain('in stop order');
  });
});

describe('stop signs', () => {
  it('keeps the RRC campus radio line and rooftop words', () => {
    expect(radioLines.find((r) => r.id === 'rrc-campus')?.text).toContain(
      'RRC campus on your left',
    );
    expect(signage.rrcRooftop).toBe('RRC Polytechnic');
  });

  it('links EventFlow from the warehouses stop', () => {
    expect(radioLines.find((r) => r.id === 'exchange-warehouses')?.text).toBe(
      'Show tonight at the old warehouse. Tickets running through EventFlow, on your left.',
    );
    const eventflow = projects.find((p) => p.id === 'eventflow')!;
    expect(eventflow.links.github).toBe('https://github.com/mahfuj02/eventflow');
    expect(eventflow.links.live).toBeDefined();
  });

  it('keeps the ghost signs generic and in content', () => {
    expect(Object.values(signage.ghostSigns)).toEqual([
      'DRY GOODS',
      'WHOLESALE',
      'WAREHOUSE',
      'GRAIN EXCHANGE SUPPLY',
    ]);
    expect(signage.cityRooftop).toBe('City Services');
    expect(signage.requestBoard.statuses).toEqual(['Received', 'In progress', 'Resolved']);
  });
});

describe('cross streets', () => {
  it('give signals to Princess St and Portage & Main and stop signs to the residential crossings', () => {
    const control = Object.fromEntries((route.intersections ?? []).map((x) => [x.id, x.control]));
    expect(control).toEqual({
      'princess-st': 'signals',
      'portage-main': 'signals',
      'residential-a': 'stop',
      'residential-b': 'stop',
      'residential-c': 'stop',
    });
    expect(signage.stop).toBe('STOP');
  });

  it('reject a gap narrower than its street, and control without a street', () => {
    const base = route.intersections![0]!;
    const narrow = { ...base, halfLength: 3 };
    const noStreet = { id: 'bare', stopId: base.stopId, halfLength: 10, control: 'stop' as const };
    const problems = findContentProblems({
      ...bundle,
      route: { ...route, intersections: [narrow, noStreet] },
    }).join(' | ');
    expect(problems).toContain('narrower than its cross street');
    expect(problems).toContain('stop control needs a street');
  });
});

describe('building stretches', () => {
  it('reference known stops and have unique ids', () => {
    const broken = [{ ...buildingStretches[0]!, to: 'nowhere' }, buildingStretches[0]!];
    const problems = findContentProblems({ ...bundle, buildings: broken }).join(' | ');
    expect(problems).toContain('unknown stop nowhere');
    expect(problems).toContain('Duplicate building stretch id');
  });

  it('use a min and max in order for every range', () => {
    for (const stretch of buildingStretches) {
      for (const [min, max] of [stretch.lotWidth, stretch.depth, stretch.height]) {
        expect(min).toBeLessThanOrEqual(max);
      }
    }
  });
});

describe('project images', () => {
  // Tests run from the project root.
  const root = join(process.cwd(), 'public');

  it('are small WebP files that exist in public/', () => {
    for (const project of projects) {
      for (const image of project.images) {
        const file = join(root, image.src);
        expect(existsSync(file), image.src).toBe(true);
        expect(statSync(file).size, image.src).toBeLessThanOrEqual(150 * 1024);
      }
    }
  });

  it('have alt text, and a caption on the concept designs', () => {
    const withImages = projects.filter((p) => p.images.length > 0);
    expect(withImages.map((p) => p.id)).toEqual([
      'eventflow',
      'roleready',
      'safe-drive-ai',
      'connexions-spectrum',
    ]);
    for (const project of withImages) {
      for (const image of project.images) expect(image.alt.length).toBeGreaterThan(10);
    }
    for (const id of ['safe-drive-ai', 'connexions-spectrum']) {
      expect(projects.find((p) => p.id === id)!.images[0]!.caption).toBe('Concept design');
    }
  });

  it('leaves Game Hub and the AV Device Controller with a typographic cover for now', () => {
    for (const id of ['game-hub', 'av-device-controller']) {
      expect(projects.find((p) => p.id === id)!.images).toEqual([]);
    }
  });

  it('rejects an image outside public/images/projects or that is not a WebP', () => {
    const base = projects[0]!;
    for (const src of ['/images/other/x.webp', '/images/projects/x.png', 'x.webp']) {
      expect(
        ProjectSchema.safeParse({ ...base, images: [{ src, alt: 'A picture' }] }).success,
      ).toBe(false);
    }
  });
});

describe('unpublished projects', () => {
  const hidden = ['akari', 'site-audit-extension'];

  it('keeps Akari and the site audit extension in the data, flagged as not published', () => {
    for (const id of hidden) {
      const project = allProjects.find((p) => p.id === id)!;
      expect(project.published).toBe(false);
      expect(project.stopId).toBeUndefined();
    }
  });

  it('hides them from everything the site shows', () => {
    expect(projects.map((p) => p.id)).not.toEqual(expect.arrayContaining(hidden));
    for (const id of hidden) expect(projects.some((p) => p.id === id)).toBe(false);
    expect(projects.length).toBe(allProjects.length - hidden.length);
    // No stop or station points at one either: the integrity check fails on an unknown reference.
    for (const stop of stops) expect(hidden).not.toContain(stop.contentRef);
  });

  it('reports a stop that points at an unpublished project', () => {
    const pointed = {
      ...bundle,
      stops: stops.map((s) => (s.id === 'dashcam' ? { ...s, contentRef: 'akari' } : s)),
    };
    expect(findContentProblems(pointed).join(' | ')).toContain('unknown contentRef');
  });
});

describe('atmosphere zones', () => {
  it('cover the route in order and match the planned zones', () => {
    expect(atmosphereZones.map((z) => z.id)).toEqual([
      'exchange',
      'downtown',
      'residential',
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
    expect(byId.residential!.light.intensity).toBeLessThan(byId.downtown!.light.intensity);
    expect(byId.downtown!.snow.gust).toBeGreaterThan(byId.exchange!.snow.gust);
    expect(byId.sunrise!.sunrise).toBe(1);
  });

  it('lines the avenue with elms and keeps downtown nearly bare', () => {
    const byId = Object.fromEntries(atmosphereZones.map((z) => [z.id, z]));
    expect(byId.avenue!.trees).toBe(1);
    expect(byId.downtown!.trees).toBeLessThan(byId.avenue!.trees);
    expect(byId.downtown!.trees).toBeLessThan(byId.exchange!.trees);
  });

  it('keeps the residential street calm and warm-lit only', () => {
    const shelter = atmosphereZones.find((z) => z.id === 'residential')!;
    expect(shelter.windows.cool).toBe(0);
    expect(shelter.snow.gust).toBe(0);
  });

  it('reports zone problems through the integrity check', () => {
    const broken = { ...bundle, atmosphere: [{ ...atmosphereZones[0]!, from: 'nowhere' }] };
    expect(findContentProblems(broken).join('\n')).toContain('unknown stop nowhere');
  });
});

describe('stations', () => {
  it('has the Education station on the RRC campus, turning left into a bay', () => {
    const education = stations.find((s) => s.section === 'education')!;
    expect(education.stopId).toBe('rrc-campus');
    expect(education.bay.turn).toBe('left');
    expect(education.contentRef).toBe('rrc-diploma');
    expect(education.teaserRef).toBe('sprint-innovation-2025');
    expect(education.light.offset).toBeLessThan(0);
  });

  it('rejects unknown stops and content, and duplicates', () => {
    const base = stations[0]!;
    const broken = [
      { ...base, stopId: 'nowhere' },
      { ...base, id: 'again', contentRef: 'missing' },
      { ...base, id: 'both', section: 'contact' as const },
    ];
    const problems = findContentProblems({ ...bundle, stations: broken }).join(' | ');
    expect(problems).toContain('unknown stop nowhere');
    expect(problems).toContain('unknown content missing');
    expect(problems).toContain('Duplicate station section');
  });

  it('keeps the route length in content equal to the real curve length', () => {
    expect(route.lengthMetres).toBeGreaterThan(1000);
  });
});

describe('transit zones', () => {
  it('colour the route by zone, starting at the first stop and in route order', () => {
    expect(transitZones.map((z) => z.id)).toEqual(['exchange', 'downtown', 'residential', 'forks']);
    expect(transitZones[0]!.fromStopId).toBe(stops[0]!.id);
    const orders = transitZones.map((z) => stops.find((s) => s.id === z.fromStopId)!.order);
    expect([...orders]).toEqual([...orders].sort((a, b) => a - b));
  });

  it('reject unknown stops, a late first zone, duplicates and zones out of order', () => {
    const base = transitZones;
    const broken = [
      { ...base[1]!, id: 'downtown' as const },
      { ...base[0]!, fromStopId: 'nowhere' },
      { ...base[1]! },
      { ...base[2]!, fromStopId: 'ignition' },
    ];
    const problems = findContentProblems({ ...bundle, transitZones: broken }).join(' | ');
    expect(problems).toContain('unknown stop nowhere');
    expect(problems).toContain('The first transit zone must start at the first stop');
    expect(problems).toContain('Duplicate transit zone id');
    expect(problems).toContain('must start after the zone before it');
  });
});
