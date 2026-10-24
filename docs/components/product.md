---
title: ProductSchema
description: Outputs a Product with offers, brand, ratings, reviews, shipping and return policy; use it on product detail pages.
order: 2
---

`ProductSchema` describes one product on its detail page. It outputs a
[`Product`](https://schema.org/Product) with an [`Offer`](https://schema.org/Offer) or
[`AggregateOffer`](https://schema.org/AggregateOffer), and targets Google's
[product snippets and merchant listings](https://developers.google.com/search/docs/appearance/structured-data/product)
(price, availability, rating, shipping and returns in search results).

There are three ways to describe the price, and a page uses at most one of them:

| Prop | Output | Use it for |
| --- | --- | --- |
| `id` | `string` | No | – | Output as the product's `@id`, so other nodes can reference it |
| `price` + `priceCurrency` (+ `availability`) | one `Offer` | a product with a single price |
| `offers` | `Offer` / `AggregateOffer` objects as given | several offers, sale prices, conditions, per-offer shipping |
| `priceRange` | one `AggregateOffer` | a price range across variants |

Brand, shipping details and return policy usually apply to the whole shop and are set once in
the integration options.

## Usage

```js
// astro.config.mjs
structuredData({
  siteUrl: 'https://example.com',
  defaultBrand: 'Gadget Co',
  defaultShippingDetails: {
    shippingRate: { value: 4.95, currency: 'EUR' },
    shippingDestination: { addressCountry: 'DE' },
    deliveryTime: {
      handlingTime: { minValue: 0, maxValue: 1, unitCode: 'DAY' },
      transitTime: { minValue: 1, maxValue: 3, unitCode: 'DAY' },
    },
  },
  defaultReturnPolicy: {
    applicableCountry: 'DE',
    returnPolicyCategory: 'MerchantReturnFiniteReturnWindow',
    merchantReturnDays: 30,
    returnMethod: 'ReturnByMail',
    returnFees: 'FreeReturn',
  },
})
```

```astro
---
// src/pages/products/[slug].astro
import { getCollection } from 'astro:content';
import { ProductSchema } from '@casoon/astro-structured-data/components';

export async function getStaticPaths() {
  const products = await getCollection('products');
  return products.map((product) => ({ params: { slug: product.id }, props: { product } }));
}

const { data } = Astro.props.product;
// data: { name: 'Super Gadget', price: 29.99, sku: 'SG-001', gtin: '4006381333931', … }
---
<ProductSchema
  name={data.name}
  description={data.description}
  imageUrl={data.images}
  price={data.price}
  priceCurrency="EUR"
  availability={data.inStock ? 'InStock' : 'OutOfStock'}
  sku={data.sku}
  gtin={data.gtin}
  ratingValue={data.rating}
  reviewCount={data.reviewCount}
/>
```

## Output

On `/products/super-gadget/`, with `images: ['/images/gadget.jpg', '/images/gadget-side.jpg']`,
`inStock: true`, `rating: 4.5` and `reviewCount: 128`:

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Super Gadget",
  "description": "The best gadget ever",
  "image": [
    "/images/gadget.jpg",
    "/images/gadget-side.jpg"
  ],
  "offers": {
    "@type": "Offer",
    "shippingDetails": {
      "@type": "OfferShippingDetails",
      "shippingRate": {
        "@type": "MonetaryAmount",
        "value": 4.95,
        "currency": "EUR"
      },
      "shippingDestination": {
        "@type": "DefinedRegion",
        "addressCountry": "DE"
      },
      "deliveryTime": {
        "@type": "ShippingDeliveryTime",
        "handlingTime": {
          "@type": "QuantitativeValue",
          "minValue": 0,
          "maxValue": 1,
          "unitCode": "DAY"
        },
        "transitTime": {
          "@type": "QuantitativeValue",
          "minValue": 1,
          "maxValue": 3,
          "unitCode": "DAY"
        }
      }
    },
    "hasMerchantReturnPolicy": {
      "@type": "MerchantReturnPolicy",
      "applicableCountry": "DE",
      "returnPolicyCategory": "MerchantReturnFiniteReturnWindow",
      "merchantReturnDays": 30,
      "returnMethod": "ReturnByMail",
      "returnFees": "FreeReturn"
    },
    "price": 29.99,
    "priceCurrency": "EUR",
    "availability": "https://schema.org/InStock",
    "url": "https://example.com/products/super-gadget/"
  },
  "brand": {
    "@type": "Brand",
    "name": "Gadget Co"
  },
  "sku": "SG-001",
  "gtin": "4006381333931",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": 4.5,
    "reviewCount": 128
  }
}
```

- The simple offer gets the page URL as `url` and the availability as a schema.org URL.
- Brand, shipping details and return policy come from the integration defaults. Nested
  schema.org types (`MonetaryAmount`, `DefinedRegion`, `ShippingDeliveryTime`,
  `QuantitativeValue`) are added where the input leaves them out.
- `imageUrl` is always output as an array. Root-relative URLs are written as given.

## Variants and related products

Give each product an `id` and link the variants through `isVariantOf` and `hasVariant`. The
same pattern covers `isRelatedTo`, `isSimilarTo`, `isAccessoryOrSparePartFor` and
`isConsumableFor`. A reference needs `id` or `url`; `type` is free text and defaults to
`ProductGroup` for `isVariantOf` and to `Product` for the others.

```astro
<ProductSchema
  id="/shirt/red/#product"
  name="Shirt, red"
  description="Cotton shirt in red."
  imageUrl="/shirt-red.jpg"
  isVariantOf={{ id: '/shirt/#group' }}
  isRelatedTo={{ id: '/hat/red/#product' }}
/>
```

```json
{
  "@type": "Product",
  "@id": "/shirt/red/#product",
  "isVariantOf": { "@type": "ProductGroup", "@id": "/shirt/#group" },
  "isRelatedTo": { "@type": "Product", "@id": "/hat/red/#product" }
}
```

The page of the group lists its variants with `hasVariant={[{ id: '/shirt/red/#product' }]}`.

## Several offers

`offers` takes one offer object or an array. Each object is validated for its known
properties and otherwise passed through, so further schema.org properties of `Offer` are
allowed. This example has a sale price with the regular price as strike-through price, and a
refurbished offer with its own shipping:

```astro
<ProductSchema
  name="Super Gadget"
  description="The best gadget ever"
  imageUrl="/images/gadget.jpg"
  brand={{ name: 'Gadget Co', logo: 'https://example.com/brands/gadget-co.png' }}
  offers={[
    {
      price: 24.99,
      priceCurrency: 'EUR',
      priceSpecification: { price: 29.99, priceCurrency: 'EUR', priceType: 'StrikethroughPrice' },
      availability: 'InStock',
      itemCondition: 'NewCondition',
      priceValidUntil: '2026-12-31',
    },
    {
      price: 17.5,
      priceCurrency: 'EUR',
      availability: 'LimitedAvailability',
      itemCondition: 'RefurbishedCondition',
      url: '/products/super-gadget/refurbished/',
      shippingDetails: {
        shippingRate: { value: 0, currency: 'EUR' },
        shippingDestination: { addressCountry: ['DE', 'AT'] },
      },
    },
  ]}
/>
```

With the same integration options as above:

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Super Gadget",
  "description": "The best gadget ever",
  "image": [
    "/images/gadget.jpg"
  ],
  "offers": [
    {
      "@type": "Offer",
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": 4.95,
          "currency": "EUR"
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "DE"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 0,
            "maxValue": 1,
            "unitCode": "DAY"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 3,
            "unitCode": "DAY"
          }
        }
      },
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "applicableCountry": "DE",
        "returnPolicyCategory": "MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 30,
        "returnMethod": "ReturnByMail",
        "returnFees": "FreeReturn"
      },
      "price": 24.99,
      "priceCurrency": "EUR",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": 29.99,
        "priceCurrency": "EUR",
        "priceType": "StrikethroughPrice"
      },
      "availability": "InStock",
      "itemCondition": "NewCondition",
      "priceValidUntil": "2026-12-31"
    },
    {
      "@type": "Offer",
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": 0,
          "currency": "EUR"
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": [
            "DE",
            "AT"
          ]
        }
      },
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "applicableCountry": "DE",
        "returnPolicyCategory": "MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 30,
        "returnMethod": "ReturnByMail",
        "returnFees": "FreeReturn"
      },
      "price": 17.5,
      "priceCurrency": "EUR",
      "availability": "LimitedAvailability",
      "itemCondition": "RefurbishedCondition",
      "url": "/products/super-gadget/refurbished/"
    }
  ],
  "brand": {
    "@type": "Brand",
    "name": "Gadget Co",
    "logo": "https://example.com/brands/gadget-co.png"
  }
}
```

- Offers from `offers` are output as given: enumeration values stay as written (`InStock`,
  not `https://schema.org/InStock`), and no `url` is added.
- The `brand` prop replaces `defaultBrand`.
- The second offer sets its own `shippingDetails`, which replaces the default shipping details
  for that offer completely. The return policy still comes from `defaultReturnPolicy`.
- A `priceSpecification` without `@type` is output as `UnitPriceSpecification`.

An `AggregateOffer` can be passed in `offers` too, by setting `'@type': 'AggregateOffer'`
with `lowPrice`, `priceCurrency` and optionally `highPrice` and `offerCount`.

## Price range

For a product whose variants have different prices, `priceRange` produces an
`AggregateOffer`:

```astro
<ProductSchema
  name="Basic Tee"
  description="Organic cotton T-shirt in six colours."
  imageUrl="/images/tee.jpg"
  brand="Example Apparel"
  priceRange={{ lowPrice: 19, highPrice: 29, priceCurrency: 'EUR', offerCount: 6 }}
/>
```

Without shop defaults configured:

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Basic Tee",
  "description": "Organic cotton T-shirt in six colours.",
  "image": [
    "/images/tee.jpg"
  ],
  "offers": {
    "@type": "AggregateOffer",
    "lowPrice": 19,
    "highPrice": 29,
    "priceCurrency": "EUR",
    "offerCount": 6,
    "url": "https://example.com/products/basic-tee/"
  },
  "brand": {
    "@type": "Brand",
    "name": "Example Apparel"
  }
}
```

The `AggregateOffer` gets the page URL as `url`, and the shipping details and return policy
(props or defaults) when they are set.

## Reviews

Individual reviews go into `reviews`. Each review has its own rating scale (`bestRating`,
default 5):

```astro
<ProductSchema
  name="Super Gadget"
  description="The best gadget ever"
  imageUrl="/images/gadget.jpg"
  price="29.99"
  priceCurrency="EUR"
  ratingValue={4.5}
  reviewCount={2}
  reviews={[
    { authorName: 'Alex', datePublished: '2026-08-01', reviewBody: 'Works as advertised.', ratingValue: 5 },
    { authorName: 'Sam', reviewBody: 'Good, but the cable is short.', ratingValue: 8, bestRating: 10 },
  ]}
