---
title: ArticleSchema
description: Outputs a BlogPosting, Article or NewsArticle for a single article page; use it on blog posts, news stories and other editorial content.
order: 1
---

`ArticleSchema` describes one article: headline, dates, authors, image and publisher. It outputs
a [`BlogPosting`](https://schema.org/BlogPosting) by default, or an
[`Article`](https://schema.org/Article) or [`NewsArticle`](https://schema.org/NewsArticle) via
`schemaType`. The target is Google's
[article rich result](https://developers.google.com/search/docs/appearance/structured-data/article)
(headline, image and date in Top stories, Discover and search results).

## Usage

A blog post rendered from a content collection. The publisher is set once in the integration
options and applies to every article:

```js
// astro.config.mjs
structuredData({
  siteUrl: 'https://example.com',
  defaultArticlePublisher: { name: 'Example Blog', logo: { url: 'https://example.com/logo.png' } },
})
```

```yaml
# src/content/blog/structured-data-in-astro.md (frontmatter)
title: Structured data in Astro
description: How to add validated JSON-LD to an Astro site.
pubDate: 2026-03-02
updatedDate: 2026-04-10
author: Jane Doe
cover: /images/blog/structured-data.jpg
tags: [astro, seo, json-ld]
```

```astro
---
// src/pages/blog/[...slug].astro
import { getCollection } from 'astro:content';
import { ArticleSchema } from '@casoon/astro-structured-data/components';
import { calculateReadingTime } from '@casoon/astro-structured-data/utils';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}

const { post } = Astro.props;
// 1840 words, 9 minutes for this post
const { wordCount, readingTimeMinutes } = calculateReadingTime(post.body);
---
<ArticleSchema
  title={post.data.title}
  description={post.data.description}
  datePublished={post.data.pubDate}
  dateModified={post.data.updatedDate}
  authorName={post.data.author}
  authorUrl="https://example.com/authors/jane-doe/"
  imageUrl={post.data.cover}
  imageWidth={1200}
  imageHeight={630}
  keywords={post.data.tags}
  wordCount={wordCount}
  readingTimeMinutes={readingTimeMinutes}
/>
```

`pubDate` and `updatedDate` are `Date` objects here (`z.coerce.date()` in the collection
schema). Dates passed as `Date` are output as full ISO date-times in UTC; pass a string such
as `'2026-03-02'` to keep the date as written.

## Output

On `/blog/structured-data-in-astro/`:

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Structured data in Astro",
  "description": "How to add validated JSON-LD to an Astro site.",
  "datePublished": "2026-03-02T00:00:00.000Z",
  "dateModified": "2026-04-10T00:00:00.000Z",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://example.com/blog/structured-data-in-astro/"
  },
  "author": {
    "@type": "Person",
    "name": "Jane Doe",
    "url": "https://example.com/authors/jane-doe/"
  },
  "isAccessibleForFree": true,
  "publisher": {
    "@type": "Organization",
    "name": "Example Blog",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.png"
    }
  },
  "image": {
    "@type": "ImageObject",
    "url": "/images/blog/structured-data.jpg",
    "width": 1200,
    "height": 630
  },
  "keywords": "astro, seo, json-ld",
  "wordCount": 1840,
  "timeRequired": "PT9M"
}
```

- `mainEntityOfPage` is always the current page, built from `siteUrl` and the page path.
- `publisher` comes from `defaultArticlePublisher` because no `publisherName` was passed.
- `keywords` is joined into one comma-separated string; `readingTimeMinutes` becomes
  `timeRequired` as an ISO 8601 duration.
- Root-relative URLs such as `imageUrl="/images/…"` are written as given, not resolved
  against `siteUrl`. Pass absolute URLs if you want absolute URLs in the JSON-LD.

## NewsArticle with several authors

```astro
<ArticleSchema
  schemaType="NewsArticle"
  title="City council passes 2027 budget"
  description="The council approved the budget after a six-hour session."
  datePublished="2026-10-12T08:00:00+02:00"
  dateModified="2026-10-12T14:30:00+02:00"
  authorName={['Jane Doe', 'John Roe']}
  imageUrl="https://example.com/images/news/council.jpg"
  publisherName="Example News"
  publisherLogo="https://example.com/logo.png"
  inLanguage="en"
  articleSection="Local politics"
  isAccessibleForFree={false}
/>
```

```json
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "City council passes 2027 budget",
  "description": "The council approved the budget after a six-hour session.",
  "datePublished": "2026-10-12T08:00:00+02:00",
  "dateModified": "2026-10-12T14:30:00+02:00",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://example.com/news/2026/city-council-budget/"
  },
  "author": [
    {
      "@type": "Person",
      "name": "Jane Doe"
    },
    {
      "@type": "Person",
      "name": "John Roe"
    }
  ],
  "isAccessibleForFree": false,
  "publisher": {
    "@type": "Organization",
    "name": "Example News",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.png"
    }
  },
  "image": {
    "@type": "ImageObject",
    "url": "https://example.com/images/news/council.jpg"
  },
  "inLanguage": "en",
  "articleSection": "Local politics"
}
```

With an array of names every author gets the same `authorType`. `authorUrl` and `authorId` are
not available for multiple authors.

## Article series

A part of a series points to the series page with `isPartOfHeadline` and `isPartOfUrl`, and
optionally its position:

```astro
<ArticleSchema
  title="Astro SEO, part 2: structured data"
  description="The second part of the series covers JSON-LD."
  datePublished="2026-05-04"
  authorName="Jane Doe"
  isPartOfHeadline="Astro SEO"
  isPartOfUrl="/blog/astro-seo/"
  seriesPosition={2}
