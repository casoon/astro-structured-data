---
title: Quickstart
description: Put a first schema on a page, build, and look at the JSON-LD it produces.
order: 2
---

## Place a component

Import components from `@casoon/astro-structured-data/components` and pass your data as props:

```astro
---
import { ArticleSchema } from '@casoon/astro-structured-data/components';
---

<ArticleSchema
  title="Hello, Astro"
  description="Our first post."
  datePublished="2026-10-01"
  authorName="Ada Lovelace"
  imageUrl="/img/hello.jpg"
  publisherName="Example Blog"
/>
```

The component can sit in the page body or in the layout's `<head>`; the output is the same.
In a layout, pass the data you already have, e.g. `title={post.data.title}`.

## Build

Run `astro build`. On `/blog/hello-astro/` of `https://example.com`, the page now contains a
`<script type="application/ld+json">` block with a `BlogPosting` (the default `schemaType` of
`ArticleSchema`), the author as a `Person`, and `mainEntityOfPage` pointing to the page URL
built from your site URL:

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Hello, Astro",
  "description": "Our first post.",
  "datePublished": "2026-10-01",
  "dateModified": "2026-10-01",
  "mainEntityOfPage": { "@type": "WebPage", "@id": "https://example.com/blog/hello-astro/" },
  "author": { "@type": "Person", "name": "Ada Lovelace" },
  "isAccessibleForFree": true,
  "publisher": { "@type": "Organization", "name": "Example Blog" },
  "image": { "@type": "ImageObject", "url": "/img/hello.jpg" }
}
```

With `generateMeta: true`, the same data also fills the canonical link, the description and
the Open Graph and Twitter tags in `<head>`; the
[meta tags guide](../../guides/meta-tags/#example) shows the tags of this example. The
[showcase](../../../showcase/blog-post/) shows the complete output of a blog post, rendered by
the package while this site was built.

## When the data is wrong

Props are checked before anything is rendered. A date like `15.06.2026` or a currency like
`euro` stops the build:

```
[astro-structured-data] <EventSchema> on /events/meetup/ received invalid props:
✖ Must be an ISO 8601 date (YYYY-MM-DD) or date-time, or a Date
  → at startDate
✖ Must be an ISO 4217 currency code like "EUR"
  → at priceCurrency
```

Fix the reported fields and build again. The [validation guide](../../guides/validation/)
lists every rule, and each [component page](../../components/article/) the rules of its props.

## Check in the browser

In `astro dev`, open the **Structured Data** panel of the Astro Dev Toolbar. It lists every
JSON-LD block on the page with a rich result preview, the missing recommended fields, a copy
button and a link to the schema.org validator; see
[Dev Toolbar and build report](../../guides/dev-toolbar/).

## Next steps

- [Setups by kind of site](../../guides/site-setups/): which components a blog, shop, local
  business, event page or job board needs.
- [Meta tags](../../guides/meta-tags/): canonical, Open Graph and Twitter tags from the same data.
- [Components](../../reference/components/): every component with its props.
