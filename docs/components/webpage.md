---
title: WebPageSchema
description: Outputs a WebPage for pages without a more specific type, and carries the page's robots, hreflang and canonical settings for the generated meta tags.
order: 12
---

`WebPageSchema` produces a [`WebPage`](https://schema.org/WebPage): a generic description of a
single page with title, description, language, dates, image, author and publisher. Use it for
landing pages, legal pages, about pages and anything else that does not fit a more specific
type such as an article or a product. Google has no rich result for WebPage.

It has a second role: with `generateMeta: true` it is the page schema that supplies the
page-level tags, the canonical URL, `robots` and `hreflang` alternates, even when another
schema on the page (an article, a product) drives title, description and image.

## Example

```astro
---
// src/pages/about.astro
import Layout from '../layouts/Layout.astro';
import { WebPageSchema } from '@casoon/astro-structured-data/components';
---
<Layout title="About us">
  <WebPageSchema
    title="About us"
    description="Who we are and what we build."
    inLanguage="en"
    datePublished="2026-03-01"
    dateModified="2026-09-15"
    image="/images/team.jpg"
    imageWidth={1200}
    imageHeight={630}
    imageFormat="image/jpeg"
    imageCaption="The team in Berlin"
    author={{ name: 'Ada Lovelace', url: '/team/ada-lovelace/' }}
  />
</Layout>
```

## Output

On `/about/`, with this configuration:

```js
structuredData({
  siteUrl: 'https://example.com',
  defaultArticlePublisher: { name: 'Example Media', logo: { url: '/logo.png' } },
})
```

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "About us",
  "url": "https://example.com/about/",
  "isAccessibleForFree": true,
  "description": "Who we are and what we build.",
  "inLanguage": "en",
  "datePublished": "2026-03-01",
  "dateModified": "2026-09-15",
  "image": {
    "@type": "ImageObject",
    "url": "/images/team.jpg",
    "width": 1200,
    "height": 630,
    "encodingFormat": "image/jpeg",
    "caption": "The team in Berlin"
  },
  "author": {
    "@type": "Person",
    "name": "Ada Lovelace",
    "url": "/team/ada-lovelace/"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Example Media",
    "url": "https://example.com",
    "logo": {
      "@type": "ImageObject",
      "url": "/logo.png"
    }
  }
}
```

`url` is the page URL built from `siteUrl` and the path. `publisher` comes from
`defaultArticlePublisher`; without that option and without the `publisher` prop it is left
out. Image and author URLs are output as given.

With `generateMeta: true` the same component produces these tags:

```html
<link rel="canonical" href="https://example.com/about/">
<meta name="description" content="Who we are and what we build.">
<meta name="author" content="Ada Lovelace">
<meta property="og:title" content="About us">
<meta property="og:description" content="Who we are and what we build.">
<meta property="og:url" content="https://example.com/about/">
<meta property="og:image" content="https://example.com/images/team.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:alt" content="The team in Berlin">
<meta property="og:site_name" content="Example Media">
<meta property="og:locale" content="en">
<meta property="og:type" content="website">
<meta name="twitter:title" content="About us">
<meta name="twitter:description" content="Who we are and what we build.">
<meta name="twitter:image" content="https://example.com/images/team.jpg">
<meta name="twitter:image:alt" content="The team in Berlin">
<meta name="twitter:card" content="summary_large_image">
```

## Language versions (hreflang)

`alternates` lists the language versions of the page. It is not part of the JSON-LD; it only
produces `<link rel="alternate" hreflang>` tags:

```astro
---
// src/pages/en/pricing.astro
---
<WebPageSchema
  title="Pricing"
  description="Plans and prices."
  inLanguage="en"
  alternates={[
    { href: 'https://example.com/en/pricing/', hreflang: 'en' },
    { href: 'https://example.com/de/preise/', hreflang: 'de' },
    { href: 'https://example.com/en/pricing/', hreflang: 'x-default' },
  ]}