/>
```

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Astro SEO, part 2: structured data",
  "description": "The second part of the series covers JSON-LD.",
  "datePublished": "2026-05-04",
  "dateModified": "2026-05-04",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://example.com/blog/astro-seo/part-2/"
  },
  "author": {
    "@type": "Person",
    "name": "Jane Doe"
  },
  "isAccessibleForFree": true,
  "publisher": {
    "@type": "Organization",
    "name": "Example Blog",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.png"
    }
  },
  "isPartOf": {
    "@type": "BlogPosting",
    "headline": "Astro SEO",
    "url": "/blog/astro-seo/"
  },
  "position": 2
}
```

`dateModified` falls back to `datePublished` when it is not set. The series overview page
lists its parts with `hasPart` instead; each entry becomes an object of the same `@type`
(`schemaType`) with `headline`, `url` and, if given, `position`:

```astro
<ArticleSchema
  title="Astro SEO"
  description="A four-part series on search engine optimisation with Astro."
  datePublished="2026-04-27"
  authorName="Jane Doe"
  hasPart={[
    { headline: 'Astro SEO, part 1: meta tags', url: '/blog/astro-seo/part-1/', position: 1 },
    { headline: 'Astro SEO, part 2: structured data', url: '/blog/astro-seo/part-2/', position: 2 },
  ]}
/>
```

## Props

| Prop | Type | Required | Default / fallback | Description |
| --- | --- | --- | --- | --- |
| `title` | `string` | Yes | – | Headline, output as `headline` |
| `description` | `string` | Yes | – | Short summary |
| `datePublished` | `string \| Date` | Yes | – | Publication date, ISO 8601 date or date-time |
| `dateModified` | `string \| Date` | No (recommended) | `datePublished` | Last modification; not before `datePublished` |
| `authorName` | `string \| string[]` | Yes | – | One author name or several |
| `authorType` | `'Person' \| 'Organization'` | No | `'Person'` | `@type` of every author |
| `authorUrl` | `string` (URL or `/path`) | No | – | Author profile URL; single author only |
| `authorId` | `string` | No | – | Output as the author's `@id`, to link to a `Person` described elsewhere; single author only |
| `imageUrl` | `string` (URL or `/path`) | No (recommended) | – | Article image, output as `ImageObject` |
| `imageWidth` | `number` (positive integer) | No | – | Image width in pixels; needs `imageUrl` |
| `imageHeight` | `number` (positive integer) | No | – | Image height in pixels; needs `imageUrl` |
| `imageFormat` | `string` (MIME type) | No | – | Output as `encodingFormat`, e.g. `'image/jpeg'`; needs `imageUrl` |
| `imageCaption` | `string` | No | – | Output as `caption`; needs `imageUrl` |
| `publisherName` | `string` | No (recommended) | `defaultArticlePublisher.name` | Publishing organisation |
| `publisherLogo` | `string` (URL or `/path`) | No (recommended) | `defaultArticlePublisher.logo.url` | Publisher logo, output as `ImageObject` |
| `schemaType` | `'Article' \| 'BlogPosting' \| 'NewsArticle'` | No | `'BlogPosting'` | `@type` of the article (and of `isPartOf` / `hasPart` entries) |
| `inLanguage` | `string` (BCP 47) | No | – | Content language, e.g. `'en'`, `'de-DE'` |
| `articleSection` | `string` | No | – | Section or category |
| `keywords` | `string \| string[]` | No | – | Output as one comma-separated string |
| `wordCount` | `number` (positive integer) | No | – | Word count |
| `readingTimeMinutes` | `number` (positive integer) | No | – | Output as `timeRequired`, e.g. `PT9M` |
| `isAccessibleForFree` | `boolean` | No | `true` | Set `false` for paywalled content |
| `isPartOfHeadline` | `string` | No | – | Headline of the series; only together with `isPartOfUrl` |
| `isPartOfUrl` | `string` (URL or `/path`) | No | – | URL of the series; only together with `isPartOfHeadline` |
| `seriesPosition` | `number` (positive integer) | No | – | Position within the series, output as `position`; needs `isPartOfUrl` |
| `hasPart` | `{ headline: string; url: string; position?: number }[]` | No | – | Parts of a series (at least one entry) |
| `changefreq`, `priority` | sitemap hints | No | – | See [Meta tags and sitemap hints](../../guides/meta-tags/) |

"URL or `/path`" means an absolute `http(s)` URL or a root-relative path.

## Rules

Violations fail the build (see [Validation](../../guides/validation/)):

- `title`, `description` and other text props must not be empty or whitespace only.
- Dates are ISO 8601 (`2026-03-02`, `2026-03-02T09:00:00+01:00`) or `Date` objects.
  `dateModified` must not be before `datePublished`.
- `imageWidth`, `imageHeight`, `imageFormat` and `imageCaption` are only allowed together
  with `imageUrl`.
- `isPartOfHeadline` and `isPartOfUrl` are set together or not at all. `seriesPosition` needs
  `isPartOfUrl`.
- `authorUrl` and `authorId` are not supported when `authorName` is an array.
- A publisher logo needs a publisher name: `publisherLogo` (or `defaultArticlePublisher.logo`)
  without `publisherName` or `defaultArticlePublisher.name` fails the build.
- Without `publisherName` and without `defaultArticlePublisher` the output has no
  `publisher`; nothing is invented.

Props win over the integration defaults: `publisherName` replaces
`defaultArticlePublisher.name`, `publisherLogo` replaces `defaultArticlePublisher.logo.url`.
The two fall back independently, so a page can set only `publisherName` and still get the
configured logo.

Recommended fields (`dateModified`, `image`, `publisher`, `publisher.logo`) are reported after
the build when missing, unless `warnOnMissingRecommended` is off. See
[Integration options](../../reference/options/).
