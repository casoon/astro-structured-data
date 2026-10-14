---
title: Schema and SchemaGraph
description: Schema outputs any schema.org object as given, for types without a dedicated component; SchemaGraph marks where the page's @graph block goes in graph mode.
order: 16
sidebarLabel: Schema and SchemaGraph
---

`Schema` is the generic component that every other component renders through. Use it directly
for schema.org types that have no dedicated component, such as
[`Course`](https://schema.org/Course), [`Book`](https://schema.org/Book) or
[`Dataset`](https://schema.org/Dataset). `SchemaGraph` marks where the combined `@graph` block
of a page goes when [graph mode](../../guides/graph-mode/) is on.

## Schema

```astro
---
// src/pages/courses/astro-basics.astro
import Layout from '../../layouts/Layout.astro';
import { Schema } from '@casoon/astro-structured-data/components';
---
<Layout title="Astro Basics">
  <Schema
    item={{
      '@type': 'Course',
      name: 'Astro Basics',
      description: 'Build and ship a static site with Astro.',
      provider: { '@type': 'Organization', name: 'Example GmbH', sameAs: 'https://example.com' },
    }}
    changefreq="monthly"
  />
</Layout>
```

### Output

```html
<script type="application/ld+json" data-sitemap-changefreq="monthly">…</script>
```

```json
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "Astro Basics",
  "description": "Build and ship a static site with Astro.",
  "provider": {
    "@type": "Organization",
    "name": "Example GmbH",
    "sameAs": "https://example.com"
  }
}
```

The object is output as given, with `"@context": "https://schema.org"` added in front. Only
`@type` is checked. Whether the rest is valid schema.org, and whether Google's requirements
for the type are met, is up to you.

### Props

| Prop | Type | Required | Default/fallback | Description |
| --- | --- | --- | --- | --- |
| `item` | `{ '@type': string \| string[]; [key: string]: unknown }` | Yes | – | The schema.org object. |
| `changefreq` | `'always' \| 'hourly' \| 'daily' \| 'weekly' \| 'monthly' \| 'yearly' \| 'never'` | No | – | Sitemap hint, see [Sitemap hints](../../guides/meta-tags/#sitemap-hints). |
| `priority` | `number` (0–1) | No | – | Sitemap hint. |

### Rules

- `item['@type']` is required: a non-empty string or a non-empty list of non-empty strings,
  such as `['Book', 'Product']`. Other keys of `item` are not checked.
- Unknown props next to `item`, `changefreq` and `priority` are rejected.
- Keys that only carry page-level hints are removed from the JSON-LD output: `changefreq`,
  `priority`, `robots`, `noindex`, `nofollow`, `alternates` and `readingTime`. The sitemap
  hints may be set as props or on `item`; if both are set they must agree, otherwise the build
  fails with "Conflicting sitemap …".
- The `@context` defaults to `https://schema.org`. An `@context` on `item` replaces it (see
  below).
- The output is escaped, so string values containing `</script>` cannot break out of the
  block.
- Schemas rendered with `Schema` take part in graph mode and in the meta tag generation like
  those of the dedicated components. With `generateMeta: true`, a `Schema` item whose `@type`
  is one of the supported types (for example `WebPage`, `AboutPage` or `Product`) can drive the
  meta tags.

### Custom @context

To use your own terms next to schema.org, pass an `@context` on the item. It replaces the
default context:

```astro
<Schema
  item={{
    '@context': ['https://schema.org', { ex: 'https://example.com/vocab#' }],
    '@type': 'Dataset',
    name: 'Opening hours',
    'ex:internalId': 'DS-42',
  }}
/>
```

```json
{
  "@context": [
    "https://schema.org",
    {
      "ex": "https://example.com/vocab#"
    }
  ],
  "@type": "Dataset",
  "name": "Opening hours",
  "ex:internalId": "DS-42"
}
```

In graph mode the `@graph` block carries `"@context": "https://schema.org"` at its root. A
node whose context is just schema.org (`https://schema.org` or `http://schema.org`, with or
without trailing slash) loses its own `@context` there. Any other context, such as the one
above, stays on its node as an embedded context, so the data means the same with and without
graph mode.

## SchemaGraph

With `useGraph: true` the components write no JSON-LD blocks of their own. Instead, the
integration's middleware collects every schema of the page and writes one block with an
`@graph` array at the position of `<SchemaGraph />`. Place it once in the base layout:

```js
// astro.config.mjs
structuredData({ siteUrl: 'https://example.com', useGraph: true })
```

```astro
---
// src/layouts/Base.astro
import { OrganizationSchema, SchemaGraph, WebSiteSchema } from '@casoon/astro-structured-data/components';
---
<html lang="en">
  <head>…</head>
  <body>
    <slot />
    <WebSiteSchema name="Example" />
    <OrganizationSchema name="Example GmbH" logoUrl="/logo.png" />
    <SchemaGraph />
  </body>
</html>
```

```astro
---
// src/pages/courses/astro-basics.astro
import Base from '../../layouts/Base.astro';
import { Schema } from '@casoon/astro-structured-data/components';
---
<Base>
  <h1>Astro Basics</h1>
  <Schema
    item={{
      '@context': ['https://schema.org', { ex: 'https://example.com/vocab#' }],
      '@type': 'Course',
      name: 'Astro Basics',
      'ex:internalId': 'C-42',
    }}
  />
</Base>
```

### Output

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@context": [
        "https://schema.org",
        {
          "ex": "https://example.com/vocab#"
        }
      ],
      "@type": "Course",
      "name": "Astro Basics",
      "ex:internalId": "C-42"
    },
    {
      "@type": "WebSite",
      "name": "Example",
      "url": "https://example.com"
    },
    {
      "@type": "Organization",
      "name": "Example GmbH",
      "url": "https://example.com",
      "logo": {
        "@type": "ImageObject",
        "url": "/logo.png"
      }
    }
  ]
}
```

The nodes appear in the order the components rendered; here the page content renders before
the schemas after `<slot />` in the layout. The WebSite and Organization nodes have no
`@context` of their own, while the Course keeps its custom one.

### Props

`SchemaGraph` has no props.

### Rules

- `<SchemaGraph />` only marks the position. The block is filled in after the whole page has
  rendered, so schema components may appear before or after it, and inside components that
  await data first.
- In graph mode, a page with schemas must render `<SchemaGraph />` exactly once. Without it,
  or with more than one, the build fails, so no schema goes missing.
- Without `useGraph`, `<SchemaGraph />` renders nothing and can stay in the layout.
- Schemas are collected per page path; nothing carries over from one page to the next during a
  static build. Identical schemas on one page appear once in the `@graph`.
- Sitemap hints of all schemas on the page are written as data attributes on the `@graph`
  script; they must agree.
- HTML responses are buffered by the middleware rather than streamed.

See [Graph mode](../../guides/graph-mode/) for the overview.
