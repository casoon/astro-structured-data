---
title: OrganizationSchema
description: Outputs an Organization with logo, profiles and contact data, typically once in the base layout or on the about page.
order: 10
---

`OrganizationSchema` produces an [`Organization`](https://schema.org/Organization): the company,
publisher or project behind the site, with its logo, profile links (`sameAs`) and contact data.
Google uses it for the logo and details of the organization in Search; see [Google:
Organization](https://developers.google.com/search/docs/appearance/structured-data/organization).
For a business with a physical location and opening hours, use
[`LocalBusinessSchema`](../local-business/) instead.

Name and logo can come from the `defaultArticlePublisher` integration option, which
`ArticleSchema`, `WebPageSchema` and `JobPostingSchema` also use, so the organization is
configured in one place.

## Example

```astro
---
// src/pages/about.astro
import Layout from '../layouts/Layout.astro';
import { OrganizationSchema } from '@casoon/astro-structured-data/components';
---
<Layout title="About us">
  <OrganizationSchema
    name="Example GmbH"
    url="https://example.com"
    logoUrl="/logo.png"
    sameAs={['https://github.com/example', 'https://www.linkedin.com/company/example']}
    telephone="+49 30 1234567"
    email="info@example.com"
    address={{
      streetAddress: 'Hauptstraße 1',
      addressLocality: 'Berlin',
      postalCode: '10115',
      addressCountry: 'DE',
    }}
  />
</Layout>
```

## Output

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Example GmbH",
  "url": "https://example.com",
  "logo": {
    "@type": "ImageObject",
    "url": "/logo.png"
  },
  "sameAs": [
    "https://github.com/example",
    "https://www.linkedin.com/company/example"
  ],
  "telephone": "+49 30 1234567",
  "email": "info@example.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Hauptstraße 1",
    "addressLocality": "Berlin",
    "postalCode": "10115",
    "addressCountry": "DE"
  }
}
```

The logo URL is output as given; a root-relative path stays relative in the JSON-LD.

## Using the configured publisher

With the publisher configured once, the component needs no name or logo:

```js
// astro.config.mjs
structuredData({
  siteUrl: 'https://example.com',
  defaultArticlePublisher: { name: 'Example Media', logo: { url: '/logo.png' } },
})
```

```astro
<OrganizationSchema sameAs={['https://github.com/example']} />
```

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Example Media",
  "url": "https://example.com",
  "logo": {
    "@type": "ImageObject",
    "url": "/logo.png"
  },
  "sameAs": [
    "https://github.com/example"
  ]
}
```

## Props

| Prop | Type | Required | Default/fallback | Description |
| --- | --- | --- | --- | --- |
| `name` | `string` | Yes, unless configured | `defaultArticlePublisher.name` | Name of the organization. |
| `url` | `string` (absolute http(s) URL) | No | `siteUrl` | Website of the organization. |
| `logoUrl` | `string` (absolute URL or `/path`) | No | `defaultArticlePublisher.logo.url`; omitted if neither is set | Logo, output as an `ImageObject`. |
| `sameAs` | `string[]` (absolute http(s) URLs) | No (recommended) | – | Profiles of the same organization elsewhere (social networks, Wikipedia, GitHub). |
| `telephone` | `string` | No (recommended) | – | Phone number, e.g. `+49 30 1234567`. |
| `email` | `string` (email address) | No (recommended) | – | Contact email address. |
| `address` | `{ streetAddress, addressLocality, addressRegion?, postalCode, addressCountry }` (all `string`) | No (recommended) | – | Postal address, output as a `PostalAddress`. |
| `changefreq` | `'always' \| 'hourly' \| 'daily' \| 'weekly' \| 'monthly' \| 'yearly' \| 'never'` | No | – | Sitemap hint, see [Sitemap hints](../../guides/meta-tags/#sitemap-hints). |
| `priority` | `number` (0–1) | No | – | Sitemap hint. |

## Rules

- A name is required, from the prop or from `defaultArticlePublisher.name`. With neither, the
  build fails with "Missing organization name: set the "name" prop or
  defaultArticlePublisher.name". No placeholder name is invented.
- `url` must be an absolute `http(s)` URL; `logoUrl` may also be a root-relative path.
- Every `sameAs` entry must be an absolute `http(s)` URL; an empty list is rejected.
- `email` must be a valid email address.
- `address` needs `streetAddress`, `addressLocality`, `postalCode` and `addressCountry`;
  `addressRegion` is optional. Other keys are rejected.
- Recommended fields: `sameAs`, `telephone`, `email`, `address`. Each missing one produces a
  warning after the build (see [Validation](../../guides/validation/)).

An Organization never drives the page's meta tags.
