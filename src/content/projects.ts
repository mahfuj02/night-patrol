import type { Project } from './schema';

// TODO(content): verify every project description, stack and link before launch.
export const projects: Project[] = [
  {
    id: 'eventflow',
    name: 'EventFlow',
    tagline: 'Scoped ticketing and CRM platform for events.',
    problem: 'Event organisers need ticketing and attendee management in one place.',
    built:
      'A ticketing and CRM platform with scoped access, payments in Stripe test mode, and serverless functions.',
    stack: [
      'Vue 3',
      'TypeScript',
      'Netlify Functions',
      'MongoDB',
      'Firebase',
      'Stripe (test mode)',
    ],
    links: {
      live: 'https://eventflow-mahfuj.netlify.app/',
      github: 'https://github.com/mahfuj02/eventflow',
    },
    images: [],
    stopId: 'exchange-warehouses',
  },
  {
    id: 'civictrack',
    name: 'CivicTrack',
    tagline: '311-style civic service request tracker.',
    problem: 'Residents need a clear way to report and follow city service requests.',
    built:
      'A request tracker in the style of a 311 service, with a .NET backend and an Angular front end.',
    stack: ['C#', '.NET', 'Angular', 'SQL Server'],
    links: {
      live: 'https://lemon-island-08030cd0f.1.azurestaticapps.net/requests',
      // TODO(content): repo is private; add the github link when it is public
    },
    images: [],
    stopId: 'city-services',
  },
  {
    id: 'roleready',
    name: 'RoleReady',
    tagline: 'AI-powered interview prep platform.',
    problem: 'Job seekers need realistic interview practice with useful feedback.',
    built:
      'A full stack interview prep platform with AI feedback and speech-to-text. I also designed the UI, UX and branding.',
    stack: ['Next.js', 'Google Gemini', 'Groq Whisper', 'Prisma', 'Neon', 'NextAuth v5'],
    links: { live: 'https://role-ready-snowy.vercel.app' },
    images: [],
    stopId: 'portage-main',
  },
  {
    id: 'safe-drive-ai',
    name: 'Safe Drive AI',
    tagline: 'Dashcam-integrated driving safety app.',
    problem:
      'Drivers benefit from safety insight built on the footage their dashcam already records.',
    built:
      'A driving safety app that explored dashcam and in-car integrations (BlackVue, Viofo, AAOS).',
    stack: ['AAOS', 'BlackVue', 'Viofo'],
    links: {},
    images: [],
    stopId: 'dashcam',
  },
  {
    id: 'akari',
    name: 'Akari Puzzle Game',
    tagline: 'A Light Up logic puzzle game.',
    problem: 'A classic logic puzzle, rebuilt as a playable game.',
    built: 'An Akari (Light Up) puzzle game.',
    stack: ['C++', 'Web'],
    links: {},
    images: [],
    stopId: 'arcade',
  },
  {
    id: 'site-audit-extension',
    name: 'Site Audit Extension',
    tagline: 'A debugger-style browser extension for reviewing sites.',
    problem: 'Reviewing a site page by page is slow, and issues are hard to trace back to code.',
    built: 'A browser extension that reviews a site page by page and points to the files to fix.',
    stack: ['Browser extension', 'JavaScript'],
    links: {},
    images: [],
    stopId: 'inspection-building',
  },
  {
    id: 'game-hub',
    name: 'Game Hub',
    tagline: 'A React practice project.',
    problem: 'A hands-on project for practising React with TypeScript.',
    built: 'A React and TypeScript web app.',
    stack: ['React', 'TypeScript'],
    links: {
      live: 'https://game-hub-rho-inky.vercel.app/',
      github: 'https://github.com/mahfuj02/game-hub',
    },
    images: [],
  },
  {
    id: 'av-device-controller',
    name: 'AV Device Controller',
    tagline: 'C++17 command-line system simulating control of AV displays in a venue.',
    problem:
      'Venues with many displays need one place to manage power, volume, input and temperature.',
    built:
      'A C++17 command-line system that simulates centralized control of multiple AV displays: power, volume, input, temperature monitoring and audit logging.',
    stack: ['C++17', 'CMake'],
    links: { github: 'https://github.com/mahfuj02/av-device-controller' },
    images: [],
  },
];