/>
```

```html
<link rel="canonical" href="https://example.com/en/pricing/">
<meta name="description" content="Plans and prices.">
<link rel="alternate" hreflang="en" href="https://example.com/en/pricing/">
<link rel="alternate" hreflang="de" href="https://example.com/de/preise/">
<link rel="alternate" hreflang="x-default" href="https://example.com/en/pricing/">
<meta property="og:title" content="Pricing">
…
```

The JSON-LD of this page contains `name`, `url`, `isAccessibleForFree`, `description`,
`inLanguage` and the publisher, but no `alternates`.

## Keeping a page out of the index

`robots` works the same way: it becomes `<meta name="robots">` and is removed from the JSON-LD.

```astro
<WebPageSchema title="New feature (draft)" robots="noindex, nofollow" />
```

```html
<link rel="canonical" href="https://example.com/drafts/new-feature/">
<meta name="robots" content="noindex, nofollow">
<meta property="og:title" content="New feature (draft)">
…
```

Robots directives and alternates count even when another schema on the page is primary. A
`noindex` WebPage next to an `ArticleSchema` keeps the page `noindex`, while the article
supplies title, description and image. See [Meta tags and sitemap
hints](../../guides/meta-tags/#robots-and-alternates).

## Props

| Prop | Type | Required | Default/fallback | Description |
| --- | --- | --- | --- | --- |
| `title` | `string` | Yes | – | Page title, output as `name`. |
| `description` | `string` | No (recommended) | – | Page description. |
| `url` | `string` (absolute http(s) URL) | No | page URL from `siteUrl` and the current path | URL of the page. With `generateMeta`, also the canonical URL. |
| `inLanguage` | `string` (BCP 47 tag, e.g. `en`, `de-DE`) | No | – | Language of the content. |
| `datePublished` | `string \| Date` (ISO 8601) | No (recommended) | – | Publication date. |
| `dateModified` | `string \| Date` (ISO 8601) | No (recommended) | `datePublished` | Last modification date. |
| `isAccessibleForFree` | `boolean` | No | `true` | Whether the content is free to access. Always output. |
| `image` | `string` (absolute URL or `/path`) | No (recommended) | – | Page image, output as an `ImageObject`. |
| `imageWidth` | `number` (positive integer) | No | – | Image width in pixels. |
| `imageHeight` | `number` (positive integer) | No | – | Image height in pixels. |
| `imageFormat` | `string` (MIME type, e.g. `image/jpeg`) | No | – | Output as `encodingFormat`. |
| `imageCaption` | `string` | No | – | Output as `caption`; also `og:image:alt`. |
| `author` | `{ name: string; url?: string; id?: string; type?: 'Person' \| 'Organization' }` | No (recommended) | `type`: `'Person'` | Author of the page. `url` may be absolute or root-relative; `id` becomes `@id`. |
| `publisher` | `{ name: string; url?: string; logo?: string }` | No | `defaultArticlePublisher` for name and logo, `siteUrl` for `url` | Publisher, output as an `Organization`. `url` must be absolute; `logo` may be root-relative. |
| `robots` | `string` (e.g. `'noindex, nofollow'`) | No | – | Robots directives for `<meta name="robots">`. Not part of the JSON-LD. |
| `alternates` | `{ href: string; hreflang: string }[]` | No | – | Language versions for `<link rel="alternate" hreflang>`. Not part of the JSON-LD. |
| `changefreq` | `'always' \| 'hourly' \| 'daily' \| 'weekly' \| 'monthly' \| 'yearly' \| 'never'` | No | – | Sitemap hint, see [Sitemap hints](../../guides/meta-tags/#sitemap-hints). |
| `priority` | `number` (0–1) | No | – | Sitemap hint. |

## Rules

- `imageWidth`, `imageHeight`, `imageFormat` and `imageCaption` are only allowed together with
  `image` ("Only allowed together with "image"").
- `dateModified` must not be before `datePublished`. Dates are ISO 8601 strings
  (`2026-09-15`, `2026-09-15T10:00:00+02:00`) or `Date` objects; `Date` values are output as
  ISO strings.
- `robots` must be a comma-separated list of directives such as `noindex`, `nofollow` or
  `max-snippet:50`.
- Each `alternates` entry needs an absolute `http(s)` `href` and an `hreflang` that is a BCP 47
  language tag or `x-default`. The list must not be empty.
- `url` and `publisher.url` must be absolute `http(s)` URLs.
- The publisher is only output when a name is available, from `publisher.name` or
  `defaultArticlePublisher.name`. Its `url` falls back to `siteUrl`, its logo to
  `defaultArticlePublisher.logo.url`.
- Recommended fields: `description`, `datePublished`, `dateModified`, `image`, `author`. Each
  missing one produces a warning after the build (see [Validation](../../guides/validation/)).
