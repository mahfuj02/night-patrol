import { describe, expect, it } from 'vitest';
import { experience } from '@/content/experience';
import { projects } from '@/content/projects';
import { stations } from '@/content/stations';
import { stops } from '@/content/stops';
import { resolveCheckpoint, resolveProjectDetails, resolveStation } from './checkpoint';

const sources = { experience, projects };
const stop = (id: string) => stops.find((s) => s.id === id);

describe('resolveCheckpoint', () => {
  it('shows the diploma at the Education station, with the Sprint-Innovation win as the teaser', () => {
    const result = resolveStation(stations[0]!, { experience, projects })!;
    expect(result.stopId).toBe('rrc-campus');
    expect(result.main.kind).toBe('experience');
    expect(result.main.title).toBe('Diploma in Full Stack Web Development');
    if (result.main.kind === 'experience') {
      expect(result.main.org).toBe('Red River College Polytechnic');
      expect(result.main.dates).toBe('Aug 2023 \u2013 Aug 2025');
      expect(result.main.isoDate).toBe('2023-08');
    }
    expect(result.teaser?.title).toBe('Sprint-Innovation 2025: Winner');
  });

  it('shows EventFlow at the Exchange District warehouses, with its links and no teaser', () => {
    const result = resolveCheckpoint(stop('exchange-warehouses'), sources)!;
    expect(result.main.kind).toBe('project');
    if (result.main.kind === 'project') {
      expect(result.main.title).toBe('EventFlow');
      expect(result.main.links.github).toBe('https://github.com/mahfuj02/eventflow');
      expect(result.main.stack).toContain('Vue 3');
    }
    expect(result.teaser).toBeUndefined();
  });

  it('returns null for stops without content', () => {
    expect(resolveCheckpoint(stop('ignition'), sources)).toBeNull();
    expect(resolveCheckpoint(undefined, sources)).toBeNull();
  });

  it('shows a project when the stop points at one', () => {
    const project = projects[0]!;
    const result = resolveCheckpoint({ id: 'demo', contentRef: project.id }, sources)!;
    expect(result.main.kind).toBe('project');
    if (result.main.kind === 'project') {
      expect(result.main.title).toBe(project.name);
      expect(result.main.stack).toEqual(project.stack);
    }
    expect(result.teaser).toBeUndefined();
  });

  it('returns null when the content it points at is missing', () => {
    expect(resolveCheckpoint({ id: 'demo', contentRef: 'nothing' }, sources)).toBeNull();
  });

  it('leaves out a teaser that does not exist', () => {
    const result = resolveCheckpoint(stop('rrc-campus'), sources, 'missing')!;
    expect(result.teaser).toBeUndefined();
  });
});

describe('resolveProjectDetails', () => {
  it('shows any project, including the ones with no route stop', () => {
    for (const project of projects) {
      const result = resolveProjectDetails(project.id, sources)!;
      expect(result.main.kind).toBe('project');
      expect(result.main.title).toBe(project.name);
      expect(result.teaser).toBeUndefined();
    }
  });

  it('returns null for something that is not a project', () => {
    expect(resolveProjectDetails('liilab', sources)).toBeNull();
    expect(resolveProjectDetails('nothing', sources)).toBeNull();
  });
});
