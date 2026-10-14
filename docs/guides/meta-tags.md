---
title: Meta tags and sitemap hints
description: Derive canonical, Open Graph and Twitter tags from the page's schemas, and pass crawl hints to a sitemap generator.
order: 2
---

## generateMeta

With `generateMeta: true`, the integration derives `<meta>` and `<link>` elements from the
primary schema of the page and inserts them into `<head>`. This runs as middleware after the
page has fully rendered, so it sees every schema on the page regardless of where the
components are placed, including components that await data first.

- **Primary schema:** the most page-specific schema wins (Article types, Product, Recipe,
  VideoObject, Event, JobPosting, SoftwareApplication, ProfilePage, FAQPage, WebPage) before
  site-wide LocalBusiness and WebSite schemas. It drives title, description, image and
  `og:type`. An `@type` array such as `['BlogPosting', 'LearningResource']` matches by each of
  its types.
- **Page schemas:** page-level tags (`robots`, `hreflang` alternates, the canonical URL) come
  from the schemas describing the page itself, `WebPageSchema` and its variants, whichever
  content schema is primary. With several of them, such as a FAQPage and a WebPage, settings
  from each count and robots directives from all of them are kept. A `noindex` WebPage next to
  an Article stays `noindex`.
- **Your tags win:** tags the page already defines (same `name` or `property`, canonical,
  `hreflang`) are kept and not duplicated. If the page sets its own `og:image`, the schema
  image's width, height, type and alt are left out, and so is `twitter:image` (Twitter falls
  back to `og:image`).
- **Canonical and `og:url`** are built from `siteUrl` and the page path, or taken from a
  `WebPageSchema` `url` or an article's `mainEntityOfPage`. The `url` of an event, business or
  product is never used as the page's canonical. If the page sets its own canonical link,
  `og:url` uses that URL too, so both always agree.
- A page with a primary schema but no `</head>` fails the build.

HTML responses are buffered by the middleware rather than streamed.

### Generated tags

- Canonical, description, robots, author, `reading-time` (non-standard)
- Alternates: `<link rel="alternate" hreflang="…">` from `alternates`
- Open Graph: `og:title`, `og:description`, `og:image` with width, height, type and alt,
  `og:url`, `og:type`, `og:site_name`, `og:locale`, and for articles
  `article:published_time`, `article:modified_time`, `article:author` (author profile
  URLs; the name goes into `<meta name="author">`), `article:section`,
  `article:tag`
- Twitter: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`,
  `twitter:image:alt`, `twitter:site`, `twitter:creator`

Relative image URLs in the meta tags are resolved to absolute URLs with `siteUrl` the way a
browser would: `/image.jpg` against the origin, `image.jpg` against the site path. `siteName`,
`locale`, `twitterSite` and `twitterCreator` from the integration options fill the site-wide
tags.

## Robots and alternates

`WebPageSchema` accepts `robots` (e.g. `'noindex'`) and `alternates`
(`{ href, hreflang }[]`). Both only drive meta tags and are not part of the JSON-LD. They
apply even when another schema on the page, such as an article, is the primary one:

```astro
<WebPageSchema title="Draft" robots="noindex" />
<ArticleSchema title="Draft post" … />
```

The page gets the article's title and Open Graph tags plus `<meta name="robots" content="noindex">`.

## Sitemap hints

Every component, and the generic `<Schema>`, accepts `changefreq` and `priority`:

```astro
<ArticleSchema … changefreq="weekly" priority={0.8} />
```

They are written as data attributes on the JSON-LD `<script>` tag (on the `@graph` script in
graph mode), not into the JSON-LD. A page has one sitemap entry, so all schemas on a page must
agree; conflicting values, a `changefreq` outside the sitemap protocol values or a `priority`
outside 0–1 fail the build. Post-build sitemap generators such as `@casoon/astro-site-files`
can read these attributes from the HTML. Without such a generator they have no effect.
