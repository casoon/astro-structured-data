import { expect, test } from 'vitest';
import assert from 'node:assert/strict';
import { findPageItems, findPrimaryItem, generateMetaTags } from '../src/utils/meta.ts';

const context = { siteUrl: 'https://example.com', canonicalUrl: 'https://example.com/events/meetup/' };

test('JobPosting meta uses its title and a plain-text description', () => {
  const job = { '@type': 'JobPosting', title: 'Senior Developer', description: '<p>We build <strong>things</strong> &amp; more.</p>' };
  const seo = generateMetaTags(job, context);
  expect(seo.openGraph['og:title']).toBe('Senior Developer');
  expect(seo.description).toBe('We build things & more.');
  expect(seo.twitter['twitter:description']).toBe('We build things & more.');
});

test('ProfilePage meta describes the person in mainEntity', () => {
  const profile = {
    '@type': 'ProfilePage',
    mainEntity: { '@type': 'Person', name: 'Ada', description: 'Engineer', image: '/ada.jpg' },
  };
  const seo = generateMetaTags(profile, context);
  expect(seo.openGraph['og:title']).toBe('Ada');
  expect(seo.description).toBe('Engineer');
  expect(seo.openGraph['og:image']).toBe('https://example.com/ada.jpg');
});

test('emits no title or description tags when the schema has none', () => {
  const seo = generateMetaTags({ '@type': 'FAQPage', mainEntity: [] }, context);
  expect(seo.openGraph).not.toHaveProperty('og:title');
  expect(seo.description).toBeUndefined();
});

test('canonical is the page URL for things whose url points elsewhere', () => {
  const event = { '@type': 'Event', name: 'Meetup', url: 'https://tickets.example.org/meetup' };
  expect(generateMetaTags(event, context).canonical).toBe('https://example.com/events/meetup/');
  expect(generateMetaTags(event, context).openGraph['og:url']).toBe('https://example.com/events/meetup/');
});

test('canonical follows an explicit WebPage url or mainEntityOfPage', () => {
  expect(generateMetaTags({ '@type': 'WebPage', name: 'P', url: 'https://example.com/p/' }, context).canonical)
    .toBe('https://example.com/p/');
  expect(generateMetaTags({ '@type': 'BlogPosting', headline: 'H', mainEntityOfPage: { '@id': 'https://example.com/h/' } }, context).canonical)
    .toBe('https://example.com/h/');
});

const business = { '@type': 'LocalBusiness', name: 'ACME', url: 'https://example.com/' };
const site = { '@type': 'WebSite', name: 'ACME', url: 'https://example.com/' };

test('prefers the page schema over a global LocalBusiness/WebSite', () => {
  const page = { '@type': 'WebPage', name: 'About', url: 'https://example.com/about' };
  assert.equal(findPrimaryItem([business, site, page]), page);
});

test('picks Event and JobPosting over site-wide schemas', () => {
  const event = { '@type': 'Event', name: 'Meetup' };
  const job = { '@type': 'JobPosting', title: 'Dev' };
  assert.equal(findPrimaryItem([business, event]), event);
  assert.equal(findPrimaryItem([site, job]), job);
});

test('prefers an article over its WebPage container', () => {
  const page = { '@type': 'WebPage', name: 'Post' };
  const article = { '@type': 'BlogPosting', headline: 'Post' };
  assert.equal(findPrimaryItem([page, article]), article);
});

test('falls back to LocalBusiness when it is the only primary type', () => {
  assert.equal(findPrimaryItem([{ '@type': 'BreadcrumbList' }, business]), business);
});

test('returns undefined when no primary type is present', () => {
  assert.equal(findPrimaryItem([{ '@type': 'BreadcrumbList' }, { '@type': 'Organization' }]), undefined);
});

test('handles @type arrays when picking and describing the primary schema', () => {
  const article = { '@type': ['BlogPosting', 'LearningResource'], headline: 'H' };
  assert.equal(findPrimaryItem([{ '@type': 'WebSite' }, article]), article);
  expect(generateMetaTags(article, context).openGraph['og:type']).toBe('article');
});

test('findPageItems returns the schemas describing the page, including @type arrays', () => {
  const page = { '@type': ['WebPage', 'ItemPage'] };
  const faq = { '@type': 'FAQPage' };
  assert.deepEqual(findPageItems([faq, { '@type': 'Article' }, page]), [faq, page]);
  assert.deepEqual(findPageItems([{ '@type': 'Article' }]), []);
});

test('page settings count from every page schema, not just the first', () => {
  const article = { '@type': 'Article', headline: 'H' };
  const faq = { '@type': 'FAQPage', mainEntity: [] };
  const page = {
    '@type': 'WebPage', url: 'https://example.com/canonical/', robots: 'noindex',
    alternates: [{ href: 'https://example.com/de/', hreflang: 'de' }],
  };
  const seo = generateMetaTags(article, context, [faq, page]);
  expect(seo.robots).toBe('noindex');
  expect(seo.alternates).toEqual([{ href: 'https://example.com/de/', hreflang: 'de' }]);
  expect(seo.canonical).toBe('https://example.com/canonical/');
});

test('keeps every robots directive set on the page', () => {
  const seo = generateMetaTags({ '@type': 'Article', headline: 'H', robots: 'nofollow' }, context, [{ '@type': 'WebPage', robots: 'noindex' }]);
  expect(seo.robots).toBe('nofollow, noindex');
});

test('resolves root-relative image URLs against the origin of a site with a sub-path', () => {
  const site = { siteUrl: 'https://example.com/base/', canonicalUrl: 'https://example.com/base/p/' };
  expect(generateMetaTags({ '@type': 'Article', headline: 'H', image: '/image.jpg' }, site).openGraph['og:image'])
    .toBe('https://example.com/image.jpg');
  expect(generateMetaTags({ '@type': 'Article', headline: 'H', image: 'image.jpg' }, site).openGraph['og:image'])
    .toBe('https://example.com/base/image.jpg');
});

test('article:author lists author profile URLs, never names', () => {
  const withUrl = generateMetaTags({ '@type': 'Article', headline: 'H', author: { '@type': 'Person', name: 'Ada', url: '/authors/ada/' } }, context);
  expect(withUrl.openGraph['article:author']).toEqual(['https://example.com/authors/ada/']);
  expect(withUrl.author).toBe('Ada');
  const nameOnly = generateMetaTags({ '@type': 'Article', headline: 'H', author: { '@type': 'Person', name: 'Ada' } }, context);
  expect(nameOnly.openGraph).not.toHaveProperty('article:author');
});

test('video:duration and reading time understand days and weeks', () => {
  const video = { '@type': 'VideoObject', name: 'V', duration: 'P1DT1H' };
  expect(generateMetaTags(video, context).openGraph['video:duration']).toBe('90000');
  expect(generateMetaTags({ ...video, duration: 'PT1M30S' }, context).openGraph['video:duration']).toBe('90');
  expect(generateMetaTags({ ...video, duration: 'P1M' }, context).openGraph).not.toHaveProperty('video:duration');
  expect(generateMetaTags({ '@type': 'Article', headline: 'H', timeRequired: 'P1DT30M' }, context).readingTime).toBe('1470 min');
});
