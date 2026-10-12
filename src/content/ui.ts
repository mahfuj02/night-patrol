import type { UiCopy } from './schema';

export const simpleCopy: UiCopy = {
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
};
