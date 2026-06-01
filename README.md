# @casoon/astro-structured-data

Astro integration for automatic structured data (JSON-LD) generation. Supports Articles, FAQs, Products, Breadcrumbs, Local Businesses, Events, Organizations, and more — with full TypeScript and Zod validation.

## Installation

```bash
npm install @casoon/astro-structured-data
```

## Setup

Add the integration to your `astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import structuredData from '@casoon/astro-structured-data';

export default defineConfig({
  site: 'https://example.com', // used automatically by the integration
  integrations: [
    structuredData({
      generateMeta: true,
      siteName: 'My Awesome Website',
      locale: 'de_DE',
      twitterSite: '@mywebsite',
    }),
  ],
});
```

If you don't set `site` in your Astro config, pass `siteUrl` explicitly:

```js
structuredData({ 
  siteUrl: 'https://example.com',
  generateMeta: true,
})
```

## Configuration

| Option | Type | Required | Description |
|---|---|---|---|
| `siteUrl` | `string` | No | Absolute base URL — falls back to Astro's `site` config |
| `useGraph` | `boolean` | No | Wrap all schemas in a `@graph` array |
| `generateMeta` | `boolean` | No | Generate standard HTML head meta tags (og:*, twitter:*, canonical, etc.) from schemas |
| `siteName` | `string` | No | Global site name used for `og:site_name` |
| `locale` | `string` | No | Global locale used for `og:locale` (e.g. `de_DE`) |
| `twitterSite` | `string` | No | Twitter site handle used for `twitter:site` (e.g. `@my_site`) |
| `twitterCreator` | `string` | No | Fallback Twitter creator handle used for `twitter:creator` (e.g. `@author`) |
| `defaultLocalBusiness` | `LocalBusiness` | No | Site-wide local business defaults merged into `LocalBusinessSchema` |
| `defaultArticlePublisher` | `Organization` | No | Default publisher for `ArticleSchema` and `OrganizationSchema` |
| `defaultBrand` | `Brand \| string` | No | Default brand for `ProductSchema` |
| `defaultShippingDetails` | `OfferShippingDetails` | No | Default shipping details for `ProductSchema` |
| `defaultReturnPolicy` | `MerchantReturnPolicy` | No | Default return policy for `ProductSchema` |

## Automated SEO & Sitemap Integration

