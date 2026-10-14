---
title: CollectionPageSchema
description: Outputs a CollectionPage with an ItemList of products; use it on category, listing and archive pages of a shop.
order: 3
---

`CollectionPageSchema` describes a page that lists products, such as a shop category. It
outputs a [`CollectionPage`](https://schema.org/CollectionPage) whose `mainEntity` is an
[`ItemList`](https://schema.org/ItemList) of `Product` entries, each with its URL and, if
known, image and price. Google has no dedicated rich result for collection pages; the list
tells search engines which product pages belong to the category. The products' own detail
pages use [`ProductSchema`](../product/).

## Usage

A category page built from a content collection of products:

```astro
---
// src/pages/shop/[category].astro
import { getCollection } from 'astro:content';
import { CollectionPageSchema } from '@casoon/astro-structured-data/components';

export async function getStaticPaths() {
  const categories = await getCollection('categories');
  return categories.map((category) => ({ params: { category: category.id }, props: { category } }));
}

const { category } = Astro.props;
const products = await getCollection('products', (p) => p.data.category === category.id);
---
<CollectionPageSchema
  name={category.data.title}
  description={category.data.description}
  products={products.map((p) => ({
    name: p.data.name,
    url: `/products/${p.id}/`,
    imageUrl: p.data.image,
    price: p.data.price,
    priceCurrency: p.data.price === undefined ? undefined : 'EUR',
  }))}
/>
```

`price` and `priceCurrency` must be set together, so the currency is only passed for products
with a price. A prop with the value `undefined` counts as not set.

## Output

On `/shop/lamps/`, for three products of which the last has no image and no price:

```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Lamps",
  "description": "Desk, floor and pendant lamps.",
  "url": "https://example.com/shop/lamps/",
  "mainEntity": {
    "@type": "ItemList",
    "numberOfItems": 3,
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "item": {
          "@type": "Product",
          "name": "Arc Floor Lamp",
          "url": "/products/arc-floor-lamp/",
          "image": "/images/arc.jpg",
          "offers": {
            "@type": "Offer",
            "price": 189,
            "priceCurrency": "EUR"
          }
        }
      },
      {
        "@type": "ListItem",
        "position": 2,
        "item": {
          "@type": "Product",
          "name": "Pixel Desk Lamp",
          "url": "/products/pixel-desk-lamp/",
          "image": "/images/pixel.jpg",
          "offers": {
            "@type": "Offer",
            "price": "49.90",
            "priceCurrency": "EUR"
          }
        }
      },
      {
        "@type": "ListItem",
        "position": 3,
        "item": {
          "@type": "Product",
          "name": "Globe Pendant",
          "url": "/products/globe-pendant/"
        }
      }
    ]
  }
}
```

- `url` is the current page, built from `siteUrl` and the page path.
- `numberOfItems` and the `position` of each entry follow the order of `products`.
- Product URLs and images are written as given; root-relative paths are not resolved against
  `siteUrl`.
- A product with `price` gets an `Offer` with `price` and `priceCurrency`; no availability is
  added.

## Props

| Prop | Type | Required | Default / fallback | Description |
| --- | --- | --- | --- | --- |
| `name` | `string` | Yes | – | Name of the collection, e.g. the category |
| `description` | `string` | Yes | – | Description of the collection |
| `products` | `Product[]` | Yes | – | Listed products, at least one |
| `changefreq`, `priority` | sitemap hints | No | – | See [Meta tags and sitemap hints](../../guides/meta-tags/) |

Each entry in `products`:

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | `string` | Yes | Product name |
| `url` | `string` (URL or `/path`) | Yes | Product detail page |
| `imageUrl` | `string` (URL or `/path`) | No | Product image, output as `image` |
| `price` | `number \| string` | No | Price; non-negative, a string must be numeric like `'49.90'` |
| `priceCurrency` | `string` (ISO 4217) | No | Currency, e.g. `'EUR'` |

"URL or `/path`" means an absolute `http(s)` URL or a root-relative path. No other properties
are allowed in a product entry.

## Rules

Violations fail the build (see [Validation](../../guides/validation/)):

- `products` needs at least one entry.
- In each entry, `price` and `priceCurrency` are set together or not at all.
- `name` and `description` must not be empty.

The component uses no integration defaults apart from `siteUrl` and has no recommended
fields.
