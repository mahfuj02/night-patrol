import { describe, expect, it } from 'vitest';
import { buildPersonJsonLd } from '@/lib/jsonld';
import { experience, profile, projects, skills, skillCategories } from './index';

const project = (id: string) => projects.find((p) => p.id === id)!;
const entry = (id: string) => experience.find((e) => e.id === id)!;
const names = (category: string) =>
  skills.filter((s) => s.category === category).map((s) => s.name);

// The content follows mahfuj.dev, with the owner's overrides (the email).
describe('content in sync with mahfuj.dev', () => {
  it('keeps the owner email and links to the resume on mahfuj.dev', () => {
    expect(profile.email).toBe('ahmedmahfujsy@gmail.com');
    expect(profile.resumeUrl).toBe('https://mahfuj.dev/resume/MahfujAhmed_Resume.pdf');
    expect(profile.links.portfolio).toBe('https://mahfuj.dev');
  });

  it('keeps the JSON-LD sameAs list to the same three profile links', () => {
    const jsonLd = buildPersonJsonLd(profile, 'https://mahfuj.dev/');
    expect(jsonLd.sameAs).toEqual([
      'https://github.com/mahfuj02',
      'https://www.linkedin.com/in/mahfuj02/',
      'https://mahfuj.dev',
    ]);
    expect(JSON.stringify(jsonLd)).not.toContain(profile.email);
  });

  it('has LIILAB as a Junior Software Engineer from February 2021 to May 2023', () => {
    const liilab = entry('liilab');
    expect(liilab.title).toBe('Junior Software Engineer');
    expect([liilab.start, liilab.end]).toEqual(['2021-02', '2023-05']);
    expect(liilab.summary).toContain('Django, WordPress themes and plugins');
    expect(liilab.bullets).toHaveLength(4);
  });

  it('has the RRC diploma from August 2023 to August 2025', () => {
    const rrc = entry('rrc-diploma');
    expect([rrc.start, rrc.end]).toEqual(['2023-08', '2025-08']);
  });

  it('has the Industrial Project, May to September 2025, for the Experience monitors', () => {
    const industrial = entry('industrial-project');
    expect(industrial.org).toBe('RRC Polytechnic');
    expect(industrial.title).toContain('Mobile App Development');
    expect([industrial.start, industrial.end]).toEqual(['2025-05', '2025-09']);
  });

  it('adds Connexions Spectrum as a library book with no route stop', () => {
    const connexions = project('connexions-spectrum');
    expect(connexions.stack).toEqual(['React Native', 'TanStack Query', 'OpenAI API']);
    expect(connexions.links.caseStudy).toBe('https://mahfuj.dev/projects/connexions-spectrum');
    expect(connexions.stopId).toBeUndefined();
  });

  it('uses the stacks from mahfuj.dev', () => {
    expect(project('safe-drive-ai').stack).toEqual(['React Native', 'Expo', 'TypeScript']);
    expect(project('roleready').stack).toEqual(['Next.js', 'TypeScript', 'Supabase Auth']);
    for (const gone of ['NextAuth', 'Prisma', 'Neon']) {
      expect(project('roleready').stack.join(' ')).not.toContain(gone);
    }
    // The AV Device Controller keeps its C++17 and CMake stack, with no Arduino or I2C.
    expect(project('av-device-controller').stack).toEqual(['C++17', 'CMake']);
    expect(project('av-device-controller').stopId).toBeUndefined();
  });

  it('links CivicTrack to its repository', () => {
    expect(project('civictrack').links.github).toBe('https://github.com/mahfuj02/civictrack');
  });

  it('links a case study on mahfuj.dev for the projects that have one', () => {
    const slugs: Record<string, string> = {
      eventflow: 'eventflow',
      roleready: 'role-ready',
      'safe-drive-ai': 'safe-drive-ai',
      'game-hub': 'game-hub',
      'av-device-controller': 'av-device-controller',
      'connexions-spectrum': 'connexions-spectrum',
    };
    for (const [id, slug] of Object.entries(slugs)) {
      expect(project(id).links.caseStudy).toBe(`https://mahfuj.dev/projects/${slug}`);
    }
    // Not on mahfuj.dev, so no case study.
    for (const id of ['civictrack', 'akari', 'site-audit-extension']) {
      expect(project(id).links.caseStudy).toBeUndefined();
    }
  });

  it('groups skills into the five categories, with Mobile and Embedded as the owner listed', () => {
    expect(skillCategories).toEqual(['web', 'backend', 'embedded', 'ai', 'mobile']);
    expect(names('mobile')).toEqual(['React Native', 'Expo']);
    expect(names('embedded')).toEqual(['C', 'C++']);
    expect(names('web')).toEqual([
      'TypeScript',
      'React',
      'Next.js',
      'Vue',
      'Angular',
      'Tailwind',
      'WordPress',
    ]);
    expect(names('backend')).toEqual([
      'Node.js',
      'Django',
      'C# / .NET',
      'SQL',
      'Prisma',
      'MongoDB',
      'Firebase',
      'Netlify Functions',
    ]);
    expect(names('ai')).toEqual(['Gemini', 'Groq Whisper', 'Claude Code']);
  });
});
