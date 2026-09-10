import { beforeEach, expect, test, vi } from 'vitest';
import { ArticleSchema, AutoBreadcrumbSchema, SchemaGraph } from '../src/components/index.ts';
import { getRegisteredSchemas } from '../src/utils/graph.ts';
import { GRAPH_PLACEHOLDER } from '../src/utils/json-ld.ts';
import { render } from './helpers.ts';

const config = vi.hoisted(() => ({ current: {} as Record<string, any> }));
vi.mock('virtual:astro-structured-data/config', () => ({ getGlobalConfig: () => config.current }));

beforeEach(() => {
  config.current = { siteUrl: 'https://example.com', useGraph: true };
});

const article = { title: 'Title', description: 'Description', datePublished: '2026-01-01', authorName: 'Ada' };

// The @graph block itself is assembled by the middleware once the page has fully rendered;
// see middleware.test.ts and e2e.test.ts.

test('schemas render nothing inline and register themselves for the middleware', async () => {
  const locals: Record<string, any> = {};
  const inline = await render(ArticleSchema, { ...article, changefreq: 'daily' }, locals);
  await render(AutoBreadcrumbSchema, {}, locals);

  expect(inline.html.trim()).toBe('');
  expect(locals.structuredDataGraph.map((item: any) => item['@type'])).toEqual(['BlogPosting', 'BreadcrumbList']);
  expect(locals.structuredDataGraph[0].changefreq).toBe('daily');
});

test('SchemaGraph only renders the placeholder the middleware fills in', async () => {
  const locals: Record<string, any> = {};
  await render(ArticleSchema, article, locals);
  const { html } = await render(SchemaGraph, {}, locals);
  expect(html.trim()).toBe(GRAPH_PLACEHOLDER);
});

test('a schema rendered after SchemaGraph is still collected', async () => {
  const locals: Record<string, any> = {};
  await render(SchemaGraph, {}, locals);
  await render(ArticleSchema, article, locals);
  expect(getRegisteredSchemas(locals, '/blog/post/').map((item) => item['@type'])).toEqual(['BlogPosting']);
});

test('does not carry schemas over to another page sharing the same locals', async () => {
  const locals: Record<string, any> = {};
  await render(ArticleSchema, article, locals, '/a/');
  expect(getRegisteredSchemas(locals, '/b/')).toEqual([]);
});
