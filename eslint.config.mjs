import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';

const threeRestricted = [
  { group: ['three', 'three/*'], message: '3D code may only be imported under src/scene/.' },
  { group: ['@react-three/*'], message: '3D code may only be imported under src/scene/.' },
  { group: ['postprocessing'], message: '3D code may only be imported under src/scene/.' },
];

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
    files: ['src/scene/**'],
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
