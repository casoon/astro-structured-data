// SSR benchmark: time to first byte, total time and server memory of pages rendered on demand
// with the Node adapter, for the integration's configurations and a baseline without its
// middleware. Not part of the test run. Needs `npm run build` first.
// Usage: node scripts/bench-ssr/run.mjs [requests per page, default 30]
import { spawn } from 'node:child_process';
import { request } from 'node:http';
import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import node from '@astrojs/node';
import { build } from 'astro';
import structuredData from '../../dist/index.js';

const ROOT = new URL('./', import.meta.url);
const REQUESTS = Number(process.argv[2] ?? 30);
const CONCURRENCY = 10;

// The components read the integration's config module; the baseline provides only that
// module, so it renders the same components and output without the middleware.
const configModuleOnly = {
  name: 'bench-config-module-only',
  hooks: {
    'astro:config:setup': ({ updateConfig }) => updateConfig({
      vite: {
        plugins: [{
          name: 'bench-config-module',
          resolveId: (id) => (id === 'virtual:astro-structured-data/config' ? '\0bench-config' : undefined),
          load: (id) => (id === '\0bench-config' ? 'export const getGlobalConfig = () => ({ siteUrl: "https://example.com" });' : undefined),
        }],
      },
    }),
  },
};

const CONFIGS = {
  'baseline (no middleware)': configModuleOnly,
  'useGraph: false, generateMeta: false': structuredData({ useGraph: false, generateMeta: false }),
  'useGraph: true': structuredData({ useGraph: true, generateMeta: false }),
  'generateMeta: true': structuredData({ useGraph: false, generateMeta: true }),
};

const PAGES = {
  'small (6 KB)': '/?rows=20',
  'small + 200 ms await': '/?rows=20&delay',
  'large (2.7 MB)': '/?rows=10000',
  'large + 200 ms await': '/?rows=10000&delay',
  'large + await, article without WebPage': '/?rows=10000&delay&article-only',
};

function get(port, path) {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    let ttfb;
    let bytes = 0;
    request({ port, path, agent: false }, (res) => {
      res.on('data', (chunk) => {
        ttfb ??= performance.now() - start;
        bytes += chunk.length;
      });
      res.on('end', () => resolve({ status: res.statusCode, ttfb, total: performance.now() - start, bytes }));
      res.on('error', reject);
    }).on('error', reject).end();
  });
}

async function startServer(entry) {
  const child = spawn(process.execPath, ['--expose-gc', fileURLToPath(new URL('serve.mjs', ROOT)), entry], { stdio: ['ignore', 'pipe', 'inherit'] });
  const port = await new Promise((resolve) => child.stdout.once('data', (data) => resolve(JSON.parse(data).port)));
  return { port, stop: () => child.kill() };
}

const median = (values) => values.toSorted((a, b) => a - b)[Math.floor(values.length / 2)];
const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1);

const results = [];
for (const [name, integration] of Object.entries(CONFIGS)) {
  const outDir = new URL(`.out/${name.replace(/\W+/g, '-')}/`, ROOT);
  await rm(outDir, { recursive: true, force: true });
  await build({
    root: fileURLToPath(ROOT),
    configFile: false,
    site: 'https://example.com',
    outDir: fileURLToPath(outDir),
    output: 'server',
    adapter: node({ mode: 'middleware' }),
    logLevel: 'error',
    integrations: [integration],
  });

  for (const [page, path] of Object.entries(PAGES)) {
    // A fresh server per page, so the memory peaks of one page do not hide the next one's.
    const server = await startServer(fileURLToPath(new URL('server/entry.mjs', outDir)));
    try {
      for (let i = 0; i < 3; i++) await get(server.port, path); // warm-up
      const sequential = [];
      for (let i = 0; i < REQUESTS; i++) sequential.push(await get(server.port, path));
      if (sequential.some((r) => r.status !== 200)) throw new Error(`${name} ${page}: status ${sequential[0].status}`);

      await get(server.port, '/__mem/reset');
      for (let i = 0; i < REQUESTS / CONCURRENCY; i++) {
        await Promise.all(Array.from({ length: CONCURRENCY }, () => get(server.port, path)));
      }
      const memory = await new Promise((resolve) => request({ port: server.port, path: '/__mem', agent: false }, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk)).on('end', () => resolve(JSON.parse(body)));
      }).end());

      results.push({
        config: name,
        page,
        'TTFB ms': median(sequential.map((r) => r.ttfb)).toFixed(1),
        'total ms': median(sequential.map((r) => r.total)).toFixed(1),
        [`peak heap Δ MB (${CONCURRENCY} parallel)`]: mb(memory.heap - memory.baseHeap),
        [`peak RSS Δ MB (${CONCURRENCY} parallel)`]: mb(memory.rss - memory.baseRss),
        size: `${(sequential[0].bytes / 1024).toFixed(0)} KB`,
      });
    } finally {
      server.stop();
    }
  }
}

console.log(`Node ${process.version}, ${REQUESTS} sequential requests per page (median), then ${REQUESTS} in batches of ${CONCURRENCY}.`);
console.table(results);
