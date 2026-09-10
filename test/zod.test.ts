import { test } from 'vitest';
import assert from 'node:assert/strict';
import { validateRecommended } from '../src/zod.ts';

test('reports missing recommended fields', () => {
  const fields = validateRecommended('Organization', { name: 'ACME' }).map((w) => w.field);
  assert.deepEqual(fields.sort(), ['address', 'email', 'sameAs', 'telephone']);
});

test('treats null as missing and ignores present fields', () => {
  const fields = validateRecommended('Organization', {
    name: 'ACME',
    sameAs: ['https://x.com/acme'],
    telephone: '+49 123',
    email: null,
  }).map((w) => w.field);
  assert.deepEqual(fields.sort(), ['address', 'email']);
});

test('works for refined schemas (JobPosting, VideoObject)', () => {
  assert.ok(validateRecommended('JobPosting', { title: 'Dev' }).some((w) => w.field === 'validThrough'));
  assert.ok(validateRecommended('VideoObject', { name: 'Clip' }).some((w) => w.field === 'duration'));
});

test('does not flag required or optional-only fields', () => {
  const fields = validateRecommended('Article', {}).map((w) => w.field);
  assert.ok(!fields.includes('title'));
  assert.ok(!fields.includes('inLanguage'));
  assert.ok(fields.includes('dateModified'));
});
