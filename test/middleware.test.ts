import { beforeEach, expect, test, vi } from 'vitest';
import { onRequest } from '../src/middleware.ts';
import { registerSchema } from '../src/utils/graph.ts';
import { injectMetaTags } from '../src/utils/head.ts';
import { GRAPH_PLACEHOLDER } from '../src/utils/json-ld.ts';

const config = vi.hoisted(() => ({ current: {} as Record<string, any> }));
vi.mock('virtual:astro-structured-data/config', () => ({ getGlobalConfig: () => config.current }));

beforeEach(() => {
  config.current = { siteUrl: 'https://example.com', generateMeta: true, siteName: 'Example' };
});

const PAGE = '/blog/post/';
const article = { '@type': 'BlogPosting', headline: 'Post title', description: 'Post description', mainEntityOfPage: { '@type': 'WebPage', '@id': `https://example.com${PAGE}` } };
const business = { '@type': 'LocalBusiness', name: 'ACME Shop', url: 'https://acme.example.org/', description: 'Business description' };

const page = (head = '<title>T</title>', body = '<p>content</p>') => `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;
const graphPage = page('<title>T</title>', `<p>content</p>${GRAPH_PLACEHOLDER}`);

/**
 * Runs the middleware the way Astro does: `next()` resolves with a body that is still
 * streaming, and the schemas are registered only while the body is read — like components
 * that await data before rendering their schema.
 */
async function run(
  items: Record<string, any>[],
  { html = page(), contentType = 'text/html; charset=utf-8' } = {}
): Promise<Response> {
  const context: any = { url: new URL(`http://localhost:4321${PAGE}`), locals: {} };
  const response = await onRequest(context, async () => {
    const encoder = new TextEncoder();
    const middle = Math.floor(html.length / 2);
    const chunks = [html.slice(0, middle), html.slice(middle)];
    let step = 0;
    const body = new ReadableStream<Uint8Array>({
      async pull(controller) {
        if (step === 1) {
          await new Promise((resolve) => setTimeout(resolve, 5));
          for (const item of items) registerSchema(context.locals, item, PAGE);
        }
        if (step < chunks.length) controller.enqueue(encoder.encode(chunks[step]));
        else controller.close();
        step++;
      },
    });
    return new Response(body, { headers: { 'content-type': contentType, 'content-length': String(html.length) } });
  });
  return response as Response;
}

const head = (html: string) => html.slice(html.indexOf('<head>'), html.indexOf('</head>'));
const jsonLdScripts = (html: string) =>
  [...html.matchAll(/<script type="application\/ld\+json"([^>]*)>([\s\S]*?)<\/script>/g)].map(([, attrs, json]) => ({ attrs, data: JSON.parse(json) }));

test('inserts meta tags of schemas registered while the body streams', async () => {
  const html = await (await run([business, article])).text();

  expect(head(html)).toContain('<meta property="og:title" content="Post title">');
  expect(head(html)).toContain('<meta name="description" content="Post description">');
  expect(head(html)).toContain('<link rel="canonical" href="https://example.com/blog/post/">');
  expect(head(html)).toContain('<meta property="og:site_name" content="Example">');
  expect(html).not.toContain('ACME Shop');
});

test('uses siteUrl for the canonical URL, never the request origin or a thing URL', async () => {
  const html = await (await run([business])).text();
  expect(html).toContain('<link rel="canonical" href="https://example.com/blog/post/">');
  expect(html).not.toContain('localhost');
});

test('keeps tags the page defines itself and does not duplicate them', async () => {
  const html = await (await run([article], {
    html: page(`<meta name="description" content="Own"><link rel='canonical' href='https://example.com/own/'>`),
  })).text();

  expect(html.match(/name="description"/g)).toHaveLength(1);
  expect(html).toContain('content="Own"');
  expect(html.match(/rel=.canonical/g)).toHaveLength(1);
  expect(html).toContain('<meta property="og:description" content="Post description">');
});

test('escapes attribute values', async () => {
  const html = await (await run([{ ...article, headline: 'A "quoted" <b>title</b> & more' }])).text();
  expect(html).toContain('content="A &quot;quoted&quot; &lt;b&gt;title&lt;/b&gt; &amp; more"');
});

test('removes a stale content-length after rewriting', async () => {
  const response = await run([article]);
  expect(response.headers.get('content-length')).toBeNull();
});

