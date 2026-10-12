import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';

const threeRestricted = [
  { group: ['three', 'three/*'], message: '3D code may only be imported under src/scene/.' },
  { group: ['@react-three/*'], message: '3D code may only be imported under src/scene/.' },
  { group: ['postprocessing'], message: '3D code may only be imported under src/scene/.' },
];

// The validated content index pulls zod and every content file into the bundle. Client code
// imports the plain data files (@/content/stops, @/content/route, @/content/ui) instead.
const contentIndexRestricted = {
  name: '@/content',
  message:
    'Import a plain data file such as @/content/stops instead; the validated index is for server code and tests.',
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    rules: {
      'no-console': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      'no-restricted-imports': ['error', { patterns: threeRestricted }],
    },
  },
  {
    // 3D is allowed under src/scene, but it is client code, so the content index is still off limits.
    files: ['src/scene/**'],
    rules: { 'no-restricted-imports': ['error', { paths: [contentIndexRestricted] }] },
  },
  {
    files: [
      'src/store/**',
      'src/hooks/**',
      'src/ui/DriveControls/**',
      'src/app/HomeExperience.tsx',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: threeRestricted, paths: [contentIndexRestricted] },
      ],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'tests/**'],
    rules: { 'no-restricted-imports': 'off' },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;
