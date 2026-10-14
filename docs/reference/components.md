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
| [`ArticleSchema`](../../components/article/) | `BlogPosting` (default), `Article`, `NewsArticle` | `title`, `description`, `datePublished`, `authorName` |
| [`FAQSchema`](../../components/faq/) | `FAQPage` | `questions` |
| [`ProductSchema`](../../components/product/) | `Product` | `name`, `description`, `imageUrl` |
| [`LocalBusinessSchema`](../../components/local-business/) | `LocalBusiness` | `name` (or `defaultLocalBusiness.name`) |
| [`EventSchema`](../../components/event/) | `Event` | `name`, `startDate`; venue and/or `onlineUrl` by `attendanceMode` |
| [`OrganizationSchema`](../../components/organization/) | `Organization` | `name` (or `defaultArticlePublisher.name`) |
| [`WebSiteSchema`](../../components/website/) | `WebSite` | `name` |
| [`WebPageSchema`](../../components/webpage/) | `WebPage` | `title` |
| [`ProfilePageSchema`](../../components/profile-page/) | `ProfilePage` | `name` |
| [`CollectionPageSchema`](../../components/collection-page/) | `CollectionPage` | `name`, `description`, `products` |
| [`JobPostingSchema`](../../components/job-posting/) | `JobPosting` | `title`, `description`, `datePosted`, `hiringOrganizationName`; `jobLocation` unless remote |
| [`SoftwareAppSchema`](../../components/software-app/) | `SoftwareApplication` | `name` |
| [`RecipeSchema`](../../components/recipe/) | `Recipe` | `name`, `description`, `imageUrl`, `authorName`, `ingredients`, `instructions` |
| [`VideoSchema`](../../components/video/) | `VideoObject` | `name`, `description`, `thumbnailUrl`, `uploadDate`; `contentUrl` or `embedUrl` |
| [`BreadcrumbSchema`](../../components/breadcrumbs/) | `BreadcrumbList` | `items` |
| [`AutoBreadcrumbSchema`](../../components/breadcrumbs/) | `BreadcrumbList` from the URL path | – |
| [`Schema`](../../components/schema/) | any, from `item['@type']` | `item` |
| [`SchemaGraph`](../../components/schema/) | the page's `@graph` in graph mode | – |

Every component also accepts the sitemap hints `changefreq` and `priority`
(see [Meta tags and sitemap hints](../../guides/meta-tags/)).

Each component has its own page with an example, the JSON-LD it produces, the complete prop
table with types and defaults, and links to its schema.org type and Google's rich result
documentation.

## Generic schema

For schema.org types without a dedicated component, `<Schema>` outputs the object as given.
Only `@type` is required, and checking the content is up to you:

```astro
<Schema item={{ '@type': 'Course', name: 'Astro Basics', provider: { '@type': 'Organization', name: 'ACME' } }} />
```

## Examples

The [showcase](../../../showcase/) renders a selection of components with the package during
the build of this site, next to the source they come from.
