import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerSchema } from '../src/utils/graph.ts';

test('registers a schema and scopes the store to the page path', () => {
  const locals: Record<string, any> = {};
  registerSchema(locals, { '@type': 'Event', name: 'Meetup' }, '/events/meetup');

  assert.deepEqual(locals.structuredDataGraph, [{ '@type': 'Event', name: 'Meetup' }]);
  assert.equal(locals.__structuredDataGraphPage, '/events/meetup');
});

test('deduplicates identical schemas registered on the same page', () => {
  const locals: Record<string, any> = {};
  const schema = { '@type': 'Event', name: 'Meetup' };
  registerSchema(locals, schema, '/events/meetup');
  registerSchema(locals, { ...schema }, '/events/meetup');

  assert.equal(locals.structuredDataGraph.length, 1);
});

test('accumulates distinct schemas registered on the same page', () => {
  const locals: Record<string, any> = {};
  registerSchema(locals, { '@type': 'Event', name: 'Meetup' }, '/events/meetup');
  registerSchema(locals, { '@type': 'BreadcrumbList' }, '/events/meetup');

  assert.deepEqual(
    locals.structuredDataGraph.map((s: any) => s['@type']),
    ['Event', 'BreadcrumbList']
  );
});

// Regression: under static (SSG) output without an adapter/middleware, Astro does
// not guarantee a fresh `locals` object per page. The store must reset when the
// page path changes, otherwise schemas from earlier pages leak into later ones.
test('resets the store when the page path changes (no cross-page leak)', () => {
  const locals: Record<string, any> = {};
  registerSchema(locals, { '@type': 'Product', name: 'Gadget' }, '/products/gadget');
  registerSchema(locals, { '@type': 'Recipe', name: 'Cookies' }, '/recipes/cookies');

  assert.deepEqual(
    locals.structuredDataGraph.map((s: any) => s['@type']),
    ['Recipe']
  );
  assert.equal(locals.__structuredDataGraphPage, '/recipes/cookies');
});

test('is a no-op when locals is missing', () => {
  assert.doesNotThrow(() => registerSchema(null as any, { '@type': 'Event' }, '/a'));
  assert.doesNotThrow(() => registerSchema(undefined as any, { '@type': 'Event' }, '/a'));
});
