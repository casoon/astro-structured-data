---
title: Components
description: All components exported from @casoon/astro-structured-data/components, with the schema.org type they produce and their required props.
order: 2
---

```astro
---
import { ArticleSchema, FAQSchema } from '@casoon/astro-structured-data/components';
---
```

| Component | schema.org type | Required props |
| --- | --- | --- |
| `ArticleSchema` | `BlogPosting` (default), `Article`, `NewsArticle` | `title`, `description`, `datePublished`, `authorName` |
| `FAQSchema` | `FAQPage` | `questions` |
| `ProductSchema` | `Product` | `name`, `description`, `imageUrl` |
| `LocalBusinessSchema` | `LocalBusiness` | `name` (or `defaultLocalBusiness.name`) |
| `EventSchema` | `Event` | `name`, `startDate`; venue and/or `onlineUrl` by `attendanceMode` |
| `OrganizationSchema` | `Organization` | `name` (or `defaultArticlePublisher.name`) |
| `WebSiteSchema` | `WebSite` | `name` |
| `WebPageSchema` | `WebPage` | `title` |
| `ProfilePageSchema` | `ProfilePage` | `name` |
| `CollectionPageSchema` | `CollectionPage` | `name`, `description`, `products` |
| `JobPostingSchema` | `JobPosting` | `title`, `description`, `datePosted`, `hiringOrganizationName`; `jobLocation` unless remote |
| `SoftwareAppSchema` | `SoftwareApplication` | `name` |
| `RecipeSchema` | `Recipe` | `name`, `description`, `imageUrl`, `authorName`, `ingredients`, `instructions` |
| `VideoSchema` | `VideoObject` | `name`, `description`, `thumbnailUrl`, `uploadDate`; `contentUrl` or `embedUrl` |
| `BreadcrumbSchema` | `BreadcrumbList` | `items` |
| `AutoBreadcrumbSchema` | `BreadcrumbList` from the URL path | – |
| `Schema` | any, from `item['@type']` | `item` |
| `SchemaGraph` | the page's `@graph` in graph mode | – |

Every component also accepts the sitemap hints `changefreq` and `priority`
(see [Meta tags and sitemap hints](../../guides/meta-tags/)).

The complete prop tables, with types and defaults, are in the
[README](https://github.com/casoon/astro-structured-data#components). Each component there
links to its schema.org type and to Google's rich result documentation.

## Generic schema

For schema.org types without a dedicated component, `<Schema>` outputs the object as given.
Only `@type` is required, and checking the content is up to you:

```astro
<Schema item={{ '@type': 'Course', name: 'Astro Basics', provider: { '@type': 'Organization', name: 'ACME' } }} />
```

## Examples

The [showcase](../../../showcase/) renders a selection of components with the package during
the build of this site, next to the source they come from.
