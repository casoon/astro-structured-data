import { afterAll, describe, expect, test } from 'vitest';
import { build, preview } from 'astro';
import node from '@astrojs/node';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
// Built package (see global-setup.ts), exactly as consumers load it.
import structuredData from '../dist/index.js';

// Real Astro builds/servers for a page whose article schema is rendered only after an await,
// while a LocalBusiness schema in <head> and <SchemaGraph /> render before it.
const root = fileURLToPath(new URL('./fixtures/async-site/', import.meta.url));
type Options = NonNullable<Parameters<typeof structuredData>[0]>;

const outDirs: string[] = [];
afterAll(async () => {
  await Promise.all(outDirs.map((dir) => rm(dir, { recursive: true, force: true })));
});

// Inside the fixture (not the OS temp dir): the SSR server entry must resolve the repo's node_modules.
async function freshOutDir(): Promise<string> {
  const dir = await mkdtemp(join(root, '.e2e-'));
  outDirs.push(dir);
  return dir;
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, () => {
      const { port } = server.address() as { port: number };
      server.close(() => resolve(port));
    });
  });
}

/** Runs `astro dev` for the fixture in a child process (see fixtures/dev-server.mjs). */
async function startDevServer(options: Options) {
  const script = fileURLToPath(new URL('./fixtures/dev-server.mjs', import.meta.url));
  // Astro's dev server behaves differently when it detects vitest, so drop vitest's variables.
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('VITEST')));
  const child = spawn(process.execPath, [script, JSON.stringify(options), String(await freePort())], {
    env,
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  const port = await new Promise<number>((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code) => reject(new Error(`dev server exited with code ${code}`)));
    child.stdout.once('data', (chunk) => resolve(JSON.parse(String(chunk)).port));
  });
  const stop = () => new Promise<void>((resolve) => {
    child.once('exit', () => resolve());
    child.kill('SIGTERM');
  });
  return { port, stop };
}

function astroConfig(options: Options, outDir: string, extra: Record<string, unknown> = {}) {
  return {
    root,
    configFile: false as const,
    site: 'https://example.com',
    outDir,
    logLevel: 'error' as const,
    devToolbar: { enabled: false },
    integrations: [structuredData(options)],
    ...extra,
  };
}

function expectCompletePage(html: string, graph: boolean) {
  const [head, body] = html.split('</head>');
  const scripts = [...html.matchAll(/<script type="application\/ld\+json"([^>]*)>([\s\S]*?)<\/script>/g)]
    .map(([, attrs, json]) => ({ attrs, data: JSON.parse(json) }));
  const types = scripts.flatMap(({ data }) => (data['@graph'] ?? [data]).map((item: any) => item['@type']));

  // Every schema is present — including the one rendered after an await.
  expect(types, html.slice(0, 3000)).toEqual(['LocalBusiness', 'BlogPosting']);
  expect(scripts).toHaveLength(graph ? 1 : 2);
  expect(html).not.toContain('data-structured-data-graph');
  expect(html).toContain('data-sitemap-changefreq="weekly"');

  // Meta tags come from the delayed article, not from the LocalBusiness that rendered first,
  // and they sit in <head>.
  expect(head).toContain('<meta property="og:title" content="Delayed article">');
  expect(head).toContain('<meta name="description" content="Rendered after an await">');
  expect(head).toContain('<link rel="canonical" href="https://example.com/">');
  expect(body).not.toMatch(/property="og:|name="twitter:|rel="canonical"/);
}

describe.each([{ graph: true }, { graph: false }])('useGraph: $graph', ({ graph }) => {
  const options: Options = { useGraph: graph, generateMeta: true };

  test('static build', async () => {
    const outDir = await freshOutDir();
    await build(astroConfig(options, outDir));
    expectCompletePage(await readFile(join(outDir, 'index.html'), 'utf-8'), graph);
  }, 60_000);

  test('dev server (streaming render)', async () => {
    const server = await startDevServer(options);
    try {
      const response = await fetch(`http://localhost:${server.port}/`);
      expectCompletePage(await response.text(), graph);
    } finally {
      await server.stop();
    }
  }, 60_000);

  test('production SSR with the Node adapter (streaming render)', async () => {
    const port = await freePort();
    const config = astroConfig(options, await freshOutDir(), {
      output: 'server',
      adapter: node({ mode: 'standalone' }),
      server: { port },
    });
    await build(config);
    const server = await preview(config);
    try {
      const response = await fetch(`http://localhost:${server.port}/`);
      expectCompletePage(await response.text(), graph);
    } finally {
      await server.stop();
    }
  }, 60_000);
});
