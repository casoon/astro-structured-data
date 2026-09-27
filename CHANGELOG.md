# Changelog

All notable changes to this project are documented in this file. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Entries before 2.0.1 were
reconstructed from the commit history.

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
