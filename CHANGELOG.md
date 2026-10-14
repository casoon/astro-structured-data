# Changelog

All notable changes to this project are documented in this file. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Entries before 2.0.1 were
reconstructed from the commit history.

## [2.1.0] - 2026-10-14

### Breaking

- `ProductSchema` validates the structure of `offers`, `brand`, `shippingDetails` and
  `returnPolicy`, as do the options `defaultBrand`, `defaultShippingDetails` and
  `defaultReturnPolicy`: prices, ISO 4217 currencies, ISO 3166 country codes, schema.org
  enumeration values, delivery day ranges, return windows. An `Offer` needs `price` and
  `priceCurrency` or a `priceSpecification` with both. A shipping rate needs `value` or
  `maxValue`. A brand `logo` may be a URL or an `ImageObject`. Data that passed as a plain object before may now fail the build. Further
  schema.org properties on these objects stay allowed.

### Fixed

- Meta tags: `robots`, `hreflang` alternates and the canonical URL come from the page schemas
  (`WebPageSchema` and its variants, e.g. a FAQPage next to a WebPage) even when an Article,
  Product or other content schema is primary. Robots directives from all of them are kept. A
  `noindex` WebPage next to an Article no longer loses its `noindex`.
- `ProductSchema`: shipping details and return policies set on an individual offer win over the
  `shippingDetails` / `returnPolicy` props and the configured defaults, which only fill in.
- `ProductSchema` outputs the nested schema.org types (`MonetaryAmount`, `DefinedRegion`,
  `ShippingDeliveryTime`, `QuantitativeValue`, `UnitPriceSpecification`, …) when the input
  leaves them out, as in Google's merchant listing examples.
- Root-relative image and video URLs in meta tags resolve against the origin when `siteUrl`
  has a sub-path (`/image.jpg` on `https://example.com/base/` → `https://example.com/image.jpg`).
- `og:url` follows a canonical link the page sets itself, so both always agree.
- Meta tag insertion and the build-time check read HTML with a tokenizer that follows the
  WHATWG rules (as the html5-parser crate does) instead of regular expressions. Markup inside
  comments, scripts (including JavaScript strings), styles, `<title>` or `<textarea>` is no
  longer taken for real tags: it neither suppresses generated meta tags nor marks the end of
  `<head>`, and it is not checked as JSON-LD.
- Tags and `</head>` inside a `<template>` no longer count as the page's own (template content
  is inert in browsers).
- `video:duration` and the reading time understand ISO 8601 durations with days and weeks
  (`P1DT1H`); durations with years or months have no fixed length and are left out.
- Graph mode deduplicates identical schemas that use an `@type` array.
- When the page sets its own `og:image`, the generated meta tags add no width, height, type or
  alt of the schema's (different) image, and no `twitter:image`.
- `article:author` lists the authors' profile URLs, as Open Graph expects, instead of their
  names; without an author URL it is left out. The name stays in `<meta name="author">`.
- `AutoBreadcrumbSchema` decodes percent-encoded segments for names, `labels` and
  `ignoreSegments` (`/%C3%BCber-uns/` → "Über Uns"); URLs keep the encoded path.
- Graph mode keeps a custom `@context` (own term mappings via `<Schema>`) as an embedded
  context on its node instead of dropping it; only the schema.org context moves to the root.
- `@type` arrays are recognised when choosing the primary schema and in the build-time check.
- The build-time check finds JSON-LD blocks in every valid attribute spelling (single quotes,
  no quotes, any case); before, `type='application/ld+json'` was skipped entirely. Every item of
  a top-level JSON-LD array is checked.
- `validateRecommended` no longer asks for `price` and `priceCurrency` when `offers` or
  `priceRange` is set.
- An invalid date prop names the expected format ("Must be an ISO 8601 date …") instead of a
  generic "Invalid input".

### Security

- Dev Toolbar: schema values (descriptions, FAQ answers, addresses, raw script content) are
  inserted as text instead of HTML, so content from a CMS can no longer inject markup into
  the panel.

### Changed

- Dev Toolbar: types without checks are shown as *Not checked* instead of *Valid*; remote job
  postings (`jobLocationType: 'TELECOMMUTE'`) no longer warn about a missing `jobLocation`;
  Article fields are labelled as recommended, not required; the FAQ preview notes that Google
  retired FAQ rich results in May 2026; `@type` arrays are shown and checked by their known
  type instead of failing as "Invalid JSON".