When `generateMeta: true` is enabled, the integration automatically derives and renders corresponding `<meta>` and `<link>` elements inside the page `<head>` during render time:
* **Canonical**: `<link rel="canonical" href="...">`
* **Description**: `<meta name="description" content="...">`
* **Robots**: `<meta name="robots" content="...">` (derived from `item.robots` or `item.noindex` / `item.nofollow`)
* **Author**: `<meta name="author" content="...">` (derived from schema `item.author`)
* **Reading Time**: `<meta name="reading-time" content="...">` (non-standard; derived from `item.readingTime` or parsed from ISO duration `item.timeRequired`)
* **Alternates (hreflang)**: `<link rel="alternate" hreflang="..." href="...">` (extracted from `item.alternates` or schema translations)
* **OpenGraph**: `og:title`, `og:description`, `og:image`, `og:image:width/height/type/alt`, `og:url`, `og:type`, `og:site_name`, `og:locale`, `article:published_time`, `article:modified_time`, `article:author`, `article:section`, `article:tag` (relative images are automatically resolved to absolute URLs using your config's `siteUrl`)
* **Twitter Cards**: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`, `twitter:image:alt`, `twitter:site`, `twitter:creator`

### Sitemap Metadata Support
You can also define sitemap crawl properties directly in your components (e.g. `changefreq="weekly" priority={0.8}`). 
These properties are automatically encoded as data-attributes on the JSON-LD `<script>` tag. Post-build sitemap generators like `@casoon/astro-site-files` can read these tags directly from the HTML to dynamically build/patch the sitemap entries, meaning you don't need to duplicate sitemap logic in your configs. This feature is completely decoupled and will fall back gracefully to the sitemap defaults if `@casoon/astro-site-files` is not installed or configured.

## Components

Import components from `@casoon/astro-structured-data/components`:

```astro
---
import { ArticleSchema, FAQSchema } from '@casoon/astro-structured-data/components';
---
```

---

### ArticleSchema

Docs: [schema.org/Article](https://schema.org/Article) · [Google: Article](https://developers.google.com/search/docs/appearance/structured-data/article)

```astro
<ArticleSchema
  title="My Article"
  description="Article description"
  datePublished="2024-01-01"
  authorName="Jane Doe"
  imageUrl="https://example.com/image.jpg"
/>
```

| Prop | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | Yes | Article headline |
| `description` | `string` | Yes | Article description |
| `datePublished` | `string \| Date` | Yes | Publication date |
| `dateModified` | `string \| Date` | No | Last modified date |
| `authorName` | `string \| string[]` | Yes | Author name(s) |
| `authorType` | `'Person' \| 'Organization'` | No | Default: `'Person'` |
| `authorUrl` | `string` | No | Author profile URL |
| `authorId` | `string` | No | Author `@id` for linked data |
| `imageUrl` | `string` | No | Article image URL |
| `imageWidth` | `number` | No | Image width in pixels |
| `imageHeight` | `number` | No | Image height in pixels |
| `imageFormat` | `string` | No | Image MIME type, e.g. `'image/jpeg'` |
| `imageCaption` | `string` | No | Image caption |
| `publisherName` | `string` | No | Publisher name (falls back to `defaultArticlePublisher`) |
| `publisherLogo` | `string` | No | Publisher logo URL (falls back to `defaultArticlePublisher`) |
| `schemaType` | `'Article' \| 'BlogPosting' \| 'NewsArticle'` | No | Default: `'BlogPosting'` |
| `inLanguage` | `string` | No | Content language, e.g. `'de'` |
| `articleSection` | `string` | No | Section or category name |
| `keywords` | `string \| string[]` | No | Keywords |
| `wordCount` | `number` | No | Word count |
| `readingTimeMinutes` | `number` | No | Reading time in minutes (encoded as `timeRequired`) |
| `isAccessibleForFree` | `boolean` | No | Default: `true` |
| `isPartOfHeadline` | `string` | No | Parent series headline (for `isPartOf`) |
| `isPartOfUrl` | `string` | No | Parent series URL |
| `seriesPosition` | `number` | No | Position within the series |
| `hasPart` | `{ headline: string; url: string; position?: number }[]` | No | Child articles in a series |

---

### FAQSchema

Docs: [schema.org/FAQPage](https://schema.org/FAQPage) · [Google: FAQ](https://developers.google.com/search/docs/appearance/structured-data/faqpage)

```astro
<FAQSchema
  questions={[
    { question: 'What is this?', answer: 'An Astro integration.' },
    { question: 'How does it work?', answer: 'It injects JSON-LD.' },
  ]}
/>
```

| Prop | Type | Required | Description |
|---|---|---|---|
| `questions` | `{ question: string; answer: string }[]` | Yes | List of Q&A pairs |

---

### ProductSchema

Docs: [schema.org/Product](https://schema.org/Product) · [Google: Product](https://developers.google.com/search/docs/appearance/structured-data/product)

```astro
<ProductSchema
  name="Super Gadget"
  description="The best gadget ever"
  imageUrl="https://example.com/gadget.jpg"
  price={29.99}
  priceCurrency="EUR"
  availability="InStock"
  sku="SG-001"
  ratingValue={4.5}
  reviewCount={128}
/>
```

| Prop | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Product name |
| `description` | `string` | Yes | Product description |
| `imageUrl` | `string \| string[]` | Yes | Product image URL(s) |
| `price` | `string \| number` | No | Price (simple offer) |
| `priceCurrency` | `string` | No | ISO 4217 currency code, e.g. `'EUR'` |
| `availability` | `'InStock' \| 'OutOfStock' \| 'PreOrder' \| 'OnlineOnly'` | No | Offer availability |
| `offers` | `Offer \| Offer[]` | No | Full offer object(s) for advanced use cases |
| `priceRange` | `PriceRange` | No | Price range for variable pricing |
| `brand` | `string \| Brand` | No | Brand name or object (falls back to `defaultBrand`) |
| `sku` | `string` | No | Stock keeping unit |
| `gtin` | `string` | No | GTIN barcode |
| `ratingValue` | `number` | No | Aggregate rating (0–5) |
| `reviewCount` | `number` | No | Number of reviews |
| `reviews` | `ReviewItem[]` | No | Individual review objects |
| `shippingDetails` | `object` | No | Shipping details (falls back to `defaultShippingDetails`) |
| `returnPolicy` | `object` | No | Return policy (falls back to `defaultReturnPolicy`) |

---

### LocalBusinessSchema

Docs: [schema.org/LocalBusiness](https://schema.org/LocalBusiness) · [Google: Local Business](https://developers.google.com/search/docs/appearance/structured-data/local-business)

```astro
<LocalBusinessSchema
  name="My Shop"
  telephone="+49 30 1234567"
  address={{
    streetAddress: 'Hauptstraße 42',
    addressLocality: 'Berlin',
    postalCode: '10119',
    addressCountry: 'DE',
  }}
  openingHours={['Mo-Fr 09:00-18:00', 'Sa 10:00-16:00']}
/>
```

All props fall back to `defaultLocalBusiness` from the integration config.

| Prop | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | No | Business name |
| `imageUrl` | `string` | No | Business image URL |
| `telephone` | `string` | No | Phone number |
| `priceRange` | `string` | No | Price range indicator, e.g. `'$$'` |
| `address` | `{ streetAddress, addressLocality, addressRegion?, postalCode, addressCountry }` | No | Postal address |
| `geo` | `{ latitude: number; longitude: number }` | No | Geographic coordinates |
| `openingHours` | `string[]` | No | Opening hours, e.g. `['Mo-Fr 09:00-18:00']` |

---

### BreadcrumbSchema

Docs: [schema.org/BreadcrumbList](https://schema.org/BreadcrumbList) · [Google: Breadcrumb](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb)

```astro
<BreadcrumbSchema
  items={[
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' },
    { name: 'My Post', url: '/blog/my-post' },
  ]}
/>
```

| Prop | Type | Required | Description |
|---|---|---|---|
| `items` | `{ name: string; url: string }[]` | Yes | Ordered breadcrumb items |

---

### AutoBreadcrumbSchema

Docs: [schema.org/BreadcrumbList](https://schema.org/BreadcrumbList) · [Google: Breadcrumb](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb)

Generates breadcrumbs automatically from the current URL path. Segments are converted from kebab-case to title case by default.

```astro
<AutoBreadcrumbSchema />

<!-- With custom labels -->
<AutoBreadcrumbSchema
  homeLabel="Start"
  labels={{ blog: 'Articles', 'my-post': 'My Post' }}
/>
```

| Prop | Type | Required | Description |
|---|---|---|---|
| `homeLabel` | `string` | No | Label for the root segment. Default: `'Home'` |
| `labels` | `Record<string, string>` | No | Override labels for specific URL path segments |

---

### EventSchema

Docs: [schema.org/Event](https://schema.org/Event) · [Google: Event](https://developers.google.com/search/docs/appearance/structured-data/event)

```astro
<EventSchema
  name="Tech Meetup Berlin"
  startDate="2024-06-15T18:00:00"
  locationName="Hub Berlin"
  locationAddress={{
    streetAddress: 'Alexanderplatz 1',
    addressLocality: 'Berlin',
    postalCode: '10178',
    addressCountry: 'DE',
  }}
  attendanceMode="Offline"
  status="Scheduled"
/>
```

| Prop | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Event name |
| `startDate` | `string \| Date` | Yes | Start date/time |
| `endDate` | `string \| Date` | No | End date/time |
| `description` | `string` | No | Event description |
| `imageUrl` | `string \| string[]` | No | Event image URL(s) |
| `locationName` | `string` | Yes | Venue name |
| `locationAddress` | `{ streetAddress, addressLocality, addressRegion?, postalCode, addressCountry }` | Yes | Venue address |
| `attendanceMode` | `'Offline' \| 'Online' \| 'Mixed'` | No | Default: `'Offline'` |
| `status` | `'Scheduled' \| 'Cancelled' \| 'Postponed' \| 'Rescheduled'` | No | Default: `'Scheduled'` |
| `price` | `number \| string` | No | Ticket price |
| `priceCurrency` | `string` | No | ISO 4217 currency code |
| `availability` | `'InStock' \| 'OutOfStock' \| 'PreOrder' \| 'OnlineOnly'` | No | Ticket availability |

---

### OrganizationSchema

Docs: [schema.org/Organization](https://schema.org/Organization) · [Google: Organization](https://developers.google.com/search/docs/appearance/structured-data/organization)

```astro
<OrganizationSchema
  name="ACME Corp"
  logoUrl="https://example.com/logo.png"
  sameAs={['https://twitter.com/acme', 'https://linkedin.com/company/acme']}
/>
```

| Prop | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | No | Organization name (falls back to `defaultArticlePublisher.name`) |
| `url` | `string` | No | Organization URL (falls back to `siteUrl`) |
| `logoUrl` | `string` | No | Logo URL (falls back to `defaultArticlePublisher.logo`) |
| `sameAs` | `string[]` | No | Social profile / same-entity URLs |
| `telephone` | `string` | No | Phone number |
| `email` | `string` | No | Email address |
| `address` | `{ streetAddress, addressLocality, addressRegion?, postalCode, addressCountry }` | No | Postal address |

---

### WebSiteSchema

Docs: [schema.org/WebSite](https://schema.org/WebSite) · [Google: Sitelinks Searchbox](https://developers.google.com/search/docs/appearance/structured-data/sitelinks-searchbox)

```astro
<WebSiteSchema name="My Site" />

<!-- With Sitelinks Searchbox -->
<WebSiteSchema name="My Site" searchQueryInput="q" />
```

| Prop | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Site name |
| `url` | `string` | No | Site URL (falls back to `siteUrl`) |
| `searchQueryInput` | `string` | No | URL query param name to enable Sitelinks Searchbox, e.g. `'q'` |

---

### WebPageSchema

Docs: [schema.org/WebPage](https://schema.org/WebPage) · [Google: WebPage](https://developers.google.com/search/docs/appearance/structured-data/webpage)

Generic page schema — use for landing pages, legal pages, or any page that doesn't fit a more specific type.

```astro
<WebPageSchema
  title="About Us"
  description="Learn more about our company."
  inLanguage="en"
  dateModified="2024-06-01"
/>
```

| Prop | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | Yes | Page title |
| `description` | `string` | No | Page description |
| `url` | `string` | No | Canonical URL (falls back to current page URL) |
| `inLanguage` | `string` | No | Content language, e.g. `'de'` |
| `datePublished` | `string` | No | Publication date |
| `dateModified` | `string` | No | Last modified date |
| `isAccessibleForFree` | `boolean` | No | Default: `true` |
| `image` | `string` | No | Page image URL |
| `imageWidth` | `number` | No | Image width in pixels |
| `imageHeight` | `number` | No | Image height in pixels |
| `imageFormat` | `string` | No | Image MIME type |
| `imageCaption` | `string` | No | Image caption |
| `author` | `{ name: string; url?: string; id?: string; type?: string }` | No | Page author |
| `publisher` | `{ name: string; url?: string; logo?: string }` | No | Publisher (falls back to `defaultArticlePublisher`) |
| `robots` | `string` | No | Robots directive, e.g. `'noindex'` |
| `alternates` | `{ href: string; hreflang: string }[]` | No | Alternate language versions |

---

### ProfilePageSchema

Docs: [schema.org/ProfilePage](https://schema.org/ProfilePage) · [Google: Profile Page](https://developers.google.com/search/docs/appearance/structured-data/profile-page)

```astro
<ProfilePageSchema
  name="Jane Doe"
  description="Software engineer and writer"
  imageUrl="https://example.com/jane.jpg"
  sameAs={['https://github.com/janedoe']}
/>
```

| Prop | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Person name |
| `description` | `string` | No | Short bio |
| `imageUrl` | `string` | No | Profile image URL |
| `sameAs` | `string[]` | No | Social profile URLs |
| `publishingPrinciples` | `string` | No | URL to editorial / publishing guidelines |

---

### CollectionPageSchema

Docs: [schema.org/CollectionPage](https://schema.org/CollectionPage)

For product listing / archive pages.

```astro
<CollectionPageSchema
  name="All Products"
  description="Browse our full product catalogue"
  products={[
    { name: 'Widget A', url: '/products/widget-a', imageUrl: '...', price: 9.99, priceCurrency: 'EUR' },
    { name: 'Widget B', url: '/products/widget-b' },
  ]}
/>
```

| Prop | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Page / collection name |
| `description` | `string` | Yes | Collection description |
| `products` | `{ name: string; url: string; imageUrl?: string; price?: number \| string; priceCurrency?: string }[]` | Yes | List of products |

---

### JobPostingSchema

Docs: [schema.org/JobPosting](https://schema.org/JobPosting) · [Google: Job Posting](https://developers.google.com/search/docs/appearance/structured-data/job-posting)

```astro
<JobPostingSchema
  title="Senior Developer"
  description="<p>We're looking for a senior developer...</p>"
  datePosted="2024-06-01"
  jobLocation={{
    streetAddress: 'Hauptstraße 1',
    addressLocality: 'Berlin',
    postalCode: '10115',
    addressCountry: 'DE',
  }}
  employmentType="FULL_TIME"
  baseSalary={{ value: 80000, currency: 'EUR', unit: 'YEAR' }}
/>
```

| Prop | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | Yes | Job title |
| `description` | `string` | Yes | Job description (HTML accepted by Google) |
| `datePosted` | `string` | Yes | ISO date the posting was published |
| `validThrough` | `string` | No | ISO date the posting expires |
| `employmentType` | `'FULL_TIME' \| 'PART_TIME' \| 'CONTRACTOR' \| 'TEMPORARY' \| 'INTERN' \| 'VOLUNTEER' \| 'OTHER'` | No | Default: `'FULL_TIME'` |
| `hiringOrganizationName` | `string` | No | Hiring company name |
| `hiringOrganizationUrl` | `string` | No | Hiring company URL |
| `hiringOrganizationLogo` | `string` | No | Hiring company logo URL |
| `jobLocation` | `{ streetAddress, addressLocality, addressRegion?, postalCode, addressCountry }` | Yes | Job location |
| `baseSalary` | `{ value: number \| string; currency: string; unit?: 'HOUR' \| 'DAY' \| 'WEEK' \| 'MONTH' \| 'YEAR' }` | No | Salary details |

---

### SoftwareAppSchema

Docs: [schema.org/SoftwareApplication](https://schema.org/SoftwareApplication) · [Google: Software App](https://developers.google.com/search/docs/appearance/structured-data/software-app)

```astro
<SoftwareAppSchema
  name="My App"
  operatingSystem="Web"
  applicationCategory="BusinessApplication"
  price={0}
  priceCurrency="EUR"
  ratingValue={4.8}
  reviewCount={320}
/>
```

| Prop | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | App name |
| `operatingSystem` | `string` | No | e.g. `'Web'`, `'Windows, macOS'`. Default: `'Web'` |
| `applicationCategory` | `string` | No | e.g. `'BusinessApplication'`, `'Game'`. Default: `'DeveloperApplication'` |
| `price` | `string \| number` | No | Price (use `0` for free apps) |
| `priceCurrency` | `string` | No | ISO 4217 currency code |
| `ratingValue` | `number` | No | Aggregate rating (0–5) |
| `reviewCount` | `number` | No | Number of reviews |

---

### SchemaGraph

Renders all schemas registered via `useGraph: true` as a single `@graph` block. Place once in your base layout.

```astro
---
import { SchemaGraph } from '@casoon/astro-structured-data/components';
---
<SchemaGraph />
```

No props. Reads from `Astro.locals.structuredDataGraph` populated by the other components when `useGraph` is enabled.

---

## Zod schemas

Reusable Zod schemas for all types — useful in Content Collections or form validation:

```ts
import {
  articleZodSchema,
  faqZodSchema,
  productZodSchema,
  localBusinessZodSchema,
  eventZodSchema,
} from '@casoon/astro-structured-data/zod';
```

## License

MIT
