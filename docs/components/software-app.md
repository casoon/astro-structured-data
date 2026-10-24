---
title: SoftwareAppSchema
description: Outputs a SoftwareApplication with price and rating, for the landing page of an app or tool.
order: 14
---

`SoftwareAppSchema` produces a
[`SoftwareApplication`](https://schema.org/SoftwareApplication): an app or program with its
platform, category, price and rating. Use it on the page that presents the application. Google
can show software apps with rating and price in Search; see [Google: Software
app](https://developers.google.com/search/docs/appearance/structured-data/software-app).

## Example

```astro
---
// src/pages/app.astro
import Layout from '../layouts/Layout.astro';
import { SoftwareAppSchema } from '@casoon/astro-structured-data/components';
---
<Layout title="Example Notes">
  <SoftwareAppSchema
    name="Example Notes"
    description="Markdown notes that sync across devices."
    url="https://example.com/app/"
    operatingSystem="Windows, macOS, Linux"
    applicationCategory="ProductivityApplication"
    price="0"
    priceCurrency="EUR"
    ratingValue={4.6}
    reviewCount={182}
  />
</Layout>
```

## Output

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Example Notes",
  "description": "Markdown notes that sync across devices.",
  "url": "https://example.com/app/",
  "operatingSystem": "Windows, macOS, Linux",
  "applicationCategory": "ProductivityApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "EUR"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": 4.6,
    "reviewCount": 182
  }
}
```

`price` and `priceCurrency` become an `Offer`, `ratingValue` and `reviewCount` an
`AggregateRating`. Values keep their type: `price="0"` is output as the string `"0"`,
`price={0}` as the number `0`. Fields you leave out are omitted; `operatingSystem` and
`applicationCategory` are never filled in with defaults.

## Props

| Prop | Type | Required | Default/fallback | Description |
| --- | --- | --- | --- | --- |
| `id` | `string` | No | – | Output as the app's `@id`, so other nodes can reference it |
| `name` | `string` | Yes | – | Name of the application. |
| `description` | `string` | No (recommended) | – | Short description. |
| `url` | `string` (absolute http(s) URL) | No (recommended) | – | Page of the application or where to get it. |
| `operatingSystem` | `string` | No (recommended) | – | Supported platforms, e.g. `'Web'` or `'Windows, macOS, Linux'`. |
| `applicationCategory` | `string` | No (recommended) | – | Category, e.g. `'BusinessApplication'`, `'GameApplication'`, `'DeveloperApplication'`. |
| `price` | `number \| string` (e.g. `0`, `'19.99'`) | No (recommended) | – | Price. Use `0` for free apps. Requires `priceCurrency`. |
| `priceCurrency` | `string` (ISO 4217, e.g. `EUR`) | No (recommended) | – | Currency of the price. Requires `price`. |
| `ratingValue` | `number` (0–5) | No (recommended) | – | Average rating. Requires `reviewCount`. |
| `reviewCount` | `number` (positive integer) | No (recommended) | – | Number of ratings. Requires `ratingValue`. |
| `isPartOf` | `{ type?, id?, name?, headline?, url? }` or an array | No | – | Reference by `id` or `url`; `type` is free text, default `'CreativeWork'` |
| `hasPart` | `{ type?, id?, name?, headline?, url?, position? }[]` | No | – | Reference by `id` or `url`; `type` is free text, default `'CreativeWork'` |
| `changefreq` | `'always' \| 'hourly' \| 'daily' \| 'weekly' \| 'monthly' \| 'yearly' \| 'never'` | No | – | Sitemap hint, see [Sitemap hints](../../guides/meta-tags/#sitemap-hints). |
| `priority` | `number` (0–1) | No | – | Sitemap hint. |

## Rules

- `price` and `priceCurrency` only together: `price` without a currency fails with
  `Required when "price" is set` at `priceCurrency`, and the other way round. The same applies
  to `ratingValue` and `reviewCount`.
- `price` is a non-negative number or a numeric string such as `"19.99"`; `priceCurrency` is a
  three-letter ISO 4217 code in upper case.
- `ratingValue` lies between 0 and 5; `reviewCount` is a positive integer.
- `url` must be an absolute `http(s)` URL.
- Recommended fields: `description`, `url`, `operatingSystem`, `applicationCategory`,
  `offers` (from `price` and `priceCurrency`), `aggregateRating` (from `ratingValue` and
  `reviewCount`). Each missing one produces a warning after the build (see
  [Validation](../../guides/validation/)).

## Meta tags

With `generateMeta: true` a SoftwareApplication can be the primary schema: `name` becomes
`og:title` and `twitter:title`, `description` the description tags. The component has no image
prop, so the generated tags contain no image and `twitter:card` is `summary`. See
[Meta tags and sitemap hints](../../guides/meta-tags/).
