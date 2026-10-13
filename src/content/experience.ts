import type { Experience } from './schema';

// The entries the Experience station and /simple show, in the order they are listed. Dates and
// roles follow mahfuj.dev.
export const experience: Experience[] = [
  {
    id: 'liilab',
    kind: 'work',
    title: 'Junior Software Engineer',
    org: 'LIILAB',
    location: 'Sylhet, Bangladesh',
    start: '2021-02',
    end: '2023-05',
    summary:
      'Django, WordPress themes and plugins. Team lead bridging the backend and WordPress teams.',
    bullets: [
      'Bridged the backend and WordPress teams.',
      'Improved WordPress theme performance score while keeping design and accessibility intact.',
      'Built RESTful APIs with Django for data sync.',
      'Code reviews, database schema design, and UX research collaboration.',
    ],
  },
  {
    id: 'rrc-diploma',
    kind: 'education',
    title: 'Diploma in Full Stack Web Development',
    org: 'Red River College Polytechnic',
    location: 'Winnipeg, MB',
    start: '2023-08',
    end: '2025-08',
    bullets: [],
  },
  {
    id: 'industrial-project',
    kind: 'work',
    title: 'Industrial Project (Mobile App Development)',
    org: 'RRC Polytechnic',
    location: 'Winnipeg, MB',
    start: '2025-05',
    end: '2025-09',
    summary: 'Worked with a student-industry team on a real-world mobile app.',
    bullets: [
      'Feature modules and API integration.',
      'UI improvements.',
      'Testing, bug triage and release preparation.',
    ],
  },
  {
    id: 'sprint-innovation-2025',
    kind: 'achievement',
    title: 'Sprint-Innovation 2025: Winner',
    org: 'Hosted by Canada Life, Tech Manitoba and Red River College Polytechnic',
    // TODO(content): verify the result, category and month
    start: '2025',
    bullets: [],
  },
];
