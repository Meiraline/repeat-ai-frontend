import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.tsx'],
  framework: {
    name: '@storybook/react-vite',
    options: { builder: { viteConfigPath: '.storybook/vite.config.ts' } },
  },
  core: { disableTelemetry: true },
  async viteFinal(config) {
    // Do not load the application router or dev worker into Storybook.
    config.resolve = {
      ...config.resolve,
      alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) },
    };
    return config;
  },
};

export default config;
