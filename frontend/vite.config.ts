import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { reactRouter } from '@react-router/dev/vite';
import { defineConfig, loadEnv, type Plugin } from 'vite';

// The worker exists only in the dev server. It never enters public/ or a production build.
function mockWorker(enabled: boolean): Plugin {
  return {
    name: 'development-mock-worker',
    apply: 'serve',
    configureServer(server) {
      if (!enabled) return;
      server.middlewares.use('/mockServiceWorker.js', async (_request, response, next) => {
        try {
          const worker = await readFile(
            new URL('./node_modules/msw/lib/mockServiceWorker.js', import.meta.url),
          );
          response.setHeader('Content-Type', 'application/javascript');
          response.setHeader('Cache-Control', 'no-store');
          response.setHeader('Service-Worker-Allowed', '/');
          response.end(worker);
        } catch (error) {
          next(error);
        }
      });
    },
  };
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const mocks = env.VITE_ENABLE_MOCKS === 'true';
  if (command === 'build' && mocks) {
    throw new Error('Production builds cannot enable mocks. Build without VITE_ENABLE_MOCKS=true.');
  }

  return {
    plugins: [mockWorker(mocks), reactRouter()],
    optimizeDeps: {
      include: [
        'react',
        'react-dom/client',
        'react-router',
        'react-router/dom',
        '@tanstack/react-query',
        'zod',
        ...(mocks ? ['msw', 'msw/browser'] : []),
      ],
    },
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: {
      strictPort: true,
      proxy:
        !mocks && env.API_PROXY_TARGET
          ? { '/api': { target: env.API_PROXY_TARGET, changeOrigin: true } }
          : undefined,
    },
    build: {
      target: ['chrome152', 'edge152', 'firefox155', 'safari26'],
      cssTarget: ['chrome152', 'edge152', 'firefox155', 'safari26'],
      sourcemap: false,
    },
  };
});