### Added

- `validateRecommended(type, data, options?)` takes the integration options as third argument
  and counts configured defaults (`defaultBrand`, `defaultArticlePublisher`,
  `defaultLocalBusiness`).

## [2.0.1] - 2026-09-10

### Fixed

- Strict prop validation ignores Astro's own attributes (`slot`, `data-astro-*`), so
  `<ArticleSchema slot="head" />` works again.

## [2.0.0] - 2026-09-10

### Breaking

- Components validate their props against the Zod schemas at render time and fail the build
  on invalid or unknown props: ISO 8601 dates and durations, ISO 4217 currencies, http(s) or
  root-relative URLs, non-empty text, cross-field rules.
- Integration options are validated strictly; a missing site URL throws.
- No invented values: `LocalBusinessSchema` and `OrganizationSchema` need a name,
  `JobPostingSchema` a hiring organisation; `employmentType`, `operatingSystem`,
  `applicationCategory`, `reviewCount` and the salary unit are no longer defaulted;
  `baseSalary.unit` is required.
- Meta tags and the `@graph` block are produced by a middleware after the page has fully
  rendered. HTML responses are buffered rather than streamed; tags the page defines win.
- `<SchemaGraph />` only marks where the `@graph` goes; in graph mode a page with schemas must
  render it exactly once.
- `EventSchema`: venue props depend on `attendanceMode`.

### Added

- `EventSchema` `onlineUrl`, output as `VirtualLocation` (Online) or `Place` plus
  `VirtualLocation` (Mixed).
- `changefreq` and `priority` sitemap hints on every component; conflicting hints fail the
  build.
- Invalid JSON-LD in the build output fails the build.
- Test suite with vitest and the Astro container API, plus end-to-end tests against a real
  static build, the dev server and Node SSR.

### Security

- JSON-LD output is escaped so content cannot break out of the script block.

## [1.5.1] - 2026-07-02

### Fixed

- Graph store and meta tag deduplication are scoped to the page path, so schemas no longer
  leak across pages in static builds.

## [1.5.0] - 2026-06-23

### Added

- Astro 7 support (peer dependency `^5.0.0 || ^6.0.0 || ^7.0.0`).

### Changed

- Dependencies updated to zod 4, schema-dts 2 and TypeScript 6.

## [1.4.1] - 2026-06-12

### Added

- `JobPostingSchema`: `identifier`, `directApply`, `jobLocationType`,
  `applicantLocationRequirements`; `jobLocation` optional for remote jobs.
- `LocalBusinessSchema`: `url`, `description`, `email`, `sameAs`.
- `EventSchema`: `url`, `organizer`, `performer`.
- `VideoSchema`: `publisher`; `contentUrl` or `embedUrl` required.
- `SoftwareAppSchema`: `description`, `url`.

## [1.4.0] - 2026-06-02

### Added

- `RecipeSchema` and `VideoSchema`, with Dev Toolbar previews and build warnings.

## [1.3.0] - 2026-06-02

### Added

- `validateRecommended()` and the `warnOnMissingRecommended` build check.
- Zod schemas for all components.
- `AutoBreadcrumbSchema`: `ignoreSegments`, `prependBreadcrumbs`, `appendBreadcrumbs`.
- `calculateReadingTime` in the `./utils` export.
- Dev Toolbar: rich result previews, copy JSON-LD, schema.org validator link.

## [1.2.0] - 2026-06-01

### Added

- `WebPageSchema`; more `ArticleSchema` props.

## [1.1.3] - 2026-06-01

### Fixed

- Meta tags are generated only for primary schema types, without duplicates.

## [1.1.1] - 2026-06-01

### Added

- Options `siteName`, `locale`, `twitterSite`, `twitterCreator`.

## [1.1.0] - 2026-06-01

### Added

- `generateMeta` option: meta tags generated from the schemas.

## [1.0.1] - 2026-06-01

### Fixed

- The `./components` export points to compiled JavaScript, fixing Rollup errors in consuming
  projects.

## [1.0.0] - 2026-06-01

### Added

- First release: components for Article, FAQ, Product, LocalBusiness, Event, Organization,
  WebSite, Breadcrumb, ProfilePage, CollectionPage, JobPosting and SoftwareApp.
