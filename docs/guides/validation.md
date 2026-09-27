---
title: Validation
description: Which rules the components enforce at build time, and what the build reports afterwards.
order: 1
---

Invalid structured data is never rendered. Every component validates its props against its
Zod schema at render time. Any violation throws and fails the build (or the request, in SSR)
with a message naming the component, the page and the offending fields.

## Rules

- **Unknown props are rejected**, so typos cannot silently drop data. Attributes that belong
  to Astro itself, `slot` (e.g. `<ArticleSchema slot="head" />`) and `data-astro-*`, are
  ignored.
- **Formats:** dates are ISO 8601 (`2026-06-01`, `2026-06-01T18:00:00+02:00`) or `Date`
  objects; durations are ISO 8601 (`PT1H30M`); currencies are ISO 4217 (`EUR`); URLs are
  absolute `http(s)` URLs or root-relative paths (`/img.jpg`); text fields must not be empty.
- **Cross-field rules**, e.g. `price` and `priceCurrency` only together, `ratingValue` and
  `reviewCount` only together, image dimensions only with an image, an end date not before
  its start date, at most one of `offers`, `priceRange` and `price`.
- **Location follows attendance mode** for events: `Offline` needs a venue name and address,
  `Online` needs `onlineUrl` and allows no venue (output as `VirtualLocation`), `Mixed` needs
  both.
- **Job locations** follow Google's rules: on-site jobs need `jobLocation`, fully remote jobs
  set `jobLocationType="TELECOMMUTE"` plus `applicantLocationRequirements`.
- **Page-level checks:** all schemas on a page must agree on their sitemap hints, and in graph
  mode a page with schemas must render `<SchemaGraph />` exactly once.

## No invented values

Components never fill in placeholder data. Where schema.org needs a value, such as the name of
an organisation, it comes from a prop or a configured default (`defaultLocalBusiness`,
`defaultArticlePublisher`), otherwise the build fails. Fields like `employmentType`,
`operatingSystem` or `applicationCategory` are omitted when not set.

## Output escaping

JSON-LD output is escaped so that content cannot break out of the `<script>` block.

## After the build

The integration scans every generated HTML file for JSON-LD blocks. A block that is not valid
JSON fails the build. With `warnOnMissingRecommended` (on by default) it also logs one warning
per missing recommended field and type, nested properties as dot paths:

```
[structured-data] Organization is missing recommended field "sameAs" — add it for richer search results.
```

Recommended fields are optional props that Google's rich result guidelines list as beneficial;
leaving them out does not break validation. Turn the warnings off with
`structuredData({ warnOnMissingRecommended: false })`.
