import type { Project } from './schema';

// Stacks and links follow mahfuj.dev. Case study links point at its project pages.
// TODO(content): verify the tagline, problem and built text of each project.
export const allProjects: Project[] = [
  {
    id: 'eventflow',
    // TODO(content): owner to confirm the shelf.
    category: 'web',
    name: 'EventFlow',
    tagline: 'Scoped ticketing and CRM platform for events.',
    problem: 'Event organisers need ticketing and attendee management in one place.',
    built:
      'A ticketing and CRM platform with scoped access, payments in Stripe test mode, and serverless functions.',
    stack: [
      'Vue 3',
      'TypeScript',
      'Netlify Functions',
      'Stripe Checkout',
      'Firebase Auth',
      'MongoDB',
    ],
    links: {
      live: 'https://eventflow-mahfuj.netlify.app/',
      github: 'https://github.com/mahfuj02/eventflow',
      caseStudy: 'https://mahfuj.dev/projects/eventflow',
    },
    // TODO(content): owner to check the alt text.
    images: [
      {
        src: '/images/projects/eventflow.webp',
        alt: 'The EventFlow home page: a search bar for events, venues and cities, and upcoming events below.',
      },
    ],
    stopId: 'exchange-warehouses',
    // TODO(content): owner to tweak the sign wording.
    sign: { name: 'EventFlow', slogan: "Book your ticket. Tonight's show starts here." },
  },
  {
    id: 'civictrack',
    // TODO(content): owner to confirm the shelf.
    category: 'web',
    name: 'CivicTrack',
    tagline: '311-style civic service request tracker.',
    problem: 'Residents need a clear way to report and follow city service requests.',
    built:
      'A request tracker in the style of a 311 service, with a .NET backend and an Angular front end.',
    stack: ['C#', '.NET', 'Angular', 'SQL Server'],
    links: {
      live: 'https://lemon-island-08030cd0f.1.azurestaticapps.net/requests',
      github: 'https://github.com/mahfuj02/civictrack',
    },
    images: [],
    stopId: 'city-services',
    // TODO(content): owner to tweak the sign wording.
    sign: { name: 'CivicTrack', slogan: 'Help make Winnipeg better. Report it, track it, fixed.' },
  },
  {
    id: 'roleready',
    // TODO(content): owner to confirm the shelf.
    category: 'ai',
    name: 'RoleReady',
    tagline: 'AI-powered interview prep platform.',
    problem: 'Job seekers need realistic interview practice with useful feedback.',
    built:
      'A full stack interview prep platform with AI feedback and speech-to-text. I also designed the UI, UX and branding.',
    stack: ['Next.js', 'TypeScript', 'Supabase Auth'],
    links: {
      live: 'https://role-ready-snowy.vercel.app',
      caseStudy: 'https://mahfuj.dev/projects/role-ready',
    },
    // TODO(content): owner to check the alt text.
    images: [
      {
        src: '/images/projects/roleready.webp',
        alt: 'The RoleReady home page: the headline "Land the job you actually want", with a Get started button.',
      },
    ],
    stopId: 'portage-main',
    // TODO(content): owner to tweak the sign wording.
    sign: { name: 'RoleReady', slogan: 'Your career starts here. Practice interviews with AI.' },
  },
  {
    id: 'safe-drive-ai',
    // TODO(content): owner to confirm the shelf.
    category: 'mobile',
    name: 'Safe Drive AI',
    tagline: 'Mobile app that includes speed monitoring.',
    // TODO(content): verify; this was written when the project was a dashcam app.
    problem:
      'Drivers benefit from safety insight built on the footage their dashcam already records.',
    built:
      'A React Native and Expo mobile app, written in TypeScript, that includes speed monitoring.',
    stack: ['React Native', 'Expo', 'TypeScript'],
    links: { caseStudy: 'https://mahfuj.dev/projects/safe-drive-ai' },
    // TODO(content): owner to check the alt text. A concept design, not a capture of the app.
    images: [
      {
        src: '/images/projects/safe-drive-ai.webp',
        alt: 'Concept design of the SafeDrive AI app: permission status, a warning threshold and a large Start Drive button.',
        caption: 'Concept design',
      },
    ],
    stopId: 'dashcam',
    // TODO(content): owner to tweak the sign wording.
    sign: { name: 'Safe Drive AI', slogan: 'Eyes on the road. AI on your side.' },
  },
  {
    id: 'akari',
    // TODO(content): owner to confirm the shelf.
    category: 'systems',
    name: 'Akari Puzzle Game',
    tagline: 'A Light Up logic puzzle game.',
    problem: 'A classic logic puzzle, rebuilt as a playable game.',
    built: 'An Akari (Light Up) puzzle game.',
    stack: ['C++', 'Web'],
    links: {},
    images: [],
    // Not published yet: hidden everywhere until the owner publishes it. It has no route stop.
    published: false,
  },
  {
    id: 'site-audit-extension',
    // TODO(content): owner to confirm the shelf.
    category: 'web',
    name: 'Site Audit Extension',
    tagline: 'A debugger-style browser extension for reviewing sites.',
    problem: 'Reviewing a site page by page is slow, and issues are hard to trace back to code.',
    built: 'A browser extension that reviews a site page by page and points to the files to fix.',
    stack: ['Browser extension', 'JavaScript'],
    links: {},
    images: [],
    // Not published yet: hidden everywhere until the owner publishes it. It has no route stop.
    published: false,
  },
  {
    id: 'game-hub',
    // TODO(content): owner to confirm the shelf.
    category: 'web',
    name: 'Game Hub',
    tagline: 'A React practice project.',
    problem: 'A hands-on project for practising React with TypeScript.',
    built: 'A React and TypeScript web app.',
    stack: ['React', 'TypeScript'],
    links: {
      live: 'https://game-hub-rho-inky.vercel.app/',
      github: 'https://github.com/mahfuj02/game-hub',
      caseStudy: 'https://mahfuj.dev/projects/game-hub',
    },
    images: [],
  },
  {
    id: 'av-device-controller',
    // TODO(content): owner to confirm the shelf.
    category: 'systems',
    name: 'AV Device Controller',
    tagline: 'C++17 command-line system simulating control of AV displays in a venue.',
    problem:
      'Venues with many displays need one place to manage power, volume, input and temperature.',
    built:
      'A C++17 command-line system that simulates centralized control of multiple AV displays: power, volume, input, temperature monitoring and audit logging.',
    stack: ['C++17', 'CMake'],
    links: {
      github: 'https://github.com/mahfuj02/av-device-controller',
      caseStudy: 'https://mahfuj.dev/projects/av-device-controller',
    },
    images: [],
  },
  {
    // A library book only: no route stop.
    id: 'connexions-spectrum',
    // TODO(content): owner to confirm the shelf.
    category: 'mobile',
    name: 'Connexions Spectrum',
    tagline: 'A mobile app built with React Native.',
    // TODO(content): owner to describe the problem and what was built; the case study has the detail.
    problem: 'See the case study for the problem and the approach.',
    built: 'A React Native mobile app using TanStack Query and the OpenAI API.',
    stack: ['React Native', 'TanStack Query', 'OpenAI API'],
    links: { caseStudy: 'https://mahfuj.dev/projects/connexions-spectrum' },
    // TODO(content): owner to check the alt text. A concept design, not a capture of the app.
    images: [
      {
        src: '/images/projects/connexions-spectrum.webp',
        alt: 'Concept design of the Connexions app: a Matches screen, an inbox and a coaching prompt on phone screens.',
        caption: 'Concept design',
      },
    ],
  },
];

/** The projects the site shows: everything except the ones marked `published: false`. */
export const projects: Project[] = allProjects.filter((p) => p.published !== false);