/>
```

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Super Gadget",
  "description": "The best gadget ever",
  "image": [
    "/images/gadget.jpg"
  ],
  "offers": {
    "@type": "Offer",
    "price": "29.99",
    "priceCurrency": "EUR",
    "availability": "https://schema.org/InStock",
    "url": "https://example.com/products/super-gadget/"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": 4.5,
    "reviewCount": 2
  },
  "review": [
    {
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": "Alex"
      },
      "datePublished": "2026-08-01",
      "reviewBody": "Works as advertised.",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": 5,
        "bestRating": 5
      }
    },
    {
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": "Sam"
      },
      "reviewBody": "Good, but the cable is short.",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": 8,
        "bestRating": 10
      }
    }
  ]
}
```

`availability` defaults to `InStock` for a simple offer. A price passed as string stays a
string.

## Props

| Prop | Type | Required | Default / fallback | Description |
| --- | --- | --- | --- | --- |
| `name` | `string` | Yes | – | Product name |
| `description` | `string` | Yes | – | Product description |
| `imageUrl` | `string \| string[]` (URL or `/path`) | Yes | – | Product image(s), output as an array |
| `price` | `number \| string` | No (recommended) | – | Price of a simple offer; non-negative, a string must be numeric like `'19.99'` |
| `priceCurrency` | `string` (ISO 4217) | No (recommended) | – | Currency of the simple offer, e.g. `'EUR'` |
| `availability` | `'InStock' \| 'OutOfStock' \| 'PreOrder' \| 'OnlineOnly'` | No | `'InStock'` | Availability of the simple offer; needs `price` |
| `offers` | `Offer \| AggregateOffer \| (Offer \| AggregateOffer)[]` | No | – | Full offer objects, see below |
| `priceRange` | `{ lowPrice; highPrice; priceCurrency; offerCount? }` | No | – | Price range, output as `AggregateOffer` |
| `brand` | `string \| Brand` | No (recommended) | `defaultBrand` | Brand name, or `{ name, logo?, url? }` |
| `sku` | `string` | No (recommended) | – | Stock keeping unit |
| `gtin` | `string` | No | – | GTIN-8, -12, -13 or -14 (digits only) |
| `ratingValue` | `number` (0–5) | No (recommended) | – | Average rating, output as `AggregateRating` |
| `reviewCount` | `number` (positive integer) | No (recommended) | – | Number of ratings |
| `reviews` | `Review[]` | No | – | Individual reviews (at least one entry), see below |
| `shippingDetails` | `OfferShippingDetails` | No | `defaultShippingDetails` | Shipping details added to every offer |
| `returnPolicy` | `MerchantReturnPolicy` | No | `defaultReturnPolicy` | Return policy added to every offer, output as `hasMerchantReturnPolicy` |
| `isVariantOf` | `{ type?, id?, name?, headline?, url? }` | No | – | Reference by `id` or `url`; `type` is free text, default `'ProductGroup'` |
| `hasVariant` | `{ type?, id?, name?, headline?, url?, position? }[]` | No | – | Reference by `id` or `url`; `type` is free text, default `'Product'` |
| `isRelatedTo` | `{ type?, id?, name?, headline?, url? }` or an array | No | – | Reference by `id` or `url`; `type` is free text, default `'Product'` |
| `isSimilarTo` | `{ type?, id?, name?, headline?, url? }` or an array | No | – | Reference by `id` or `url`; `type` is free text, default `'Product'` |
| `isAccessoryOrSparePartFor` | `{ type?, id?, name?, headline?, url? }` or an array | No | – | Reference by `id` or `url`; `type` is free text, default `'Product'` |
| `isConsumableFor` | `{ type?, id?, name?, headline?, url? }` or an array | No | – | Reference by `id` or `url`; `type` is free text, default `'Product'` |
| `changefreq`, `priority` | sitemap hints | No | – | See [Meta tags and sitemap hints](../../guides/meta-tags/) |

