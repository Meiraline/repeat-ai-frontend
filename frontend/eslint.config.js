import path from 'node:path';
import js from '@eslint/js';
import ts from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

const root = path.resolve('src');
const ranks = { quarks: 0, atoms: 1, molecules: 2, organisms: 3, templates: 4 };
const boundaries = {
  meta: {
    type: 'problem',
    schema: [],
    messages: { boundary: 'Forbidden dependency: {{from}} → {{to}}.' },
  },
  create(context) {
    const filename = context.filename;
    if (/\.(test|stories)\./.test(filename)) return {};
    const from = path.relative(root, filename).split(path.sep);
    function check(node) {
      const value = node.source?.value;
      if (typeof value !== 'string' || (!value.startsWith('@/') && !value.startsWith('.'))) return;
      const target = value.startsWith('@/')
        ? path.resolve(root, value.slice(2))
        : path.resolve(path.dirname(filename), value);
      const to = path.relative(root, target).split(path.sep);
      let forbidden = false;
      if (from[0] === 'shared') forbidden = !['shared', 'design-tokens'].includes(to[0]);
      if (from[0] === 'pages') forbidden = ['app', 'mocks'].includes(to[0]);
      if (from[0] === 'features')
        forbidden =
          ['app', 'pages', 'components'].includes(to[0]) ||
          (to[0] === 'features' && from[1] !== to[1]);
      if (to[0] === 'features' && from[0] !== 'features' && to.length > 2) forbidden = true;
      if (from[0] === 'components') {
        forbidden =
          ['features', 'pages', 'app', 'mocks'].includes(to[0]) ||
          (to[0] === 'shared' && ['api', 'config'].includes(to[1]));
        if (
          to[0] === 'components' &&
          (from[1] !== to[1] || from[2] !== to[2]) &&
          ranks[to[1]] >= ranks[from[1]]
        )
          forbidden = true;
      }
      if (to[0] === 'mocks' && from[0] !== 'mocks' && !filename.endsWith('entry.client.tsx'))
        forbidden = true;
      if (forbidden)
        context.report({
          node,
          messageId: 'boundary',
          data: { from: from.join('/'), to: to.join('/') },
        });
    }
    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
      ImportExpression(node) {
        check({ ...node, source: node.source });
      },
    };
  },
};

export default ts.config(
  {
    ignores: [
      'node_modules/**',
      'build/**',
      '.react-router/**',
      'storybook-static/**',
      'playwright-report/**',
      'test-results/**',
      'coverage/**',
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ['**/*.{js,mjs,ts,tsx}'],
    languageOptions: {
      globals: { process: 'readonly', console: 'readonly', URL: 'readonly', Buffer: 'readonly' },
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': hooks, architecture: { rules: { boundaries } } },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'architecture/boundaries': 'error',
    },
  },
  prettier,
);
