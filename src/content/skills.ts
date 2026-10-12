import { z } from 'zod';
import { SkillSchema } from './schema';

// TODO(content): verify every level (1-5) and note; levels are placeholders until reviewed.
export const skills = z.array(SkillSchema).parse([
  { id: 'typescript', name: 'TypeScript', group: 'gauge', level: 4 },
  { id: 'nextjs', name: 'Next.js', group: 'gauge', level: 4 },
  { id: 'nodejs', name: 'Node.js', group: 'gauge', level: 4 },
  { id: 'react', name: 'React', group: 'gauge', level: 4 },
  { id: 'csharp-dotnet', name: 'C# / .NET', group: 'gauge', level: 3, note: 'Learning' },
  { id: 'c-cpp', name: 'C / C++', group: 'indicator', level: 3, note: 'Embedded side' },
  { id: 'sql', name: 'SQL', group: 'switch', level: 4 },
  { id: 'prisma', name: 'Prisma', group: 'switch', level: 4 },
  { id: 'mongodb', name: 'MongoDB', group: 'switch', level: 3 },
  { id: 'firebase', name: 'Firebase', group: 'switch', level: 3 },
  { id: 'vue', name: 'Vue', group: 'switch', level: 3 },
  { id: 'angular', name: 'Angular', group: 'switch', level: 3 },
  { id: 'django', name: 'Django', group: 'switch', level: 3, note: 'RESTful APIs at LIILAB' },
  {
    id: 'wordpress',
    name: 'WordPress',
    group: 'switch',
    level: 3,
    note: 'Theme performance at LIILAB',
  },
  { id: 'gemini', name: 'Gemini', group: 'preset', level: 3 },
  { id: 'groq-whisper', name: 'Groq / Whisper', group: 'preset', level: 3 },
  { id: 'claude', name: 'Claude', group: 'preset', level: 3 },
]);
