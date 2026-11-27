import { defineMain } from '@storybook/react-vite/node';
import react from '@vitejs/plugin-react';
import { mergeConfig } from 'vite';

export default defineMain({
  stories: ['../stories/**/*.stories.tsx'],
  addons: ['@storybook/addon-a11y'],
  framework: { name: '@storybook/react-vite', options: {} },
  core: { disableTelemetry: true },
  // O pacote não tem vite.config próprio: o plugin do React entra aqui.
  viteFinal: (config) => mergeConfig(config, { plugins: [react()] }),
});
