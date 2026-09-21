// Local production smoke server. Configure the same routing on the actual host.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(fileURLToPath(new URL('../build/client/', import.meta.url)));
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname.startsWith('/api/')) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: { code: 'API_NOT_CONFIGURED', message: 'API not configured', retryable: false },
        }),
      );
      return;
    }
    let file = path.resolve(root, `.${pathname}`);
    const relative = path.relative(root, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      res.writeHead(403);
      res.end();
      return;
    }
    try {
      if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
      await stat(file);
    } catch {
      if (path.extname(pathname)) {
        res.writeHead(404);
        res.end();
        return;
      }
      file = path.join(root, '__spa-fallback.html');
      if (
        ![
          '/app',
          '/app/courses',
          '/app/knowledge',
          '/app/tutor',
          '/app/diplomas',
          '/app/settings',
          '/app/billing',
          '/app/billing/checkout',
          '/app/billing/return',
          '/onboarding',
        ].includes(pathname) &&
        !/^\/app\/tracks\/[a-zA-Z0-9-]+(?:\/knowledge|\/tutor|\/project|\/diploma|\/(?:topics|exam)\/[a-zA-Z0-9-]+)?$/.test(
          pathname,
        ) &&
        !/^\/app\/plans\/[a-zA-Z0-9-]+(?:\/review)?$/.test(pathname) &&
        !/^\/auth\/(login|register|restore|reset|verify|verified|reset-done|invalid)$/.test(
          pathname,
        ) &&
        !/^\/legal\/(terms|privacy)$/.test(pathname)
      )
        res.statusCode = 404;
    }
    res.setHeader('Content-Type', types[path.extname(file)] ?? 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    res.end(await readFile(file));
  } catch {
    res.writeHead(500);
    res.end('Preview unavailable');
  }
}).listen(4173, '127.0.0.1', () => console.log('Production preview: http://127.0.0.1:4173'));