test('adds no meta tags without a primary schema type', async () => {
  const html = page();
  expect(await (await run([{ '@type': 'BreadcrumbList', itemListElement: [] }], { html })).text()).toBe(html);
});

test('leaves the page untouched when generateMeta is off', async () => {
  config.current.generateMeta = false;
  const html = page();
  expect(await (await run([article], { html })).text()).toBe(html);
});

test('passes non-HTML responses through', async () => {
  const response = await run([article], { html: '{"ok":true}', contentType: 'application/json' });
  expect(await response.text()).toBe('{"ok":true}');
});

test.each([204, 205, 304])('passes body-less %i HTML responses through unchanged', async (status) => {
  config.current.useGraph = true;
  for (const items of [[], [article]]) {
    const context: any = { url: new URL(`http://localhost:4321${PAGE}`), locals: {} };
    const original = new Response(null, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
    const response = await onRequest(context, async () => {
      for (const item of items) registerSchema(context.locals, item, PAGE);
      return original;
    });
    expect(response).toBe(original);
  }
});

test('fails when the page has no </head> to insert into', async () => {
  await expect(run([article], { html: '<p>fragment</p>' })).rejects.toThrow(/no <\/head>/);
});

test('fails on conflicting sitemap hints between schemas of one page', async () => {
  config.current.generateMeta = false;
  await expect(run([{ ...article, priority: 0.5 }, { ...business, priority: 0.9 }])).rejects.toThrow(/Conflicting sitemap priority/);
});

test('graph mode: fills the SchemaGraph placeholder with every schema, including late ones', async () => {
  config.current.useGraph = true;
  const html = await (await run([business, { ...article, changefreq: 'daily' }], { html: graphPage })).text();
  const scripts = jsonLdScripts(html);

  expect(scripts).toHaveLength(1);
  expect(scripts[0].attrs).toBe(' data-sitemap-changefreq="daily"');
  expect(scripts[0].data['@context']).toBe('https://schema.org');
  expect(scripts[0].data['@graph'].map((item: any) => item['@type'])).toEqual(['LocalBusiness', 'BlogPosting']);
  expect(scripts[0].data['@graph'].some((item: any) => '@context' in item || 'changefreq' in item)).toBe(false);
  expect(html).not.toContain('data-structured-data-graph');
  expect(head(html)).toContain('<meta property="og:title" content="Post title">');
});

test('graph mode: escapes content in the @graph block', async () => {
  config.current.useGraph = true;
  const html = await (await run([{ ...article, headline: '</script><script>alert(1)</script>' }], { html: graphPage })).text();
  expect(html).not.toContain('<script>alert(1)');
  expect(jsonLdScripts(html)[0].data['@graph'][0].headline).toBe('</script><script>alert(1)</script>');
});

test('graph mode: removes the placeholder on pages without schemas', async () => {
  config.current.useGraph = true;
  expect(await (await run([], { html: graphPage })).text()).toBe(page());
});

test('graph mode: fails when a page with schemas does not render SchemaGraph', async () => {
  config.current.useGraph = true;
  await expect(run([article])).rejects.toThrow(/<SchemaGraph \/> is not rendered/);
});

test('graph mode: fails when SchemaGraph is rendered more than once', async () => {
  config.current.useGraph = true;
  await expect(run([article], { html: page('<title>T</title>', GRAPH_PLACEHOLDER + GRAPH_PLACEHOLDER) }))
    .rejects.toThrow(/more than once/);
});

test('resets the schema store at the start of every request', async () => {
  const context: any = { url: new URL(`http://localhost:4321${PAGE}`), locals: { structuredDataGraph: [article], __structuredDataGraphPage: PAGE } };
  const html = page();
  const response = await onRequest(context, async () => new Response(html, { headers: { 'content-type': 'text/html' } }));
  expect(await (response as Response).text()).toBe(html);
});

test('injectMetaTags recognises existing tags regardless of quoting and case', () => {
  const html = page(`<META NAME='Description' content='x'><link rel="alternate" hreflang="EN" href="https://example.com/en/">`);
  const result = injectMetaTags(html, {
    description: 'generated',
    alternates: [{ href: 'https://example.com/en/', hreflang: 'en' }, { href: 'https://example.com/fr/', hreflang: 'fr' }],
    openGraph: {},
    twitter: {},
  }, PAGE);

  expect(result).not.toContain('generated');
  expect(result.match(/hreflang="en"/gi)).toHaveLength(1);
  expect(result).toContain('<link rel="alternate" hreflang="fr" href="https://example.com/fr/">');
});
