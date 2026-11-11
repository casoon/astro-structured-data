import { describe, expect, test } from 'vitest';
import { buildArticle, type ArticleContext } from '../src/builders/article.ts';
import { buildProduct, type ProductContext } from '../src/builders/product.ts';
import { articleZodSchema, productZodSchema, structuredDataOptionsSchema } from '../src/zod.ts';

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

const article = { title: 'Title', description: 'Description', datePublished: '2026-01-01', authorName: 'Ada' };

const article$ = (props: Record<string, unknown>, options: Record<string, unknown> = {}): any => {
  const config: ArticleContext['config'] = structuredDataOptionsSchema.parse(options);
  return buildArticle(articleZodSchema.parse({ ...article, ...props }), { url, page: '/shop/gadget/', config });
};

describe('buildArticle defaults', () => {
  test('minimal props', () => {
    expect(article$({})).toEqual({
      '@type': 'BlogPosting',
      headline: 'Title',
      description: 'Description',
      datePublished: '2026-01-01',
      dateModified: '2026-01-01',
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      author: { '@type': 'Person', name: 'Ada' },
      isAccessibleForFree: true,
    });
  });

  test('explicit values replace the defaults', () => {
    const data = article$({ schemaType: 'NewsArticle', authorType: 'Organization', dateModified: '2026-02-01', isAccessibleForFree: false });
    expect(data).toMatchObject({
      '@type': 'NewsArticle',
      author: { '@type': 'Organization', name: 'Ada' },
      dateModified: '2026-02-01',
      isAccessibleForFree: false,
    });
  });

  test('optional fields: image, keywords, reading time', () => {
    const data = article$({
      imageUrl: '/i.jpg', imageWidth: 800, imageHeight: 600, imageFormat: 'image/jpeg', imageCaption: 'Cap',
      inLanguage: 'de', articleSection: 'Tech', keywords: ['a', 'b'], wordCount: 300, readingTimeMinutes: 5,
    });
    expect(data.image).toEqual({ '@type': 'ImageObject', url: '/i.jpg', width: 800, height: 600, encodingFormat: 'image/jpeg', caption: 'Cap' });
    expect(data).toMatchObject({ inLanguage: 'de', articleSection: 'Tech', keywords: 'a, b', wordCount: 300, timeRequired: 'PT5M' });
    expect(article$({ keywords: 'x, y' }).keywords).toBe('x, y');
  });

  test('defaultArticlePublisher fills the publisher, including its @id', () => {
    const options = { defaultArticlePublisher: { name: 'Pub', logo: { url: '/logo.png' }, id: 'https://example.com/#org' } };
    expect(article$({}, options).publisher).toEqual({
      '@type': 'Organization', name: 'Pub', '@id': 'https://example.com/#org', logo: { '@type': 'ImageObject', url: '/logo.png' },
    });
  });

  test('no publisher without a name', () => {
    expect(article$({})).not.toHaveProperty('publisher');
  });
});

describe('buildArticle references', () => {
  test('@id and mainEntityOfPage', () => {
    const data = article$({ id: '#post' });
    expect(data['@id']).toBe('#post');
    expect(data.mainEntityOfPage).toEqual({ '@type': 'WebPage', '@id': url });
    expect(article$({})).not.toHaveProperty('@id');
  });

  test('author @id and url; several authors become an array', () => {
    expect(article$({ authorId: '#ada', authorUrl: 'https://ada.example' }).author)
      .toEqual({ '@type': 'Person', name: 'Ada', '@id': '#ada', url: 'https://ada.example' });
    expect(article$({ authorName: ['Ada', 'Bob'] }).author)
      .toEqual([{ '@type': 'Person', name: 'Ada' }, { '@type': 'Person', name: 'Bob' }]);
  });

  test('publisher @id: explicit, and the default id only for the default publisher', () => {
    const options = { defaultArticlePublisher: { name: 'Pub', id: '#default' } };
    expect(article$({ publisherName: 'Other' }, options).publisher).toEqual({ '@type': 'Organization', name: 'Other' });
    expect(article$({ publisherName: 'Other', publisherId: '#other' }, options).publisher['@id']).toBe('#other');
    expect(article$({ publisherId: '#own' }, options).publisher).toEqual({ '@type': 'Organization', name: 'Pub', '@id': '#own' });
  });

  test('publisher logo or id without any publisher name throws', () => {
    expect(() => article$({ publisherLogo: '/logo.png' })).toThrow(/<ArticleSchema> on \/shop\/gadget\/: "publisherLogo"/);
    expect(() => article$({ publisherId: '#p' })).toThrow(/"publisherId" needs a publisher name/);
  });

  test('isPartOf / hasPart default to the article type', () => {
    expect(article$({ isPartOfHeadline: 'Series', isPartOfUrl: '/series/', seriesPosition: 2 })).toMatchObject({
      isPartOf: { '@type': 'BlogPosting', headline: 'Series', url: '/series/' },
      position: 2,
    });
    expect(article$({ schemaType: 'Article', isPartOf: [{ id: '#s1' }, { type: 'CreativeWorkSeries', url: '/s2/' }] }).isPartOf).toEqual([
      { '@type': 'Article', '@id': '#s1' },
      { '@type': 'CreativeWorkSeries', url: '/s2/' },
    ]);
    expect(article$({ hasPart: [{ id: '#p1', position: 1 }] }).hasPart).toEqual([{ '@type': 'BlogPosting', '@id': '#p1', position: 1 }]);
    expect(article$({})).not.toHaveProperty('position');
  });
});
