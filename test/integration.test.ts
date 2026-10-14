import { afterEach, expect, test, vi } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import structuredData from '../src/index.ts';

function setup(options: Parameters<typeof structuredData>[0], site?: string) {
  const args = {
    config: { site },
    addDevToolbarApp: vi.fn(),
    addMiddleware: vi.fn(),
    updateConfig: vi.fn(),
  };
  structuredData(options).hooks['astro:config:setup']!(args as any);
  return args;
}

let dir: string | undefined;
afterEach(async () => {
  if (dir) await rm(dir, { recursive: true, force: true });
  dir = undefined;
});

async function buildDone(html: string, options: Parameters<typeof structuredData>[0] = {}) {
  dir = await mkdtemp(join(tmpdir(), 'structured-data-'));
  await writeFile(join(dir, 'index.html'), html);
  const logger = { warn: vi.fn() };
  await structuredData(options).hooks['astro:build:done']!({ dir: pathToFileURL(`${dir}/`), logger } as any);
  return logger.warn.mock.calls.map(([message]) => message as string);
}

const jsonLd = (data: unknown) => `<html><head><script type="application/ld+json">${JSON.stringify(data)}</script></head></html>`;

test('rejects unknown options', () => {
  expect(() => structuredData({ useGrpah: true } as any)).toThrow(/Invalid integration options[\s\S]*useGrpah/);
});

test('rejects invalid option values and defaults', () => {
  expect(() => structuredData({ siteUrl: 'ftp://example.com' })).toThrow(/siteUrl/);
  expect(() => structuredData({ twitterSite: 'example' })).toThrow(/twitterSite/);
  expect(() => structuredData({ defaultLocalBusiness: { name: 'Shop', openingHours: ['always'] } })).toThrow(/openingHours/);
  expect(() => structuredData({ defaultArticlePublisher: { name: '' } })).toThrow(/defaultArticlePublisher/);
});

test('requires a site URL', () => {
  expect(() => setup({})).toThrow(/No siteUrl provided/);
});

test('registers the page middleware before user middleware', () => {
  const { addMiddleware } = setup({}, 'https://example.com');
  expect(addMiddleware).toHaveBeenCalledWith({ entrypoint: expect.any(URL), order: 'pre' });
  expect(String(addMiddleware.mock.calls[0][0].entrypoint)).toMatch(/middleware\.js$/);
});

test('fails the build on invalid JSON-LD', async () => {
  await expect(buildDone('<script type="application/ld+json">{"@type": </script>')).rejects.toThrow(/Invalid JSON-LD in index\.html/);
});

test.each([
  `<script type='application/ld+json'>{</script>`,
  '<script type=application/ld+json>{</script>',
  '<script id="x" TYPE = "Application/LD+JSON" >{</SCRIPT >',
])('finds JSON-LD in any valid attribute spelling: %s', async (html) => {
  await expect(buildDone(html)).rejects.toThrow(/Invalid JSON-LD/);
});

test('ignores other script types', async () => {
  expect(await buildDone('<script type="application/ld+jsonx">{</script><script data-type="application/ld+json">{</script>')).toEqual([]);
});

test('skips JSON-LD inside HTML comments', async () => {
  expect(await buildDone('<!-- <script type="application/ld+json">{ example </script> -->')).toEqual([]);
});

test('ignores JSON-LD markup inside a JavaScript string', async () => {
  const html = `<script>const tpl = '<script type="application/ld+json">' + data + '<\\/script>'; run(tpl);</script>`;
  expect(await buildDone(html)).toEqual([]);
});

test('checks every item of a top-level JSON-LD array', async () => {
  const warnings = await buildDone(jsonLd([{ '@type': 'WebSite', name: 'S' }, { '@type': 'Organization', name: 'ACME' }] as any));
  expect(warnings.join('\n')).toMatch(/Organization is missing recommended field "sameAs"/);
});

test('warns about missing recommended fields using schema.org paths', async () => {
  const warnings = await buildDone(jsonLd({ '@type': 'ProfilePage', mainEntity: { '@type': 'Person', name: 'Ada' } }));
  expect(warnings.join('\n')).toMatch(/"mainEntity\.description"/);
  expect(warnings.join('\n')).toMatch(/"mainEntity\.image"/);
  expect(warnings.join('\n')).toMatch(/"mainEntity\.sameAs"/);
});

test('checks items inside @graph and stays quiet when everything is present', async () => {
  const warnings = await buildDone(jsonLd({
    '@context': 'https://schema.org',
    '@graph': [{ '@type': 'Organization', name: 'ACME', sameAs: ['https://x.com/acme'], telephone: '1', email: 'a@b.example', address: {} }],
  }));
  expect(warnings).toEqual([]);
});

test('can disable the recommended-field warnings but still validates JSON', async () => {
  expect(await buildDone(jsonLd({ '@type': 'Organization', name: 'ACME' }), { warnOnMissingRecommended: false })).toEqual([]);
  await expect(buildDone('<script type="application/ld+json">nope</script>', { warnOnMissingRecommended: false })).rejects.toThrow(/Invalid JSON-LD/);
});
