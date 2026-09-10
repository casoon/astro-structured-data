import { test } from 'vitest';
import assert from 'node:assert/strict';
import { collectSitemapHints, serializeJsonLd, sitemapAttributes, stripNonSchemaKeys } from '../src/utils/json-ld.ts';

const LINE_SEP = String.fromCharCode(0x2028);
const PARA_SEP = String.fromCharCode(0x2029);

test('escapes characters that could break out of the script block', () => {
  const payload = { name: '</script><script>alert(1)</script>', note: 'a & b', sep: `x${LINE_SEP}y${PARA_SEP}z` };
  const out = serializeJsonLd(payload);

  assert.ok(!out.includes('<'), 'no raw "<"');
  assert.ok(!out.includes('>'), 'no raw ">"');
  assert.ok(!out.includes('&'), 'no raw "&"');
  assert.ok(!out.includes(LINE_SEP) && !out.includes(PARA_SEP), 'no raw line/paragraph separators');
});

test('escaped output parses back to the original value', () => {
  const payload = { '@type': 'Article', headline: `A <b>bold</b> & "quoted" </script> title${LINE_SEP}` };
  assert.deepEqual(JSON.parse(serializeJsonLd(payload)), payload);
});

test('strips page-level hints but keeps schema properties', () => {
  const item = {
    '@type': 'WebPage',
    name: 'Hi',
    changefreq: 'weekly',
    priority: 0.8,
    robots: 'noindex',
    alternates: [{ href: 'https://example.com/en/', hreflang: 'en' }],
  };
  assert.deepEqual(stripNonSchemaKeys(item), { '@type': 'WebPage', name: 'Hi' });
});

test('collects sitemap hints across items and renders them as data attributes', () => {
  const hints = collectSitemapHints([{ '@type': 'Article', changefreq: 'weekly' }, { '@type': 'BreadcrumbList', priority: 0.8 }]);
  assert.deepEqual(sitemapAttributes(hints), { 'data-sitemap-changefreq': 'weekly', 'data-sitemap-priority': '0.8' });
});

test('accepts identical hints on several items', () => {
  assert.deepEqual(
    collectSitemapHints([{ '@type': 'A', priority: 0.5 }, { '@type': 'B', priority: 0.5 }]),
    { priority: 0.5 }
  );
});

test('rejects conflicting sitemap hints on one page', () => {
  assert.throws(
    () => collectSitemapHints([{ '@type': 'A', changefreq: 'daily' }, { '@type': 'B', changefreq: 'weekly' }]),
    /Conflicting sitemap changefreq/
  );
});

test('rejects invalid sitemap hints', () => {
  assert.throws(() => collectSitemapHints([{ '@type': 'A', changefreq: 'sometimes' }]), /Invalid sitemap changefreq/);
  assert.throws(() => collectSitemapHints([{ '@type': 'A', priority: 1.5 }]), /Invalid sitemap priority/);
});
