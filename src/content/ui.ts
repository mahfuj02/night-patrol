import { z } from 'zod';

const SimpleCopySchema = z.object({
  site: z.object({ title: z.string(), description: z.string() }),
  home: z.object({ heading: z.string(), intro: z.string(), simpleLink: z.string() }),
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
