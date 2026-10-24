---
title: Graph mode
description: Merge all schemas of a page into one @graph block.
order: 3
---

By default every component writes its own JSON-LD block. With `useGraph: true`, all schemas of
a page are combined into a single block with an `@graph` array:

```js
structuredData({ useGraph: true })
```

Place `<SchemaGraph />` once in your base layout where the block should appear, for example at
the end of `<body>`:

```astro
---
import { SchemaGraph } from '@casoon/astro-structured-data/components';
---
<body>
  <slot />
  <SchemaGraph />
</body>
```

`<SchemaGraph />` only marks the position. The `@graph` is filled in by the integration's
middleware after the whole page has rendered, so schema components can sit anywhere: before or
after it, and in components that await data. Schemas are collected per page path, so nothing
leaks from one page into the next during a static build.

A page with schemas but without `<SchemaGraph />`, or with more than one, fails the build
so no schema goes missing. Without `useGraph`, `<SchemaGraph />` renders nothing.

The block carries the schema.org `@context`. A different `@context` set via `<Schema>`, for
example own term mappings, stays on its node as an embedded context, so the data means the same
with and without graph mode.

## Linking nodes

Nodes in the graph refer to each other by `@id`. Give the entities others point to an `id`
(`WebSiteSchema`, `OrganizationSchema`, `LocalBusinessSchema`, ...) and the main entity of a
page one too (`ArticleSchema`, `ProductSchema`, `EventSchema`, `RecipeSchema`, `VideoSchema`,
`SoftwareAppSchema`, `JobPostingSchema`, `CollectionPageSchema`, `FAQSchema`,
`BreadcrumbSchema`). The relations take a reference with `id` or `url` and a free `type`:

| Component | Props |
| --- | --- |
| `ArticleSchema`, `RecipeSchema`, `VideoSchema`, `SoftwareAppSchema`, `CollectionPageSchema`, `WebPageSchema` | `isPartOf`, `hasPart` |
| `ProductSchema` | `isVariantOf`, `hasVariant`, `isRelatedTo`, `isSimilarTo`, `isAccessoryOrSparePartFor`, `isConsumableFor` |
| `OrganizationSchema`, `LocalBusinessSchema` | `parentOrganization`, `subOrganization` |
| `EventSchema` | `superEvent`, `subEvent` |
