import { z } from 'zod';
import { ExperienceSchema } from './schema';

// Patrol log: LIILAB, RRC and Sprint-Innovation only (owner decision).
export const experience = z.array(ExperienceSchema).parse([
  {
    id: 'liilab',
    kind: 'work',
    title: 'Junior Software Engineer',
    org: 'LIILAB',
    location: 'Sylhet, Bangladesh',
    start: '2021-02',
    end: '2022-10',
    summary: 'Team lead bridging the backend and WordPress teams.',
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
    start: '2023-09',
    // TODO(content): verify graduation date (August 2025)
    end: '2025-08',
    bullets: [],
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
]);
