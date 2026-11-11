---
title: WebSiteSchema
description: Outputs a WebSite with the site name and URL, optionally with a SearchAction, once on the home page or in the base layout.
order: 11
---

`WebSiteSchema` produces a [`WebSite`](https://schema.org/WebSite): the name and URL of the site
as a whole. Google uses the site name for the name shown next to search results; see [Google:
Site names](https://developers.google.com/search/docs/appearance/site-names). With
`searchQueryInput` it adds a [`SearchAction`](https://schema.org/SearchAction) that describes
the site's search URL as schema.org markup. Google used this markup for the sitelinks search
box, which it no longer shows since 21 November 2024 ([Google Search Central
blog](https://developers.google.com/search/blog/2024/10/sitelinks-search-box)); the
`SearchAction` remains valid schema.org markup and does not trigger a Google search feature.

Place it once, on the home page or in the base layout. For a single page, use
[`WebPageSchema`](../webpage/).

## Example

```astro
---
// src/pages/index.astro
import Layout from '../layouts/Layout.astro';
import { WebSiteSchema } from '@casoon/astro-structured-data/components';
---
<Layout title="Example">
  <WebSiteSchema name="Example" searchQueryInput="q" />
</Layout>
```

The site's search must accept the term in the given query parameter, here
`https://example.com/?q=astro`.

## Output

With `siteUrl: 'https://example.com'`:

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Example",
  "url": "https://example.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://example.com/?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

Without `searchQueryInput`, only `@type`, `name` and `url` are output.

## Props

| Prop | Type | Required | Default/fallback | Description |
| --- | --- | --- | --- | --- |
| `name` | `string` | Yes | – | Name of the site. |
| `url` | `string` (absolute http(s) URL) | No | `siteUrl` | URL of the site. Also the base of the search URL template. |
| `id` | `string` | No | – | Output as `@id`, e.g. `https://example.com/#website`, so other items can reference the site. |
| `searchQueryInput` | `string` | No | – | Name of the query parameter of the site search, e.g. `q`. Adds the `SearchAction`. |
| `changefreq` | `'always' \| 'hourly' \| 'daily' \| 'weekly' \| 'monthly' \| 'yearly' \| 'never'` | No | – | Sitemap hint, see [Sitemap hints](../../guides/meta-tags/#sitemap-hints). |
| `priority` | `number` (0–1) | No | – | Sitemap hint. |

## Rules

- `url` must be an absolute `http(s)` URL. Without it, `siteUrl` is used exactly as
  configured.
- `searchQueryInput` may only contain letters, digits, `_` and `-` ("Must be a query parameter
  name like "q""). The search URL is built as `<url without trailing slash>/?<param>={search_term_string}`,
  so the search has to live at the root of the site. The placeholder is always
  `search_term_string`, and `query-input` declares that name (`required name=search_term_string`);
  the configured parameter name appears only in the URL.
- WebSite has no recommended fields.

## Meta tags

With `generateMeta: true`, WebSite is the last choice for the primary schema: it drives the
meta tags only when no more specific schema (Article, Product, WebPage, …) is on the page. Then
its `name` becomes `og:title` and `twitter:title`. A `WebSiteSchema` in the base layout
therefore never overrides the tags of the individual pages. See [Meta tags and sitemap
hints](../../guides/meta-tags/).
