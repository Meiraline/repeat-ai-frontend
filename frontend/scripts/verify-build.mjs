import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const directory = new URL('../build/client/', import.meta.url);
const html = await readFile(new URL('index.html', directory), 'utf8');
assert(html.includes('Ваш путь к новым знаниям'), 'Landing must be prerendered');
assert(
  html.includes('Научись чему угодно') && html.includes('id="faq"') && html.includes('<details'),
  'Landing content and FAQ must exist in HTML',
);
assert(html.includes('name="description"'), 'Landing needs an SEO description');
await readFile(new URL('__spa-fallback.html', directory), 'utf8');
const files = await readdir(directory, { recursive: true });
assert(
  !files.some((file) => file.endsWith('mockServiceWorker.js')),
  'Production must not ship the mock worker',
);
for (const file of files.filter((file) => file.endsWith('.js'))) {
  const code = await readFile(new URL(file.replaceAll('\\', '/'), directory), 'utf8');
  assert(!code.includes('[MSW]'), `MSW leaked into ${file}`);
}
console.log('Verified: prerendered landing, SPA fallback, no MSW bundle.');
