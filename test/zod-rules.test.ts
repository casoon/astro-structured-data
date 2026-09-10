import { expect, test } from 'vitest';
import {
  RECOMMENDED_FIELDS,
  articleZodSchema,
  eventZodSchema,
  jobPostingZodSchema,
  missingRecommended,
  productZodSchema,
  structuredDataOptionsSchema,
} from '../src/zod.ts';

const article = { title: 'T', description: 'D', datePublished: '2026-01-01', authorName: 'A' };

test('recommended fields are declared once and mapped to schema.org paths', () => {
  expect(RECOMMENDED_FIELDS.Article).toEqual(['dateModified', 'image', 'publisher', 'publisher.logo']);
  expect(RECOMMENDED_FIELDS.ProfilePage).toEqual(['mainEntity.description', 'mainEntity.image', 'mainEntity.sameAs']);
  expect(RECOMMENDED_FIELDS.Product).toEqual(['offers', 'brand', 'sku', 'aggregateRating']);
  expect(RECOMMENDED_FIELDS).not.toHaveProperty('FAQPage');
});

test('missingRecommended resolves nested paths', () => {
  expect(missingRecommended({ '@type': 'ProfilePage', mainEntity: { description: 'x', image: '/a.jpg' } })).toEqual(['mainEntity.sameAs']);
  expect(missingRecommended({ '@type': 'Thing' })).toEqual([]);
});

test('dates must be ISO 8601 (date, date-time with or without offset, or Date)', () => {
  for (const datePublished of ['2026-01-02', '2026-01-02T10:00:00Z', '2026-01-02T10:00:00+02:00', '2026-01-02T10:00', new Date()]) {
    expect(articleZodSchema.safeParse({ ...article, datePublished }).success).toBe(true);
  }
  for (const datePublished of ['02.01.2026', 'yesterday', '2026-13-01', new Date('invalid')]) {
    expect(articleZodSchema.safeParse({ ...article, datePublished }).success).toBe(false);
  }
});

test('URLs must be absolute http(s) or root-relative', () => {
  expect(articleZodSchema.safeParse({ ...article, imageUrl: '/img.jpg' }).success).toBe(true);
  expect(articleZodSchema.safeParse({ ...article, imageUrl: 'https://cdn.example.org/img.jpg' }).success).toBe(true);
  for (const imageUrl of ['img.jpg', '//cdn.example.org/img.jpg', 'javascript:alert(1)', 'ftp://example.org/img.jpg', '']) {
    expect(articleZodSchema.safeParse({ ...article, imageUrl }).success).toBe(false);
  }
});

test('product prices are numeric and offers are exclusive', () => {
  const product = { name: 'P', description: 'D', imageUrl: '/p.jpg' };
  expect(productZodSchema.safeParse({ ...product, price: '19.99', priceCurrency: 'EUR' }).success).toBe(true);
  expect(productZodSchema.safeParse({ ...product, price: '19,99', priceCurrency: 'EUR' }).success).toBe(false);
  expect(productZodSchema.safeParse({ ...product, price: -1, priceCurrency: 'EUR' }).success).toBe(false);
  expect(productZodSchema.safeParse({ ...product, priceRange: { lowPrice: 20, highPrice: 10, priceCurrency: 'EUR' } }).success).toBe(false);
  expect(productZodSchema.safeParse({ ...product, gtin: '123' }).success).toBe(false);
  expect(productZodSchema.safeParse({
    ...product,
    reviews: [{ authorName: 'A', reviewBody: 'Good', ratingValue: 6 }],
  }).success).toBe(false);
});

test('job location rules follow Google: on-site needs jobLocation, remote needs applicant location', () => {
  const job = { title: 'Dev', description: 'D', datePosted: '2026-01-01' };
  expect(jobPostingZodSchema.safeParse(job).success).toBe(false);
  expect(jobPostingZodSchema.safeParse({ ...job, jobLocationType: 'TELECOMMUTE', applicantLocationRequirements: 'DE' }).success).toBe(true);
  expect(jobPostingZodSchema.safeParse({ ...job, jobLocationType: 'TELECOMMUTE' }).success).toBe(false);
  expect(jobPostingZodSchema.safeParse({
    ...job,
    jobLocation: { streetAddress: 'S', addressLocality: 'L', postalCode: '1', addressCountry: 'DE' },
    applicantLocationRequirements: 'DE',
  }).success).toBe(false);
});

test('event location follows the attendance mode', () => {
  const base = { name: 'E', startDate: '2026-05-01' };
  const venue = { locationName: 'Hall', locationAddress: { streetAddress: 'S', addressLocality: 'L', postalCode: '1', addressCountry: 'DE' } };
  const onlineUrl = 'https://stream.example.org/live';
  const ok = (data: object) => eventZodSchema.safeParse({ ...base, ...data }).success;

  expect(ok(venue)).toBe(true);
  expect(ok({ ...venue, attendanceMode: 'Offline' })).toBe(true);
  expect(ok({ attendanceMode: 'Online', onlineUrl })).toBe(true);
  expect(ok({ ...venue, attendanceMode: 'Mixed', onlineUrl })).toBe(true);

  expect(ok({})).toBe(false);
  expect(ok({ ...venue, onlineUrl })).toBe(false);
  expect(ok({ attendanceMode: 'Online' })).toBe(false);
  expect(ok({ ...venue, attendanceMode: 'Online', onlineUrl })).toBe(false);
  expect(ok({ attendanceMode: 'Mixed', onlineUrl })).toBe(false);
  expect(ok({ locationName: 'Hall', attendanceMode: 'Mixed', onlineUrl })).toBe(false);
});

test('exported schemas stay open for content collections (extra top-level keys are ignored)', () => {
  expect(articleZodSchema.safeParse({ ...article, draft: true, tags: ['x'] }).success).toBe(true);
});

test('integration options are strict', () => {
  expect(structuredDataOptionsSchema.safeParse({ siteUrl: 'https://example.com', locale: 'de_DE' }).success).toBe(true);
  expect(structuredDataOptionsSchema.safeParse({ locale: 'german' }).success).toBe(false);
  expect(structuredDataOptionsSchema.safeParse({ defaultArticlePublisher: { name: 'P', logo: { url: '/l.png' }, extra: 1 } }).success).toBe(false);
});
