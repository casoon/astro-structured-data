# Changelog

All notable changes to this project are documented in this file. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Entries before 2.0.1 were
reconstructed from the commit history.

## [Unreleased]

### Changed

- **Pages:** the project site uses the current shared theme (0.12.10).


## [2.4.1] - 2026-11-11

### Changed

- **Docs:** the README is a short overview that links to the documentation on the project site;
  everything it explained before is in the docs. The graph mode and on-demand rendering guides
  show how graph mode works and the measured time to first byte as diagrams.
- **npm:** the package's homepage is the project site on GitHub Pages instead of the retired
  product page.
- **Pages:** the project site uses the current shared theme (0.12.10).
- **Project site:** search result cards and source labels meet 4.5:1 contrast again with the
  current theme, and the terminal scenes are rebuilt with castwright 0.6.

## [2.4.0] - 2026-11-11

### Changed

- **Dependencies:** zod 4.6.7 and schema-dts 2.1.0 in the lockfile; tests run on Astro 7.4.
- **Middleware:** without `useGraph` and `generateMeta`, pages rendered on demand stream instead
  of being buffered; sitemap-hint conflicts are still detected, and an error found after the first
  chunk breaks off the response.
  Details: [On-demand rendering](https://casoon.github.io/astro-structured-data/docs/guides/on-demand-rendering/).
- **Pages:** the project site uses the current shared theme (0.12.6), chartlet 0.23 and Astro 7.4.
- **Project site:** the footer follows the page language instead of always showing German text,
  and the start page now carries a release teaser and an FAQ (theme 0.11.1).
- **WebSiteSchema:** docs and README describe `searchQueryInput` as schema.org `SearchAction`
  markup; Google no longer shows the sitelinks search box (since 21 November 2024).
- **Contributors:** `npm run test:compat` runs the full test suite against Astro 5 and Astro 6
  with their matching Node adapter; `npm run bench:ssr` measures time to first byte and memory of
  on-demand pages.

### Fixed

- **ArticleSchema:** `mainEntityOfPage` refers to the same page `@id` as a `WebPageSchema` with an
  explicit `url`, whichever component renders first and with or without graph mode.
- **Build check:** JSON-LD blocks containing `null` no longer crash the build; other entries that
  are not objects are reported with their file.
- **Dev Toolbar:** offers are checked by their own type, also inside an `offers` array, and prices
  in `priceSpecification` are accepted.
- **LocalBusinessSchema:** `parentOrganization` and `subOrganization` from `defaultLocalBusiness`
  apply when the props are not set.
- **Middleware:** pages rendered through a rewrite (`next('/target')`, `context.rewrite()`) keep
  their JSON-LD graph and generated meta tags.
- **WebSiteSchema:** the SearchAction `query-input` names the same placeholder as `urlTemplate`,
  whatever `searchQueryInput` is.

## [2.3.1] - 2026-10-26

### Added

- **Releases:** the Release workflow publishes the package to npm through trusted publishing, after approval in the `npm` environment — no npm token is stored anywhere and the package carries a provenance statement.

### Changed

- **Project site:** a shorter hero title, and a 54-column terminal scene on phones so the build
  output stays readable; theme 0.8.3.

## [2.3.0] - 2026-10-24

### Added

- **Linked data:** `id` outputs the `@id` of the main entity on `ArticleSchema`, `ProductSchema`,
  `EventSchema`, `RecipeSchema`, `VideoSchema`, `SoftwareAppSchema`, `JobPostingSchema`,
  `CollectionPageSchema`, `FAQSchema` and `BreadcrumbSchema`, so other nodes can link to it.
  Details: [Graph mode](https://casoon.github.io/astro-structured-data/docs/guides/graph-mode/#linking-nodes).
- **Linked data:** relations take a reference with `id` or `url` and a free `type`: `isPartOf` /
  `hasPart` (articles, pages, recipes, videos, apps, collection pages), product variants and
  related products, `parentOrganization` / `subOrganization`, `superEvent` / `subEvent`.
  Details: [Graph mode](https://casoon.github.io/astro-structured-data/docs/guides/graph-mode/#linking-nodes).

### Changed


- **Contributors:** the dev toolbar app is split into modules under `src/toolbar/`; its
  behavior is unchanged.
- **Contributors:** the showcase on the project page shows each example as a search result
  illustration above its JSON-LD.
- **Contributors:** `demo/` is reduced to one playground page with all schema components; the
  project page examples live in `examples/`.

## [2.2.0] - 2026-10-23

### Added

- **Linked data:** `@id` for the entities other items link to, so in graph mode all items point
  to the same organization, website, business or person: `publisherId`, `publisher.id`, `id`,
  `organizer.id`, `performer.id`, `hiringOrganizationId`, `authorId` and
  `defaultArticlePublisher.id` / `defaultLocalBusiness.id` on the matching components.

### Changed

- **WebPageSchema:** outputs its URL as `@id`, the same value `ArticleSchema` uses for
  `mainEntityOfPage`, so in graph mode both refer to one node.

## [2.1.0] - 2026-10-14

### Breaking

- **ProductSchema:** validates `offers`, `brand`, `shippingDetails` and `returnPolicy` (and the
  `defaultBrand`, `defaultShippingDetails`, `defaultReturnPolicy` options): prices, ISO 4217
  currencies, ISO 3166 country codes, schema.org enumerations, day ranges. An `Offer` needs
  `price` and `priceCurrency` or a `priceSpecification`. Data that passed before may now fail
  the build.

### Added

- **Utils:** `validateRecommended(type, data, options?)` counts configured defaults
  (`defaultBrand`, `defaultArticlePublisher`, `defaultLocalBusiness`).

### Changed

- **Dev Toolbar:** types without checks show *Not checked* instead of *Valid*; remote jobs
  (`TELECOMMUTE`) no longer warn about `jobLocation`; Article fields are labelled recommended;
  the FAQ preview notes that Google retired FAQ rich results in May 2026; `@type` arrays are
  checked by their known type.

### Fixed

- **AutoBreadcrumbSchema:** decodes percent-encoded segments for names, `labels` and
  `ignoreSegments`; URLs keep the encoded path.
- **Build check:** finds JSON-LD in every valid attribute spelling (before,
  `type='application/ld+json'` was skipped), checks every item of a top-level array and
  recognises `@type` arrays.
- **Graph mode:** deduplicates identical schemas with an `@type` array and keeps a custom
  `@context` on its node instead of dropping it.
- **HTML parsing:** meta tag insertion and the build check use a WHATWG tokenizer instead of
  regular expressions. Markup inside comments, scripts, styles, `<title>`, `<textarea>` or
  `<template>` is no longer taken for real tags.
- **Meta tags:** `robots`, `hreflang` and the canonical URL come from the page schemas
  (e.g. a FAQPage next to a WebPage) even when an Article or Product is primary; robots
  directives are merged, so a `noindex` WebPage keeps its `noindex`.
- **Meta tags:** root-relative image and video URLs resolve against the origin when `siteUrl`
  has a sub-path, and `og:url` follows a canonical link the page sets itself.
- **Meta tags:** `video:duration` and the reading time accept ISO 8601 durations with days and
  weeks; durations with years or months are left out.
- **Meta tags:** a page's own `og:image` suppresses the schema image's size, type, alt and
  `twitter:image`.
- **Meta tags:** `article:author` lists the authors' profile URLs, not their names; the name
  stays in `<meta name="author">`.
- **ProductSchema:** shipping details and return policies on an offer win over the props and
  configured defaults, which only fill in; missing nested types (`MonetaryAmount`,
  `DefinedRegion`, …) are added as in Google's merchant listing examples.
- **Validation:** an invalid date names the expected format; `validateRecommended` no longer
  asks for `price` and `priceCurrency` when `offers` or `priceRange` is set.

### Security

- **Dev Toolbar:** schema values are inserted as text instead of HTML, so CMS content cannot
  inject markup into the panel.

## [2.0.1] - 2026-09-10

### Fixed

- **Validation:** strict prop validation ignores Astro's own attributes (`slot`,
  `data-astro-*`), so `<ArticleSchema slot="head" />` works again.

## [2.0.0] - 2026-09-10

### Breaking

- **EventSchema:** venue props depend on `attendanceMode`.
- **Graph mode:** a page with schemas must render `<SchemaGraph />` exactly once; it only marks
  where the `@graph` goes.
- **Middleware:** meta tags and the `@graph` block are produced after the page has rendered;
  HTML responses are buffered, not streamed, and tags the page defines win.
- **Options:** validated strictly; a missing site URL throws.
- **Schema:** no invented values: `LocalBusinessSchema` and `OrganizationSchema` need a name,
  `JobPostingSchema` a hiring organisation and `baseSalary.unit`; `employmentType`,
  `operatingSystem`, `applicationCategory` and `reviewCount` are no longer defaulted.
- **Validation:** props are validated against the Zod schemas at render time; invalid or
  unknown props fail the build.

### Added

- **Build check:** invalid JSON-LD in the build output fails the build.
- **Contributors:** vitest suite with the Astro container API and end-to-end tests against a
  static build, the dev server and Node SSR.
- **EventSchema:** `onlineUrl`, output as `VirtualLocation` (Online) or `Place` plus
  `VirtualLocation` (Mixed).
- **Sitemap:** `changefreq` and `priority` hints on every component; conflicting hints fail
  the build.

### Security

- **JSON-LD:** output is escaped so content cannot break out of the script block.

## [1.5.1] - 2026-07-02

### Fixed

- **Graph mode:** graph store and meta tag deduplication are scoped to the page path, so
  schemas no longer leak across pages in static builds.

## [1.5.0] - 2026-06-23

### Added

- **Astro:** Astro 7 support (peer dependency `^5.0.0 || ^6.0.0 || ^7.0.0`).

### Changed

- **Dependencies:** updated to zod 4, schema-dts 2 and TypeScript 6.

## [1.4.1] - 2026-06-12

### Added

- **EventSchema:** `url`, `organizer`, `performer`.
- **JobPostingSchema:** `identifier`, `directApply`, `jobLocationType`,
  `applicantLocationRequirements`; `jobLocation` optional for remote jobs.
- **LocalBusinessSchema:** `url`, `description`, `email`, `sameAs`.
- **SoftwareAppSchema:** `description`, `url`.
- **VideoSchema:** `publisher`; `contentUrl` or `embedUrl` required.

## [1.4.0] - 2026-06-02

### Added

- **RecipeSchema, VideoSchema:** new components, with Dev Toolbar previews and build warnings.

## [1.3.0] - 2026-06-02

### Added

- **AutoBreadcrumbSchema:** `ignoreSegments`, `prependBreadcrumbs`, `appendBreadcrumbs`.
- **Build check:** `validateRecommended()` and the `warnOnMissingRecommended` option.
- **Dev Toolbar:** rich result previews, copy JSON-LD, schema.org validator link.
- **Utils:** `calculateReadingTime` in the `./utils` export.
- **Validation:** Zod schemas for all components.

## [1.2.0] - 2026-06-01

### Added

- **ArticleSchema:** more props.
- **WebPageSchema:** new component.

## [1.1.3] - 2026-06-01

### Fixed

- **Meta tags:** generated only for primary schema types, without duplicates.

## [1.1.1] - 2026-06-01

### Added

- **Options:** `siteName`, `locale`, `twitterSite`, `twitterCreator`.

## [1.1.0] - 2026-06-01

### Added

- **Options:** `generateMeta` generates meta tags from the schemas.

## [1.0.1] - 2026-06-01

### Fixed

- **Packaging:** the `./components` export points to compiled JavaScript, fixing Rollup errors
  in consuming projects.

## [1.0.0] - 2026-06-01

### Added

- **Schema:** first release: components for Article, FAQ, Product, LocalBusiness, Event,
  Organization, WebSite, Breadcrumb, ProfilePage, CollectionPage, JobPosting and SoftwareApp.
