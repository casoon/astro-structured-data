import { expect, test } from 'vitest';
import { collectWarnings } from '../src/toolbar/checks.ts';

const product = (offers: unknown) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Widget',
  image: 'https://example.com/w.jpg',
  offers,
});
const merchant = { shippingDetails: {}, hasMerchantReturnPolicy: {} };
const priceWarnings = (offers: unknown) =>
  collectWarnings(product(offers), false).filter((w) => /'(price|priceCurrency|lowPrice|highPrice)'/.test(w));

test('accepts prices given in priceSpecification', () => {
  expect(priceWarnings({ ...merchant, priceSpecification: { price: 10, priceCurrency: 'EUR' } })).toEqual([]);
  expect(priceWarnings({ ...merchant, priceSpecification: [{ price: 10, priceCurrency: 'EUR' }] })).toEqual([]);
});

test('checks AggregateOffers inside an offers array as AggregateOffers', () => {
  expect(priceWarnings([{ '@type': 'AggregateOffer', lowPrice: 10, highPrice: 20, priceCurrency: 'EUR' }])).toEqual([]);
});

test('checks each array element by its own type', () => {
  expect(priceWarnings([
    { '@type': 'Offer', price: 10, priceCurrency: 'EUR' },
    { '@type': 'AggregateOffer', priceCurrency: 'EUR' },
  ])).toEqual(["AggregateOffer #2 is missing 'lowPrice'", "AggregateOffer #2 is missing 'highPrice' (recommended)"]);
});

test('still flags incomplete offers', () => {
  expect(priceWarnings({ ...merchant })).toEqual(["Offer is missing 'price'", "Offer is missing 'priceCurrency'"]);
  expect(priceWarnings({ ...merchant, priceSpecification: { price: 10 } })).toEqual(["Offer is missing 'priceCurrency'"]);
  expect(priceWarnings({ '@type': 'AggregateOffer', highPrice: 20 })).toEqual([
    "AggregateOffer is missing 'lowPrice'",
    "AggregateOffer is missing 'priceCurrency'",
  ]);
  expect(collectWarnings(product([null]), false)).toEqual(['Offer #1 must be an object']);
});