"URL or `/path`" means an absolute `http(s)` URL or a root-relative path. The recommended
`offers` field counts as present when any of `price`, `offers` or `priceRange` is set.

### Offer

| Property | Type | Description |
| --- | --- | --- |
| `@type` | `'Offer'` | Optional, added when left out |
| `price` | `number \| string` | Required unless `priceSpecification` is set |
| `priceCurrency` | `string` (ISO 4217) | Required unless `priceSpecification` is set |
| `priceSpecification` | `PriceSpecification \| PriceSpecification[]` | `{ price, priceCurrency, priceType?, '@type'? }`; `@type` is `'PriceSpecification'` or `'UnitPriceSpecification'` (default); `priceType` one of `ListPrice`, `StrikethroughPrice`, `SalePrice`, `MinimumAdvertisedPrice`, `MSRP`, `InvoicePrice`, `SRP` |
| `availability` | schema.org `ItemAvailability` | `BackOrder`, `Discontinued`, `InStock`, `InStoreOnly`, `LimitedAvailability`, `MadeToOrder`, `OnlineOnly`, `OutOfStock`, `PreOrder`, `PreSale`, `Reserved`, `SoldOut` |
| `itemCondition` | schema.org `OfferItemCondition` | `NewCondition`, `UsedCondition`, `RefurbishedCondition`, `DamagedCondition` |
| `url` | `string` (URL or `/path`) | Offer URL |
| `priceValidUntil` | `string` | ISO 8601 date or date-time |
| `shippingDetails` | `OfferShippingDetails \| OfferShippingDetails[]` | Replaces the component's shipping details for this offer |
| `hasMerchantReturnPolicy` | `MerchantReturnPolicy \| MerchantReturnPolicy[]` | Replaces the component's return policy for this offer |

