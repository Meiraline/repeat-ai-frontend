import type { Preview } from '@storybook/react-vite';
import '../src/app/styles/global.css';

const preview: Preview = {
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'light' },
  },
};

export default preview;
