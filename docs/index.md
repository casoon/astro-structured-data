---
title: Overview
description: What astro-structured-data does, where it stops, and how this documentation is organised.
order: 0
---

astro-structured-data is an Astro integration that renders schema.org structured data as
JSON-LD. You place a component such as `<ArticleSchema>` or `<EventSchema>` on a page and pass
your data as props; the component validates the props against a Zod schema and writes a
`<script type="application/ld+json">` block into the page. Nothing runs in the browser.

## Why

- **Rich results need structured data.** Prices, ratings, event dates, recipe times or job
  details only appear in search results when the page describes them as schema.org data, in
  the form Google and other search engines expect.
- **Hand-written JSON-LD fails silently.** A date in the wrong format, a currency symbol
  instead of a code or a missing required field produces no error. The markup is simply not
  used, and you find out weeks later in Search Console, if at all.
- **Your pages already have the data.** Titles, dates, prices and addresses sit in
  frontmatter, content collections or your CMS. Pass them as props instead of maintaining a
  second copy as JSON.
- **Checked where you can fix it.** Every component validates its props at build time. Wrong
  data stops the build with the component, the page and the field, so it never reaches
  production.

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
- A build report that checks every JSON-LD block after `astro build` and lists missing
  recommended fields per type, and sitemap hints (`changefreq`, `priority`) on the JSON-LD
  script for post-build sitemap generators.

## Where it stops

The package produces JSON-LD from the data you give it. It does not invent missing values,
crawl your content to guess data, or guarantee that Google shows a rich result: that decision
stays with the search engine. The generic `<Schema>` component outputs its object as given
and does not check its content.

## How the docs are organised

- **Getting started**: install the integration and put a first schema on a page.
- **Guides**: setups for blogs, shops, local businesses, events and job boards; validation,
  meta tags and sitemap hints, graph mode, content collections, the Dev Toolbar and build
  report, on-demand rendering, and upgrading from 1.x.
- **Components**: one page per component with an example, the JSON-LD it produces, every
  prop and the rules it checks.
- **Reference**: integration options, an overview of all components and the exported
  functions.

The package is on [npm](https://www.npmjs.com/package/@casoon/astro-structured-data).
