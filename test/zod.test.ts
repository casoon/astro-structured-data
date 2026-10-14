import { test } from 'vitest';
import assert from 'node:assert/strict';
import { missingRecommended, productZodSchema, structuredDataOptionsSchema, validateRecommended } from '../src/zod.ts';

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

test('an alternative prop covers the recommended property it produces', () => {
  const offers = { price: '19.99', priceCurrency: 'EUR' };
  const fields = validateRecommended('Product', { name: 'P', offers }).map((w) => w.field);
  assert.ok(!fields.includes('price'));
  assert.ok(!fields.includes('priceCurrency'));
  assert.ok(validateRecommended('Product', { name: 'P' }).some((w) => w.field === 'price'));
});

test('integration defaults cover recommended props', () => {
  assert.ok(validateRecommended('Product', { name: 'P' }).some((w) => w.field === 'brand'));
  assert.ok(!validateRecommended('Product', { name: 'P' }, { defaultBrand: 'ACME' }).some((w) => w.field === 'brand'));
  const article = validateRecommended('Article', {}, { defaultArticlePublisher: { name: 'Pub', logo: { url: '/logo.png' } } });
  assert.ok(!article.some((w) => w.field === 'publisherName' || w.field === 'publisherLogo'));
});

test('missingRecommended checks every type of an @type array', () => {
  const fields = missingRecommended({ '@type': ['Product', 'Thing'], name: 'P', offers: {} });
  assert.ok(fields.includes('brand'));
  assert.ok(!fields.includes('offers'));
});

const product = { name: 'P', description: 'D', imageUrl: '/p.jpg' };
const productIssues = (props: Record<string, unknown>) => {
  const result = productZodSchema.safeParse({ ...product, ...props });
  return result.success ? [] : result.error.issues.map((i) => i.path.join('.'));
};

test('validates the structure of offers', () => {
  assert.deepEqual(productIssues({ offers: { price: '19.99', priceCurrency: 'EUR', availability: 'https://schema.org/InStock' } }), []);
  assert.ok(productIssues({ offers: { price: 'not-a-price', priceCurrency: 'invalid' } }).length > 0);
  assert.ok(productIssues({ offers: { price: 'not-a-price', priceCurrency: 'EUR' } }).length > 0);
  assert.ok(productIssues({ offers: { price: '1', priceCurrency: 'invalid' } }).length > 0);
  assert.ok(productIssues({ offers: { price: '1' } }).length > 0);
  assert.ok(productIssues({ offers: { price: '1', priceCurrency: 'EUR', availability: 'Sometimes' } }).length > 0);
  assert.deepEqual(productIssues({ offers: { '@type': 'AggregateOffer', lowPrice: 5, highPrice: 10, priceCurrency: 'EUR' } }), []);
  assert.ok(productIssues({ offers: { '@type': 'AggregateOffer', lowPrice: 10, highPrice: 5, priceCurrency: 'EUR' } }).length > 0);
});

test('validates brand, shipping details and return policy', () => {
  assert.ok(productIssues({ brand: { logo: '/l.png' } }).length > 0);
  assert.deepEqual(productIssues({ brand: { name: 'ACME', '@type': 'Brand' } }), []);
  assert.deepEqual(productIssues({
    shippingDetails: {
      shippingRate: { value: 4.95, currency: 'EUR' },
      shippingDestination: { addressCountry: 'DE' },
      deliveryTime: { handlingTime: { minValue: 0, maxValue: 1, unitCode: 'DAY' }, transitTime: { minValue: 1, maxValue: 3, unitCode: 'DAY' } },
    },
    returnPolicy: { applicableCountry: 'DE', returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow', merchantReturnDays: 30 },
  }), []);
  assert.ok(productIssues({ shippingDetails: { shippingRate: { value: 'free', currency: 'EUR' } } }).length > 0);
  assert.ok(productIssues({ shippingDetails: { shippingDestination: { addressCountry: 'Germany' } } }).length > 0);
  assert.ok(productIssues({ returnPolicy: { returnPolicyCategory: 'MerchantReturnFiniteReturnWindow' } }).includes('returnPolicy.merchantReturnDays'));
});

test('validates priceSpecification instead of skipping the price checks', () => {
  assert.ok(productIssues({ offers: { priceSpecification: {} } }).length > 0);
  assert.ok(productIssues({ offers: { priceSpecification: { price: 'free', priceCurrency: 'xxx' } } }).length > 0);
  assert.deepEqual(productIssues({ offers: { priceSpecification: [
    { price: 10, priceCurrency: 'EUR' },
    { price: 15, priceCurrency: 'EUR', priceType: 'https://schema.org/StrikethroughPrice' },
  ] } }), []);
});

test('a shipping rate may give maxValue instead of value', () => {
  assert.deepEqual(productIssues({ shippingDetails: { shippingRate: { maxValue: 5, currency: 'EUR' } } }), []);
  assert.ok(productIssues({ shippingDetails: { shippingRate: { currency: 'EUR' } } }).length > 0);
});

test('a brand logo may be a URL or an ImageObject', () => {
  assert.deepEqual(productIssues({ brand: { name: 'ACME', logo: { '@type': 'ImageObject', url: 'https://example.com/logo.png' } } }), []);
  assert.deepEqual(productIssues({ brand: { name: 'ACME', logo: '/logo.png' } }), []);
  assert.ok(productIssues({ brand: { name: 'ACME', logo: { width: 10 } } }).length > 0);
  assert.ok(structuredDataOptionsSchema.safeParse({ defaultBrand: { name: 'ACME', logo: { url: 'https://example.com/logo.png' } } }).success);
});
