---
title: Setups by kind of site
description: Which components go where on a blog, a shop, a local business site, an event page or a job board, and which options to set once.
order: 0
---

Most sites need two layers: site-wide data that is the same on every page (the site, the
organisation behind it, a shop's shipping terms) and page data (the article, the product, the
event). Site-wide data goes into the integration options or the base layout, page data into
the page or its layout. The setups below are starting points; each component page lists every
prop.

## Blog or magazine

The site and the publisher once in the base layout, the article and its breadcrumb trail on
each post. The reading time can be computed from the post itself.

```js
// astro.config.mjs
structuredData({
  generateMeta: true,
  defaultArticlePublisher: { name: 'Example Blog', logo: { url: 'https://example.com/logo.png' } },
})
```

```astro
---
// src/layouts/Base.astro
import { OrganizationSchema, WebSiteSchema } from '@casoon/astro-structured-data/components';
---
<WebSiteSchema name="Example Blog" />
<OrganizationSchema sameAs={['https://mastodon.social/@example']} />
```

```astro
---
// src/layouts/Post.astro
import { ArticleSchema, AutoBreadcrumbSchema } from '@casoon/astro-structured-data/components';
import { calculateReadingTime } from '@casoon/astro-structured-data/utils';
const { post } = Astro.props;
const { wordCount, readingTimeMinutes } = calculateReadingTime(post.body);
---
<ArticleSchema
  title={post.data.title}
  description={post.data.description}
  datePublished={post.data.date}
  authorName={post.data.author}
  imageUrl={post.data.cover}
  keywords={post.data.tags}
  wordCount={wordCount}
  readingTimeMinutes={readingTimeMinutes}
/>
<AutoBreadcrumbSchema labels={{ blog: 'Blog' }} />
```

`OrganizationSchema` and `ArticleSchema` take the publisher from `defaultArticlePublisher`, so
it is written once. `AutoBreadcrumbSchema` builds the trail from the URL path. With
`generateMeta`, the article also drives the page's Open Graph and Twitter tags, including
`article:published_time` and the reading time.

Components: [ArticleSchema](../../components/article/),
[OrganizationSchema](../../components/organization/),
[WebSiteSchema](../../components/website/), [AutoBreadcrumbSchema](../../components/breadcrumbs/).

## Shop

Brand, shipping and returns usually apply to the whole shop: set them once, and every
`ProductSchema` adds them to its offer.

```js
// astro.config.mjs
structuredData({
  generateMeta: true,
  defaultBrand: 'Gadget Co',
  defaultShippingDetails: {
    shippingRate: { value: 4.95, currency: 'EUR' },
    shippingDestination: { addressCountry: 'DE' },
    deliveryTime: {
      handlingTime: { minValue: 0, maxValue: 1, unitCode: 'DAY' },
      transitTime: { minValue: 1, maxValue: 3, unitCode: 'DAY' },
    },
  },
  defaultReturnPolicy: {
    applicableCountry: 'DE',
    returnPolicyCategory: 'MerchantReturnFiniteReturnWindow',
    merchantReturnDays: 30,
    returnMethod: 'ReturnByMail',
    returnFees: 'FreeReturn',
  },
})
```

```astro
<ProductSchema
  name="Super Gadget"
  description="The best gadget ever"
  imageUrl="/images/gadget.jpg"
  price={29.99}
  priceCurrency="EUR"
  availability="InStock"
  sku="SG-001"
  ratingValue={4.5}
  reviewCount={128}
/>
```

The defaults are checked like the matching props: a currency must be an ISO 4217 code, a
country an ISO 3166 code, a finite return window needs `merchantReturnDays`. For several
offers, sale prices or shipping per offer, pass `offers` instead of `price`; for a price range
across variants, `priceRange`. Shipping details and return policies on an individual offer
win over the defaults. Category pages use `CollectionPageSchema`.

Components: [ProductSchema](../../components/product/),
[CollectionPageSchema](../../components/collection-page/).

## Local business

The business data lives in the configuration and is reused wherever `<LocalBusinessSchema />`
appears, typically in the base layout or on the contact page.

```js
// astro.config.mjs
structuredData({
  defaultLocalBusiness: {
    name: 'My Shop',
    telephone: '+49 30 1234567',
    address: {
      streetAddress: 'Hauptstraße 42',
      addressLocality: 'Berlin',
      postalCode: '10119',
      addressCountry: 'DE',
    },
    geo: { latitude: 52.53, longitude: 13.41 },
    openingHours: ['Mo-Fr 09:00-18:00', 'Sa 10:00-16:00'],
  },
})
```

```astro
<LocalBusinessSchema />
```

Props on a page override the defaults, e.g. a different `telephone` for a branch.

Component: [LocalBusinessSchema](../../components/local-business/).

## Events

Venue, online stream or both, chosen with `attendanceMode`. An online event outputs its stream
URL as a `VirtualLocation`, a hybrid event both the venue and the stream.

```astro
<EventSchema
  name="Astro Live Webinar"
  description="Structured data in Astro, live with Q&A."
  startDate="2026-10-20T17:00:00+02:00"
  endDate="2026-10-20T18:30:00+02:00"
  attendanceMode="Online"
  onlineUrl="https://example.com/live"
  organizer={{ name: 'Example GmbH', url: 'https://example.com' }}
  price={0}
  priceCurrency="EUR"
/>
```

An end date before the start date fails the build.

Component: [EventSchema](../../components/event/).

## Job board

On-site jobs take a `jobLocation` address; fully remote positions say where applicants may
live instead.

```astro
<JobPostingSchema
  title="Remote Frontend Engineer"
  description="<p>Fully remote position open worldwide.</p>"
  hiringOrganizationName="ACME GmbH"
  datePosted="2026-09-01"
  validThrough="2026-12-31"
  jobLocationType="TELECOMMUTE"
  applicantLocationRequirements="DE"
  employmentType="FULL_TIME"
  baseSalary={{ value: 72000, currency: 'EUR', unit: 'YEAR' }}
/>
```

Component: [JobPostingSchema](../../components/job-posting/).

## Content from collections

Wherever the data comes from a content collection, validate the frontmatter with the schema
the component uses. Wrong data is then reported in the file where it is written, before any
page renders. See [Content collections](../content-collections/).

## Several schemas on one page

A page can carry as many schemas as it describes: a post with its article, breadcrumb trail
and FAQ, a product page with the product and its breadcrumbs. Each component writes its own
block. To link them into one document, turn on [graph mode](../graph-mode/). With
`generateMeta`, the most page-specific schema drives the meta tags; see
[Meta tags](../meta-tags/).
