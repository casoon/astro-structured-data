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
  title="Structured data for Astro sites"
  description="How JSON-LD is generated from typed, validated component props."
  datePublished="2026-09-10"
  authorName="Jane Doe"
  imageUrl="/images/structured-data.jpg"
/>
```

The component can sit in the page body or in the layout's `<head>`; the output is the same.

## Build

Run `astro build`. The page now contains a `<script type="application/ld+json">` block with a
`BlogPosting` (the default `schemaType` of `ArticleSchema`), the author as a `Person`, and
`mainEntityOfPage` pointing to the page URL built from your site URL. The
[showcase](../../../showcase/blog-post/) shows the complete output of this example, rendered by
the package while this site was built.

## When the data is wrong

Props are checked before anything is rendered. A date like `15.06.2026` or a currency like
`euro` stops the build:

```
[astro-structured-data] <EventSchema> on /events/meetup/ received invalid props:
✖ Invalid input
  → at startDate
✖ Must be an ISO 4217 currency code like "EUR"
  → at priceCurrency
```

Fix the reported fields and build again. The [validation guide](../../guides/validation/)
lists every rule.

## Check in the browser

In `astro dev`, open the **Structured Data** panel of the Astro Dev Toolbar. It lists every
JSON-LD block on the page with a rich result preview, the missing recommended fields, a copy
button and a link to the schema.org validator.
