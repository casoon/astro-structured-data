---
title: Integration options
description: Everything structuredData() accepts. Options are validated when the integration is created.
order: 1
---

```js
structuredData({ /* options */ })
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `siteUrl` | `string` | – | Absolute http(s) base URL. Falls back to Astro's `site`; one of the two is required |
| `useGraph` | `boolean` | `false` | Combine all schemas of a page into one `@graph` block; needs `<SchemaGraph />` in the layout |
| `generateMeta` | `boolean` | `false` | Generate head meta tags (canonical, `og:*`, `twitter:*` …) from the schemas |
| `siteName` | `string` | – | Site name for `og:site_name` |
| `locale` | `string` | – | Locale for `og:locale`, e.g. `de_DE` |
| `twitterSite` | `string` | – | Handle for `twitter:site`, e.g. `@my_site` |
| `twitterCreator` | `string` | – | Fallback handle for `twitter:creator` |
| `warnOnMissingRecommended` | `boolean` | `true` | Log build warnings when recommended schema.org fields are absent |
| `defaultLocalBusiness` | `LocalBusinessSchema` props | – | Site-wide defaults merged into `LocalBusinessSchema` |
| `defaultArticlePublisher` | `{ name: string; logo?: { url: string } }` | – | Default publisher for `ArticleSchema`, `WebPageSchema`, `OrganizationSchema` and the hiring organisation of `JobPostingSchema` |
| `defaultBrand` | `Brand \| string` | – | Default brand for `ProductSchema` |
| `defaultShippingDetails` | `OfferShippingDetails` | – | Default shipping details for `ProductSchema` |
| `defaultReturnPolicy` | `MerchantReturnPolicy` | – | Default return policy for `ProductSchema` |

Unknown keys and invalid values (a `locale` that is not like `de_DE`, a handle without `@`, a
relative `siteUrl`) fail the build.
