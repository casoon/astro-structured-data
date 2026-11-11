import { describe, expect, test } from 'vitest';
import { buildProduct, type ProductContext } from '../src/builders/product.ts';
import { productZodSchema, structuredDataOptionsSchema } from '../src/zod.ts';

const url = 'https://example.com/shop/gadget/';
const product = { name: 'Gadget', description: 'A gadget', imageUrl: '/gadget.jpg' };
const freeShipping = { shippingRate: { value: 0, currency: 'EUR' }, shippingDestination: { addressCountry: 'DE' } };
const returns = { returnPolicyCategory: 'MerchantReturnFiniteReturnWindow', merchantReturnDays: 30 };

/** Builds like the component does: validated props, parsed integration options. */
const product$ = (props: Record<string, unknown>, options: Record<string, unknown> = {}): any => {
  const config: ProductContext['config'] = structuredDataOptionsSchema.parse(options);
  return buildProduct(productZodSchema.parse({ ...product, ...props }), { url, config });
};

describe('buildProduct offers', () => {
  test('no price data means no offers', () => {
    expect(product$({})).not.toHaveProperty('offers');
  });

  test('the price shorthand becomes one Offer with page URL and InStock by default', () => {
    expect(product$({ price: 10, priceCurrency: 'EUR' }).offers).toEqual({
      '@type': 'Offer',
      price: 10,
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url,
    });
    expect(product$({ price: 0, priceCurrency: 'EUR', availability: 'OutOfStock' }).offers)
      .toMatchObject({ price: 0, availability: 'https://schema.org/OutOfStock' });
  });

  test('a single offer object stays an object', () => {
    expect(product$({ offers: { price: 10, priceCurrency: 'EUR', url: '/buy/' } }).offers).toEqual({
      '@type': 'Offer', price: 10, priceCurrency: 'EUR', url: '/buy/',
    });
  });

  test('an offer array stays an array of Offers', () => {
    const { offers } = product$({ offers: [{ price: 10, priceCurrency: 'EUR' }, { price: 20, priceCurrency: 'EUR', itemCondition: 'UsedCondition' }] });
    expect(offers).toEqual([
      { '@type': 'Offer', price: 10, priceCurrency: 'EUR' },
      { '@type': 'Offer', price: 20, priceCurrency: 'EUR', itemCondition: 'UsedCondition' },
    ]);
  });

  test('an AggregateOffer passed as offer keeps its type', () => {
    const { offers } = product$({ offers: { '@type': 'AggregateOffer', lowPrice: 5, highPrice: 10, priceCurrency: 'EUR', offerCount: 3 } });
    expect(offers).toEqual({ '@type': 'AggregateOffer', lowPrice: 5, highPrice: 10, priceCurrency: 'EUR', offerCount: 3 });
  });

  test('priceRange becomes an AggregateOffer with the page URL', () => {
    expect(product$({ priceRange: { lowPrice: 5, highPrice: 10, priceCurrency: 'EUR', offerCount: 4 } }).offers).toEqual({
      '@type': 'AggregateOffer', lowPrice: 5, highPrice: 10, priceCurrency: 'EUR', offerCount: 4, url,
    });
    expect(product$({ priceRange: { lowPrice: 5, highPrice: 10, priceCurrency: 'EUR' } }).offers).not.toHaveProperty('offerCount');
  });

  test('priceSpecification is passed through with its schema.org types', () => {
    const { offers } = product$({
      offers: { priceSpecification: [{ price: 10, priceCurrency: 'EUR', priceType: 'ListPrice' }, { '@type': 'PriceSpecification', price: 8, priceCurrency: 'EUR' }] },
    });
    expect(offers).toEqual({
      '@type': 'Offer',
      priceSpecification: [
        { '@type': 'UnitPriceSpecification', price: 10, priceCurrency: 'EUR', priceType: 'ListPrice' },
        { '@type': 'PriceSpecification', price: 8, priceCurrency: 'EUR' },
      ],
    });
  });

  test('shipping details and return policy decorate every offer variant', () => {
    const props = { shippingDetails: freeShipping, returnPolicy: returns };
    const single = product$({ ...props, price: 10, priceCurrency: 'EUR' }).offers;
    const range = product$({ ...props, priceRange: { lowPrice: 5, highPrice: 10, priceCurrency: 'EUR' } }).offers;
    const list = product$({ ...props, offers: [{ price: 10, priceCurrency: 'EUR' }] }).offers;
    for (const offer of [single, range, list[0]]) {
      expect(offer.shippingDetails['@type']).toBe('OfferShippingDetails');
      expect(offer.hasMerchantReturnPolicy).toMatchObject({ '@type': 'MerchantReturnPolicy', merchantReturnDays: 30 });
    }
  });

  test('an offer keeps its own shipping details over the configured default', () => {
    const { offers } = product$(
      { offers: [{ price: 10, priceCurrency: 'EUR', shippingDetails: freeShipping }, { price: 20, priceCurrency: 'EUR' }] },
      { defaultShippingDetails: { shippingRate: { value: 5, currency: 'EUR' } } }
    );
    const [own, defaulted] = offers;
    expect(own.shippingDetails.shippingRate.value).toBe(0);
    expect(defaulted.shippingDetails.shippingRate).toEqual({ '@type': 'MonetaryAmount', value: 5, currency: 'EUR' });
  });

  test('outputs the nested schema.org types of shipping details and return policies', () => {
    const offer = product$({
      price: 10,
      priceCurrency: 'EUR',
      shippingDetails: { ...freeShipping, deliveryTime: { handlingTime: { minValue: 0, maxValue: 1, unitCode: 'DAY' } } },
      returnPolicy: { returnPolicyCategory: 'MerchantReturnNotPermitted', returnShippingFeesAmount: { value: 0, currency: 'EUR' } },
    }).offers;
    expect(offer.shippingDetails['@type']).toBe('OfferShippingDetails');
    expect(offer.shippingDetails.shippingRate['@type']).toBe('MonetaryAmount');
    expect(offer.shippingDetails.shippingDestination['@type']).toBe('DefinedRegion');
    expect(offer.shippingDetails.deliveryTime['@type']).toBe('ShippingDeliveryTime');
    expect(offer.shippingDetails.deliveryTime.handlingTime['@type']).toBe('QuantitativeValue');
    expect(offer.hasMerchantReturnPolicy.returnShippingFeesAmount['@type']).toBe('MonetaryAmount');
  });
});

