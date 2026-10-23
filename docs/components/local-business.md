---
title: LocalBusinessSchema
description: Outputs a LocalBusiness with address, coordinates, opening hours and contact data; use it for shops, offices and other businesses with a physical location.
order: 4
---

`LocalBusinessSchema` describes a business that customers visit or contact locally. It
outputs a [`LocalBusiness`](https://schema.org/LocalBusiness) with
[`PostalAddress`](https://schema.org/PostalAddress) and
[`GeoCoordinates`](https://schema.org/GeoCoordinates), and targets Google's
[local business details](https://developers.google.com/search/docs/appearance/structured-data/local-business)
(address, opening hours and phone number in the knowledge panel and on Maps).

Business data rarely changes between pages, so it usually lives in the integration option
`defaultLocalBusiness`. Every prop falls back to it individually.

## Usage

```js
// astro.config.mjs
structuredData({
  siteUrl: 'https://example.com',
  defaultLocalBusiness: {
    name: 'Example Bakery',
    url: 'https://example.com',
    telephone: '+49 30 1234567',
    imageUrl: '/images/storefront.jpg',
    priceRange: '€€',
    address: {
      streetAddress: 'Hauptstraße 42',
      addressLocality: 'Berlin',
      postalCode: '10119',
      addressCountry: 'DE',
    },
    geo: { latitude: 52.5321, longitude: 13.4105 },
    openingHours: ['Mo-Fr 07:00-18:00', 'Sa 08:00-14:00'],
    sameAs: ['https://www.instagram.com/examplebakery'],
  },
})
```

```astro
---
// src/pages/index.astro (or the base layout)
import { LocalBusinessSchema } from '@casoon/astro-structured-data/components';
---
<LocalBusinessSchema />
```

## Output

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Example Bakery",
  "url": "https://example.com",
  "image": "/images/storefront.jpg",
  "telephone": "+49 30 1234567",
  "priceRange": "€€",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Hauptstraße 42",
    "addressLocality": "Berlin",
    "postalCode": "10119",
    "addressCountry": "DE"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 52.5321,
    "longitude": 13.4105
  },
  "openingHours": [
    "Mo-Fr 07:00-18:00",
    "Sa 08:00-14:00"
  ],
  "sameAs": [
    "https://www.instagram.com/examplebakery"
  ]
}
```

Fields that are neither passed nor configured are left out. `imageUrl` is output as `image`;
a root-relative path is written as given.

## Branch pages

Props override the defaults one by one. A branch page passes what differs and inherits the
rest:

```astro
---
// src/pages/locations/[branch].astro
import { getEntry } from 'astro:content';
import { LocalBusinessSchema } from '@casoon/astro-structured-data/components';

const branch = await getEntry('branches', Astro.params.branch);
---
<LocalBusinessSchema
  name={branch.data.name}
  telephone={branch.data.telephone}
  address={branch.data.address}
  geo={branch.data.geo}
  openingHours={branch.data.openingHours}
/>
```

For the Potsdam branch (`name: 'Example Bakery Potsdam'`, `addressRegion: 'Brandenburg'`, own
phone number, coordinates and opening hours):

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Example Bakery Potsdam",
  "url": "https://example.com",
  "image": "/images/storefront.jpg",
  "telephone": "+49 331 987654",
  "priceRange": "€€",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Brandenburger Straße 5",
    "addressLocality": "Potsdam",
    "addressRegion": "Brandenburg",
    "postalCode": "14467",
    "addressCountry": "DE"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 52.4009,
    "longitude": 13.0591
  },
  "openingHours": [
    "Mo-Sa 07:00-14:00"
  ],
  "sameAs": [
    "https://www.instagram.com/examplebakery"
  ]
}
```

`url`, `image`, `priceRange` and `sameAs` come from `defaultLocalBusiness`. An object prop
such as `address` replaces the configured object as a whole; its fields are not merged with
the default address.

## Props

| Prop | Type | Required | Default / fallback | Description |
| --- | --- | --- | --- | --- |
| `name` | `string` | Yes, unless configured | `defaultLocalBusiness.name` | Business name |
| `id` | `string` | No | `defaultLocalBusiness.id`, unless `name` is set | Output as `@id`, so other items can reference the business |
| `url` | `string` (absolute URL) | No (recommended) | `defaultLocalBusiness.url` | Business website |
| `description` | `string` | No | `defaultLocalBusiness.description` | Short description |
| `imageUrl` | `string` (URL or `/path`) | No (recommended) | `defaultLocalBusiness.imageUrl` | Photo of the business, output as `image` |
| `telephone` | `string` | No (recommended) | `defaultLocalBusiness.telephone` | Phone number, ideally with country code |
| `email` | `string` (email address) | No | `defaultLocalBusiness.email` | Contact email |
| `priceRange` | `string` | No | `defaultLocalBusiness.priceRange` | Price level, e.g. `'€€'` or `'10-30 EUR'` |
| `address` | `PostalAddress` | No (recommended) | `defaultLocalBusiness.address` | `{ streetAddress, addressLocality, addressRegion?, postalCode, addressCountry }` |
| `geo` | `{ latitude: number; longitude: number }` | No (recommended) | `defaultLocalBusiness.geo` | Coordinates; latitude −90 to 90, longitude −180 to 180 |
| `openingHours` | `string[]` | No (recommended) | `defaultLocalBusiness.openingHours` | Opening hours in schema.org format, at least one entry |
| `sameAs` | `string[]` (absolute URLs) | No (recommended) | `defaultLocalBusiness.sameAs` | Profiles of the business elsewhere (Google Business Profile, social media), at least one entry |
| `changefreq`, `priority` | sitemap hints | No | – | See [Meta tags and sitemap hints](../../guides/meta-tags/) |

"URL or `/path`" means an absolute `http(s)` URL or a root-relative path. In `address`, all
fields except `addressRegion` are required and no other fields are allowed; `geo` allows only
`latitude` and `longitude`.

## Rules

Violations fail the build (see [Validation](../../guides/validation/)):

- A name is required after merging: without a `name` prop and without
  `defaultLocalBusiness.name` the build fails with
  `Missing business name: set the "name" prop or defaultLocalBusiness.name`.
- `openingHours` entries use the schema.org format: day or day range, comma-separated, then
  an optional time range, e.g. `'Mo-Fr 09:00-18:00'`, `'Sa 10:00-14:00'`,
  `'Mo,We,Fr 08:00-12:00'`, `'Su'`. Days are `Mo`, `Tu`, `We`, `Th`, `Fr`, `Sa`, `Su`; times
  are `HH:MM` with hours `00` to `24`.
- `url` and `sameAs` entries must be absolute `http(s)` URLs; `email` must be a valid email
  address.
- Text fields must not be empty.

`defaultLocalBusiness` is validated against the same rules when the integration is created,
with all fields optional and unknown keys rejected (see
[Integration options](../../reference/options/)).

Recommended fields (`url`, `image`, `telephone`, `address`, `geo`, `openingHours`, `sameAs`)
are reported after the build when missing, unless `warnOnMissingRecommended` is off. Values
from `defaultLocalBusiness` count.
