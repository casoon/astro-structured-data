---
title: Overview
description: What astro-structured-data does, where it stops, and how this documentation is organised.
order: 0
---

astro-structured-data is an Astro integration that renders schema.org structured data as
JSON-LD. You place a component such as `<ArticleSchema>` or `<EventSchema>` on a page and pass
your data as props; the component validates the props against a Zod schema and writes a
`<script type="application/ld+json">` block into the page. Nothing runs in the browser.

## What it covers

- Components for Article, FAQPage, Product, LocalBusiness, Event, Organization, WebSite,
  WebPage, ProfilePage, CollectionPage, JobPosting, SoftwareApplication, Recipe, VideoObject
  and BreadcrumbList, plus a generic `<Schema>` for any other type.
- Strict validation at build time: invalid or unknown props fail the build with the page,
  the component and the offending fields.
- Optional meta tags (canonical, Open Graph, Twitter) derived from the primary schema of the
  page, and an optional single `@graph` block per page.
- Zod schemas for content collections and forms, a check for recommended fields, and a Dev
  Toolbar panel that previews each schema as a rich result.

## Where it stops

The package produces JSON-LD from the data you give it. It does not invent missing values,
crawl your content to guess data, or guarantee that Google shows a rich result: that decision
stays with the search engine. The generic `<Schema>` component outputs its object as given
and does not check its content.

## How the docs are organised

- **Getting started**: install the integration and put a first schema on a page.
- **Guides**: validation, meta tags and sitemap hints, graph mode, content collections, and
  upgrading from 1.x.
- **Reference**: integration options, the component list and the exported functions. The
  complete prop tables are in the
  [README](https://github.com/casoon/astro-structured-data#components).

The product page is at [astro-structured-data.casoon.de](https://astro-structured-data.casoon.de/),
the package on [npm](https://www.npmjs.com/package/@casoon/astro-structured-data).
