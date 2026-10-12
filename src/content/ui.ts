import { z } from 'zod';

const SimpleCopySchema = z.object({
  site: z.object({ title: z.string(), description: z.string() }),
  home: z.object({ heading: z.string(), intro: z.string(), simpleLink: z.string() }),
  drive: z.object({
    navLabel: z.string(),
    prev: z.string(),
    next: z.string(),
    simpleView: z.string(),
    enRoute: z.string(),
    /** Placeholders: {n}, {total}, {title}. */
    atStop: z.string(),
    hint: z.string(),
    loading: z.string(),
    noWebGL: z.string(),
  }),
  pageTitle: z.string(),
  pageDescription: z.string(),
  skipToContent: z.string(),
  sections: z.object({
    projects: z.string(),
    skills: z.string(),
    experience: z.string(),
    community: z.string(),
    contact: z.string(),
  }),
  skillGroups: z.object({
    gauge: z.string(),
    indicator: z.string(),
    switch: z.string(),
    preset: z.string(),
  }),
  links: z.object({
    live: z.string(),
    github: z.string(),
    caseStudy: z.string(),
    resume: z.string(),
    portfolio: z.string(),
    email: z.string(),
    linkedin: z.string(),
    githubProfile: z.string(),
  }),
  labels: z.object({ stack: z.string(), problem: z.string(), built: z.string() }),
});

export const simpleCopy = SimpleCopySchema.parse({
  site: {
    title: 'Night Patrol',
    description: 'A scroll-driven 3D night drive through low-poly winter Winnipeg.',
  },
  home: {
    heading: 'Night Patrol',
    intro: 'Unit 02 is warming up. The patrol starts soon.',
    simpleLink: 'View the simple version',
  },
  drive: {
    navLabel: 'Patrol controls',
    prev: '‹ Prev',
    next: 'Next stop ›',
    simpleView: 'Simple view',
    enRoute: 'En route',
    atStop: 'Stop {n} of {total}: {title}',
    hint: 'Scroll, swipe or use the arrow keys to drive. Space or Page Down for the next stop.',
    loading: 'Starting the engine…',
    noWebGL: 'This browser cannot show the 3D drive, but the simple version has everything.',
  },
  pageTitle: 'Mahfuj: Full Stack Web Developer in Winnipeg',
  pageDescription:
    'Portfolio of Md Mahfuj Ahmed (Mahfuj), a full stack web developer in Winnipeg, MB: projects, skills, experience and contact.',
  skipToContent: 'Skip to content',
  sections: {
    projects: 'Projects',
    skills: 'Skills',
    experience: 'Experience and education',
    community: 'Community',
    contact: 'Contact',
  },
  skillGroups: {
    gauge: 'Core stack',
    indicator: 'Systems',
    switch: 'Also work with',
    preset: 'AI tooling',
  },
  links: {
    live: 'Live site',
    github: 'GitHub repository',
    caseStudy: 'Case study',
    resume: 'Download resume (PDF)',
    portfolio: 'Main portfolio at mahfuj.dev',
    email: 'Email',
    linkedin: 'LinkedIn',
    githubProfile: 'GitHub',
  },
  labels: { stack: 'Tech stack', problem: 'The problem', built: 'What I built' },
});
