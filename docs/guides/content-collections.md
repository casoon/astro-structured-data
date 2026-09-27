---
title: Zod schemas and content
description: Validate frontmatter with the same schemas the components use, and fill article fields from content.
order: 4
---

## Zod schemas

Every component ships with a matching Zod schema, exported from
`@casoon/astro-structured-data/zod`. The components validate their props with exactly these
schemas, and the prop types are exported from the same entry point (`ArticleProps`,
`EventProps`, `ProductProps`, …).

```ts
import {
  articleZodSchema,
  eventZodSchema,
  faqZodSchema,
  productZodSchema,
} from '@casoon/astro-structured-data/zod';
```

Available: `articleZodSchema`, `autoBreadcrumbZodSchema`, `breadcrumbZodSchema`,
`collectionPageZodSchema`, `eventZodSchema`, `faqZodSchema`, `jobPostingZodSchema`,
`localBusinessZodSchema`, `organizationZodSchema`, `productZodSchema`,
`profilePageZodSchema`, `recipeZodSchema`, `softwareAppZodSchema`, `videoZodSchema`,
`webPageZodSchema`, `webSiteZodSchema`.

The exported schemas ignore unknown top-level keys, so they can be used directly for content
collections whose frontmatter has additional fields. The components themselves are strict.

## Recommended fields

`validateRecommended` checks a schema object for missing recommended fields, matching what the
build warning reports:

```ts
import { validateRecommended } from '@casoon/astro-structured-data/zod';

const warnings = validateRecommended('Organization', {
  name: 'ACME Corp',
  url: 'https://acme.com',
});
// → [{ field: 'sameAs', message: 'Organization should include "sameAs" ...' }, ...]
```

The first argument is a schema.org `@type` name: `Article`, `BlogPosting`, `NewsArticle`,
`FAQPage`, `Product`, `LocalBusiness`, `Event`, `Organization`, `WebPage`, `WebSite`,
`ProfilePage`, `JobPosting`, `SoftwareApplication`, `CollectionPage`, `BreadcrumbList`,
`Recipe`, `VideoObject`.

## Reading time

`calculateReadingTime` counts words in plain text or HTML and returns the reading time, for
`wordCount` and `readingTimeMinutes` on `ArticleSchema`:

```astro
---
import { calculateReadingTime } from '@casoon/astro-structured-data/utils';
import { ArticleSchema } from '@casoon/astro-structured-data/components';
import { getEntry } from 'astro:content';

const post = await getEntry('blog', Astro.params.slug);
const { wordCount, readingTimeMinutes } = calculateReadingTime(post.body);
---
<ArticleSchema
  title={post.data.title}
  description={post.data.description}
  datePublished={post.data.date}
  authorName={post.data.author}
  wordCount={wordCount}
  readingTimeMinutes={readingTimeMinutes}
/>
```