### AggregateOffer (in `offers`)

| Property | Type | Description |
| --- | --- | --- |
| `@type` | `'AggregateOffer'` | Required, distinguishes it from an `Offer` |
| `lowPrice` | `number \| string` | Required |
| `highPrice` | `number \| string` | Optional; not lower than `lowPrice` |
| `priceCurrency` | `string` (ISO 4217) | Required |
| `offerCount` | `number` (positive integer) | Optional |
| `availability`, `itemCondition`, `url`, `priceValidUntil`, `shippingDetails`, `hasMerchantReturnPolicy` | | As for `Offer` |

### priceRange

| Property | Type | Description |
| --- | --- | --- |
| `lowPrice` | `number \| string` | Required |
| `highPrice` | `number \| string` | Required; not lower than `lowPrice` |
| `priceCurrency` | `string` (ISO 4217) | Required |
| `offerCount` | `number` (positive integer) | Optional |

No other properties are allowed in `priceRange`.

### Brand

A string is output as `{ "@type": "Brand", "name": … }`. As an object:

| Property | Type | Description |
| --- | --- | --- |
| `name` | `string` | Required |
| `logo` | `string` (URL or `/path`) or `{ url, '@type'?: 'ImageObject' }` | Optional |
| `url` | `string` (absolute URL) | Optional |

