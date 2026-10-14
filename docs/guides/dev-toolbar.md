---
title: Dev Toolbar and build report
description: Inspect the structured data of a page while you develop, and read what the build reports about missing fields.
order: 5
---

The components stop wrong data. Two more tools help with data that is valid but incomplete:
a panel in the Astro Dev Toolbar while you develop, and a report after every build.

## The Structured Data panel

In `astro dev`, the integration adds a **Structured Data** panel to the Astro Dev Toolbar. It
reads every JSON-LD block of the current page, including the `@graph` block in
[graph mode](../graph-mode/), and shows one card per schema:

- **A search result preview** for the type: an article with thumbnail and date, a product
  with rating, price and stock, a breadcrumb trail, an event with date and venue, a job card
  with location, employment type and salary, a local business with phone, address and hours,
  a software app with rating, operating system and category.
- **Checks** for the fields the type needs and the ones Google recommends.
- **Copy JSON-LD**, a link to the [schema.org validator](https://validator.schema.org/) and
  the raw JSON.

The panel has checks for Article, BlogPosting, NewsArticle, FAQPage, Product, CollectionPage,
BreadcrumbList, LocalBusiness, Event, Organization, WebSite, ProfilePage, JobPosting,
SoftwareApplication, Recipe and VideoObject. Other types, for example from the generic
`<Schema>`, are listed as *Not checked*, never as *Valid*. For an `@type` array such as
`['BlogPosting', 'LearningResource']` the panel uses the first type it knows.

Remote job postings (`jobLocationType: 'TELECOMMUTE'`) are not asked for a `jobLocation`.
FAQPage markup is listed with its questions and a note that Google no longer shows FAQ rich
results (since May 2026); the markup itself stays valid schema.org.

The panel exists only in the dev server. It adds nothing to a build and no JavaScript to
your pages. Values from the page are inserted as text, so content from a CMS cannot inject
markup into the panel.

## The build report

After `astro build`, the integration reads every JSON-LD block in the HTML files the build
wrote.

- **Invalid JSON fails the build** with the file name. The components always write valid
  JSON; this catches blocks a layout writes by hand.
- **Missing recommended fields** are listed once per type and field, across all pages.
  Nested properties appear as dot paths:

```
[structured-data] Organization is missing recommended field "sameAs" — add it for richer search results. Disable with warnOnMissingRecommended: false
[structured-data] BlogPosting is missing recommended field "publisher.logo" — add it for richer search results. Disable with warnOnMissingRecommended: false
```

Recommended fields are optional: leaving them out never fails the build. Fields that a
configured default fills in, such as `defaultBrand` or `defaultArticlePublisher`, count as
present. Turn the list off with:

```js
structuredData({ warnOnMissingRecommended: false })
```

The same check is available in your own code as
[`validateRecommended`](../../reference/api/#validaterecommended), for example to report
missing fields in a CMS preview.

## Which tool for what

| Question | Where |
| --- | --- |
| Is the data valid at all? | The component, at render time ([Validation](../validation/)) |
| What does the page output, and how could it look in search? | Dev Toolbar panel |
| Which recommended fields are missing across the site? | Build report |
| Does Google accept the page for a rich result? | Google's Rich Results Test on the deployed page |
