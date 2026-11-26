import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores(['**/dist', 'prototipo']),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}', 'packages/design-system/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    extends: [reactHooks.configs.flat['recommended-latest']],
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    extends: [reactRefresh.configs.vite],
  },
  {
    // Código vindo do protótipo. O React Compiler pula os componentes com estes padrões;
    // os avisos marcam o que ajustar quando cada componente for revisado.
    files: ['packages/design-system/**/*.{ts,tsx}'],
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/static-components': 'warn',
    },
  },
  {
    files: ['apps/api/**/*.ts', 'packages/contracts/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
);