### Review

| Property | Type | Description |
| --- | --- | --- |
| `authorName` | `string` | Required |
| `authorType` | `'Person' \| 'Organization'` | Default `'Person'` |
| `datePublished` | `string \| Date` | Optional |
| `reviewBody` | `string` | Required |
| `ratingValue` | `number` | Required; between 0 and `bestRating` |
| `bestRating` | `number` (positive) | Default 5 |

No other properties are allowed in a review.

### OfferShippingDetails

Used by `shippingDetails`, `defaultShippingDetails` and the `shippingDetails` of an offer.

| Property | Type | Description |
| --- | --- | --- |
| `shippingRate` | `MonetaryAmount` | `{ value?, minValue?, maxValue?, currency }`; needs `value` or `maxValue` |
| `shippingDestination` | `DefinedRegion \| DefinedRegion[]` | `{ addressCountry, addressRegion? }`; `addressCountry` is one or more ISO 3166-1 alpha-2 codes (`'DE'`) |
| `deliveryTime` | `ShippingDeliveryTime` | `{ handlingTime?, transitTime? }`, each `{ minValue?, maxValue?, unitCode? }` with whole numbers, `minValue` not above `maxValue` |
| `doesNotShip` | `boolean` | Optional |

### MerchantReturnPolicy

Used by `returnPolicy`, `defaultReturnPolicy` and the `hasMerchantReturnPolicy` of an offer.

| Property | Type | Description |
| --- | --- | --- |
| `applicableCountry` | `string \| string[]` | ISO 3166-1 alpha-2 codes |
| `returnPolicyCategory` | enum | `MerchantReturnFiniteReturnWindow`, `MerchantReturnNotPermitted`, `MerchantReturnUnlimitedWindow`, `MerchantReturnUnspecified` |
| `merchantReturnDays` | `number` (whole, ≥ 0) | Required for `MerchantReturnFiniteReturnWindow` |
| `returnMethod` | enum or enum[] | `ReturnByMail`, `ReturnInStore`, `ReturnAtKiosk` |
| `returnFees` | enum | `FreeReturn`, `OriginalShippingFees`, `RestockingFees`, `ReturnFeesCustomerResponsibility`, `ReturnShippingFees` |
| `returnShippingFeesAmount` | `MonetaryAmount` | As `shippingRate` |
| `merchantReturnLink` | `string` (absolute URL) | Return policy page |

Enumeration values can be written as `InStock` or as `https://schema.org/InStock`. The
`@type` of every nested object is optional and added when left out. Further schema.org
properties are allowed on `Offer`, `AggregateOffer`, `Brand`, `OfferShippingDetails`,
`MerchantReturnPolicy` and their nested objects and are passed through unchecked.

## Rules

Violations fail the build (see [Validation](../../guides/validation/)):

- At most one of `price`, `offers` and `priceRange`.
- `price` and `priceCurrency` are set together or not at all. `availability` needs `price`.
- `ratingValue` and `reviewCount` are set together or not at all.
- An `Offer` needs `price` and `priceCurrency`, or a `priceSpecification` (which itself needs
  both).
- `lowPrice` must not exceed `highPrice` (in `priceRange` and in an `AggregateOffer`).
- A review's `ratingValue` must not exceed its `bestRating` (5 when not set).
- A shipping rate needs `value` or `maxValue`. Delivery day ranges need `minValue` ≤
  `maxValue`.
- A return policy with `MerchantReturnFiniteReturnWindow` needs `merchantReturnDays`.
- Currencies are ISO 4217 (`EUR`), countries ISO 3166-1 alpha-2 (`DE`), prices non-negative
  numbers or numeric strings.

## Defaults and precedence

`brand`, `shippingDetails` and `returnPolicy` fall back to the integration options
`defaultBrand`, `defaultShippingDetails` and `defaultReturnPolicy`. The options are validated
like the props when the integration is created
(see [Integration options](../../reference/options/)).

For shipping details and return policy, three levels apply, the most specific one wins:

1. `shippingDetails` / `hasMerchantReturnPolicy` on an individual offer in `offers`
2. the `shippingDetails` / `returnPolicy` props of the component
3. `defaultShippingDetails` / `defaultReturnPolicy`

Each level replaces the value of the level below as a whole; the objects are not merged.
Shipping details and the return policy only appear inside offers. A product without `price`,
`offers` or `priceRange` outputs neither.
