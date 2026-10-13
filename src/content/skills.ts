import type { Skill } from './schema';

// The categories and names follow mahfuj.dev and the owner's list. Skills are grouped for the
// /simple page and the Skills station wall.
// TODO(content): verify every level (1-5); levels are placeholders until reviewed.
export const skills: Skill[] = [
  // Web
  { id: 'typescript', name: 'TypeScript', category: 'web', level: 4 },
  { id: 'react', name: 'React', category: 'web', level: 4 },
  { id: 'nextjs', name: 'Next.js', category: 'web', level: 4 },
  { id: 'vue', name: 'Vue', category: 'web', level: 3 },
  { id: 'angular', name: 'Angular', category: 'web', level: 3 },
  { id: 'tailwind', name: 'Tailwind', category: 'web', level: 3 },
  {
    id: 'wordpress',
    name: 'WordPress',
    category: 'web',
    level: 3,
    note: 'Theme performance at LIILAB',
  },
  // Backend
  { id: 'nodejs', name: 'Node.js', category: 'backend', level: 4 },
  {
    id: 'django',
    name: 'Django',
    category: 'backend',
    level: 3,
    note: 'RESTful APIs at LIILAB',
  },
  { id: 'csharp-dotnet', name: 'C# / .NET', category: 'backend', level: 3, note: 'Learning' },
  { id: 'sql', name: 'SQL', category: 'backend', level: 4 },
  { id: 'prisma', name: 'Prisma', category: 'backend', level: 4 },
  { id: 'mongodb', name: 'MongoDB', category: 'backend', level: 3 },
  { id: 'firebase', name: 'Firebase', category: 'backend', level: 3 },
  { id: 'netlify-functions', name: 'Netlify Functions', category: 'backend', level: 3 },
  // Embedded
  { id: 'c', name: 'C', category: 'embedded', level: 3 },
  { id: 'cpp', name: 'C++', category: 'embedded', level: 3 },
  // AI tools
  { id: 'gemini', name: 'Gemini', category: 'ai', level: 3 },
  { id: 'groq-whisper', name: 'Groq Whisper', category: 'ai', level: 3 },
  { id: 'claude-code', name: 'Claude Code', category: 'ai', level: 3 },
  // Mobile
  { id: 'react-native', name: 'React Native', category: 'mobile', level: 3 },
  { id: 'expo', name: 'Expo', category: 'mobile', level: 3 },
];