describe('buildProduct defaults', () => {
  const options = { defaultBrand: 'ACME', defaultShippingDetails: freeShipping, defaultReturnPolicy: returns };

  test('config defaults fill brand, shipping and return policy', () => {
    const data = product$({ price: 10, priceCurrency: 'EUR' }, options);
    expect(data.brand).toEqual({ '@type': 'Brand', name: 'ACME' });
    expect(data.offers.shippingDetails.shippingRate.value).toBe(0);
    expect(data.offers.hasMerchantReturnPolicy.merchantReturnDays).toBe(30);
  });

  test('props win over config defaults', () => {
    const data = product$({
      price: 10, priceCurrency: 'EUR', brand: 'Own',
      shippingDetails: { shippingRate: { value: 9, currency: 'EUR' } },
      returnPolicy: { returnPolicyCategory: 'MerchantReturnNotPermitted' },
    }, options);
    expect(data.brand).toEqual({ '@type': 'Brand', name: 'Own' });
    expect(data.offers.shippingDetails.shippingRate.value).toBe(9);
    expect(data.offers.hasMerchantReturnPolicy.returnPolicyCategory).toBe('MerchantReturnNotPermitted');
  });

  test('no defaults: no brand, no shipping or return info', () => {
    const data = product$({ price: 10, priceCurrency: 'EUR' });
    expect(data).not.toHaveProperty('brand');
    expect(data.offers).not.toHaveProperty('shippingDetails');
    expect(data.offers).not.toHaveProperty('hasMerchantReturnPolicy');
  });

  test('image is always an array; reviews default to Person authors and bestRating 5', () => {
    expect(product$({}).image).toEqual(['/gadget.jpg']);
    expect(product$({ imageUrl: ['/a.jpg', '/b.jpg'] }).image).toEqual(['/a.jpg', '/b.jpg']);
    expect(product$({ reviews: [{ authorName: 'Ada', reviewBody: 'Good', ratingValue: 4 }] }).review).toEqual([{
      '@type': 'Review',
      author: { '@type': 'Person', name: 'Ada' },
      reviewBody: 'Good',
      reviewRating: { '@type': 'Rating', ratingValue: 4, bestRating: 5 },
    }]);
  });

  test('aggregateRating keeps a rating of 0', () => {
    expect(product$({ ratingValue: 0, reviewCount: 3 }).aggregateRating).toEqual({ '@type': 'AggregateRating', ratingValue: 0, reviewCount: 3 });
  });
});

describe('buildProduct references', () => {
  test('@id only when given', () => {
    expect(product$({ id: '/gadget/#product' })['@id']).toBe('/gadget/#product');
    expect(product$({})).not.toHaveProperty('@id');
  });

  test('brand object keeps its id-free fields and gets the Brand type', () => {
    expect(product$({ brand: { name: 'B', url: 'https://b.example' } }).brand).toEqual({ '@type': 'Brand', name: 'B', url: 'https://b.example' });
  });

  test('product relations get their default types', () => {
    const data = product$({
      isVariantOf: { id: '/shirt/#group' },
      hasVariant: [{ id: '/shirt/blue/#product' }],
      isRelatedTo: { url: '/hat/', type: 'Product' },
      isSimilarTo: [{ id: '#a' }, { url: '/b/' }],
      isAccessoryOrSparePartFor: { id: '/pants/#group', type: 'ProductGroup' },
      isConsumableFor: { id: '/printer/' },
    });
    expect(data.isVariantOf).toEqual({ '@type': 'ProductGroup', '@id': '/shirt/#group' });
    expect(data.hasVariant).toEqual([{ '@type': 'Product', '@id': '/shirt/blue/#product' }]);
    expect(data.isRelatedTo).toEqual({ '@type': 'Product', url: '/hat/' });
    expect(data.isSimilarTo).toEqual([{ '@type': 'Product', '@id': '#a' }, { '@type': 'Product', url: '/b/' }]);
    expect(data.isAccessoryOrSparePartFor).toEqual({ '@type': 'ProductGroup', '@id': '/pants/#group' });
    expect(data.isConsumableFor).toEqual({ '@type': 'Product', '@id': '/printer/' });
  });
});
