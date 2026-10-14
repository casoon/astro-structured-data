---
title: BreadcrumbSchema and AutoBreadcrumbSchema
description: Output a BreadcrumbList, either from an explicit list of items or derived from the URL path of the current page.
order: 15
sidebarLabel: Breadcrumbs
---

Both components produce a [`BreadcrumbList`](https://schema.org/BreadcrumbList): the position
of the page in the site hierarchy as an ordered list of
[`ListItem`](https://schema.org/ListItem) entries. Google can show the trail instead of the
plain URL in search results; see [Google:
Breadcrumb](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb).

- **`BreadcrumbSchema`** takes the items as a list. Use it when the hierarchy does not follow
  the URL, or when the names come from your data (category titles, page titles).
- **`AutoBreadcrumbSchema`** derives the items from the current URL path. Use it in a layout
  when the URL structure already reflects the hierarchy.

## BreadcrumbSchema

```astro
---
// src/pages/blog/astro-tips.astro
import Layout from '../../layouts/Layout.astro';
import { BreadcrumbSchema } from '@casoon/astro-structured-data/components';
---
<Layout title="Astro tips">
  <BreadcrumbSchema
    items={[
      { name: 'Home', url: '/' },
      { name: 'Blog', url: '/blog/' },
      { name: 'Astro tips', url: '/blog/astro-tips/' },
    ]}
  />
</Layout>
```

### Output

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Blog",
      "item": "/blog/"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Astro tips",
      "item": "/blog/astro-tips/"
    }
  ]
}
```

Positions are numbered from 1 in the order of `items`. The URLs are output exactly as given:
root-relative paths stay relative. Pass absolute URLs if you want them absolute in the JSON-LD.

### Props

| Prop | Type | Required | Default/fallback | Description |
| --- | --- | --- | --- | --- |
| `items` | `{ name: string; url: string }[]` | Yes | – | The trail from the top level down to the current page. `url` is an absolute `http(s)` URL or a root-relative path. |
| `changefreq` | `'always' \| 'hourly' \| 'daily' \| 'weekly' \| 'monthly' \| 'yearly' \| 'never'` | No | – | Sitemap hint, see [Sitemap hints](../../guides/meta-tags/#sitemap-hints). |
| `priority` | `number` (0–1) | No | – | Sitemap hint. |

### Rules

- `items` needs at least one entry ("At least one breadcrumb item is required").
- Each item needs a non-empty `name` and a `url` that is an absolute `http(s)` URL or a path
  starting with a single `/`. A relative path such as `blog/` is rejected. Other keys in an
  item are rejected.

## AutoBreadcrumbSchema

Without props, the component builds the trail from the path of the current page:

```astro
---
// src/layouts/Layout.astro
import { AutoBreadcrumbSchema } from '@casoon/astro-structured-data/components';
---
<html lang="en">
  <head>…</head>
  <body>
    <slot />
    <AutoBreadcrumbSchema />
  </body>
</html>
```

### Output

On `/en/blog/getting-started/`, with `siteUrl: 'https://example.com'`:

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://example.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "En",
      "item": "https://example.com/en"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Blog",
      "item": "https://example.com/en/blog"
    },
    {
      "@type": "ListItem",
      "position": 4,
      "name": "Getting Started",
      "item": "https://example.com/en/blog/getting-started"
    }
  ]
}
```

How the trail is built:

1. A home item named `homeLabel` (default `Home`) pointing to `/`.
2. The `prependBreadcrumbs`, in order.
3. One item per path segment. The name is the entry for the segment in `labels`, otherwise
   the segment with `-` and `_` replaced by spaces and each word capitalized
   (`getting-started` → `Getting Started`). The URL is the path up to and including that
   segment, without a trailing slash. Segments listed in `ignoreSegments` get no item.
4. The `appendBreadcrumbs`, in order.

All URLs, including those of prepended and appended items, are resolved against `siteUrl`, so
the output always contains absolute URLs. On the home page itself the trail has only the home
item.

### Labels, language prefixes and extra items

The example above shows the language prefix as its own item ("En"). `ignoreSegments` removes
it, `labels` replaces generated names, and `prependBreadcrumbs` inserts items that do not
appear in the path:

```astro
---
// rendered on /de/blog/erste-schritte/
---
<AutoBreadcrumbSchema
  homeLabel="Startseite"
  ignoreSegments={['de']}
  labels={{ 'erste-schritte': 'Erste Schritte mit Astro' }}
  prependBreadcrumbs={[{ name: 'Wissen', url: '/de/wissen/' }]}
/>
```

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Startseite",
      "item": "https://example.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Wissen",
      "item": "https://example.com/de/wissen/"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Blog",
      "item": "https://example.com/de/blog"
    },
    {
      "@type": "ListItem",
      "position": 4,
      "name": "Erste Schritte mit Astro",
      "item": "https://example.com/de/blog/erste-schritte"
    }
  ]
}
```

An ignored segment only loses its own item; the URLs of the following items still contain it
(`/de/blog`). The home item always points to `/` of the `siteUrl` origin, so with a localized
home page at `/de/` set `homeLabel` and add the localized start page via `prependBreadcrumbs`
if it should appear.

Percent-encoded segments are decoded for names, `labels` and `ignoreSegments`: on
`/%C3%BCber-uns/` the generated name is "Über Uns", and
`labels={{ 'über-uns': 'Über uns' }}` matches the segment. The URLs keep the encoded path.

### Props

| Prop | Type | Required | Default/fallback | Description |
| --- | --- | --- | --- | --- |
| `homeLabel` | `string` | No | `'Home'` | Name of the first item, which points to `/`. |
| `labels` | `Record<string, string>` | No | `{}` | Names for path segments, keyed by the decoded segment (or the segment as written). Segments without a label get a generated name. |
| `ignoreSegments` | `string[]` | No | `[]` | Path segments that get no item, e.g. language prefixes like `['de', 'en']`. Matched case-insensitively. |
| `prependBreadcrumbs` | `{ name: string; url: string }[]` | No | `[]` | Items inserted after the home item, before the generated ones. |
| `appendBreadcrumbs` | `{ name: string; url: string }[]` | No | `[]` | Items added after the generated ones. |
| `changefreq` | `'always' \| 'hourly' \| 'daily' \| 'weekly' \| 'monthly' \| 'yearly' \| 'never'` | No | – | Sitemap hint, see [Sitemap hints](../../guides/meta-tags/#sitemap-hints). |
| `priority` | `number` (0–1) | No | – | Sitemap hint. |

### Rules

- `homeLabel`, the values in `labels` and the entries of `ignoreSegments` must not be empty.
- Prepended and appended items need a non-empty `name` and a `url` that is an absolute
  `http(s)` URL or a root-relative path; other keys are rejected.
- The trail depends on the request path, so the same layout produces a different list on each
  page. In graph mode it joins the page's `@graph` like any other schema.

## Meta tags

A BreadcrumbList never drives the page's meta tags, and BreadcrumbList has no recommended
fields, so neither component causes build warnings.
