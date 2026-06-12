# @casoon/astro-structured-data

Astro integration for automatic structured data (JSON-LD) generation. Supports Articles, FAQs, Products, Recipes, Videos, Breadcrumbs, Local Businesses, Events, Organizations, and more — with full TypeScript and Zod validation.

[![npm version](https://img.shields.io/npm/v/@casoon/astro-structured-data.svg)](https://www.npmjs.com/package/@casoon/astro-structured-data)
[![GitHub repository](https://img.shields.io/badge/github-repo-black.svg?logo=github)](https://github.com/casoon/astro-structured-data)
[![Website](https://img.shields.io/badge/website-live-brightgreen.svg)](https://astro-structured-data.casoon.dev/)

[Landing Page](https://astro-structured-data.casoon.dev/) | [GitHub Repository](https://github.com/casoon/astro-structured-data) | [npm Package](https://www.npmjs.com/package/@casoon/astro-structured-data)

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

| Option | Type | Default | Description |
|---|---|---|---|
| `siteUrl` | `string` | — | Absolute base URL — falls back to Astro's `site` config |
| `useGraph` | `boolean` | `false` | Wrap all schemas in a `@graph` array |
| `generateMeta` | `boolean` | `false` | Generate standard HTML head meta tags (og:*, twitter:*, canonical, etc.) from schemas |
| `siteName` | `string` | — | Global site name used for `og:site_name` |
| `locale` | `string` | — | Global locale used for `og:locale` (e.g. `de_DE`) |
| `twitterSite` | `string` | — | Twitter site handle used for `twitter:site` (e.g. `@my_site`) |
| `twitterCreator` | `string` | — | Fallback Twitter creator handle used for `twitter:creator` (e.g. `@author`) |
| `warnOnMissingRecommended` | `boolean` | `true` | Log warnings during build when recommended schema.org fields are absent |
| `defaultLocalBusiness` | `LocalBusiness` | — | Site-wide local business defaults merged into `LocalBusinessSchema` |
| `defaultArticlePublisher` | `Organization` | — | Default publisher for `ArticleSchema` and `OrganizationSchema` |
| `defaultBrand` | `Brand \| string` | — | Default brand for `ProductSchema` |
| `defaultShippingDetails` | `OfferShippingDetails` | — | Default shipping details for `ProductSchema` |
| `defaultReturnPolicy` | `MerchantReturnPolicy` | — | Default return policy for `ProductSchema` |

## Dev Toolbar

The integration registers an Astro Dev Toolbar panel (visible only in `astro dev`) that shows every `<script type="application/ld+json">` block found on the current page.

For each schema it shows:

- **Rich Result Preview** — a Google-style mockup rendered directly in the toolbar:
  - *Article / BlogPosting / NewsArticle* — thumbnail, author, date snippet
  - *FAQPage* — interactive accordion (click to expand answers)
  - *Product* — star rating, price, in-stock badge
  - *BreadcrumbList* — breadcrumb trail in Google style
  - *Event* — calendar date box, location, time
  - *JobPosting* — job card with location, employment type, salary badges
  - *LocalBusiness* — phone, address, opening hours
  - *SoftwareApplication* — star rating, OS, category
- **Validation warnings** — required and recommended field checks per type
- **📋 Copy JSON-LD** — copies the full JSON-LD to the clipboard
- **🔍 Test on Schema.org** — opens `validator.schema.org` in a new tab
- **Show JSON-LD Raw** — toggle the raw JSON for inspection

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
| `url` | `string` | No | Business website URL |
| `description` | `string` | No | Short business description |
| `imageUrl` | `string` | No | Business image URL |
| `telephone` | `string` | No | Phone number |
| `email` | `string` | No | Email address |
| `priceRange` | `string` | No | Price range indicator, e.g. `'$$'` |
| `address` | `{ streetAddress, addressLocality, addressRegion?, postalCode, addressCountry }` | No | Postal address |
| `geo` | `{ latitude: number; longitude: number }` | No | Geographic coordinates |
| `openingHours` | `string[]` | No | Opening hours, e.g. `['Mo-Fr 09:00-18:00']` |
| `sameAs` | `string[]` | No | Social profile / same-entity URLs (e.g. Google Business, Facebook) |

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
| `ignoreSegments` | `string[]` | No | URL segments to skip — useful for language prefixes like `['de', 'en']` |
| `prependBreadcrumbs` | `{ name: string; url: string }[]` | No | Breadcrumbs inserted after Home, before auto-generated segments |
| `appendBreadcrumbs` | `{ name: string; url: string }[]` | No | Breadcrumbs appended after all auto-generated segments |

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
| `url` | `string` | No | Event page URL |
| `price` | `number \| string` | No | Ticket price |
| `priceCurrency` | `string` | No | ISO 4217 currency code |
| `availability` | `'InStock' \| 'OutOfStock' \| 'PreOrder' \| 'OnlineOnly'` | No | Ticket availability |
| `organizer` | `{ name: string; url?: string }` | No | Organizing entity (recommended by Google) |
| `performer` | `{ name: string; url?: string }` | No | Performer or speaker at the event |

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

For remote positions, use `jobLocationType` instead of (or in addition to) `jobLocation`:

```astro
<JobPostingSchema
  title="Remote Frontend Engineer"
  description="<p>Fully remote position open worldwide.</p>"
  datePosted="2024-06-01"
  jobLocationType="TELECOMMUTE"
  applicantLocationRequirements="DE"
  employmentType="FULL_TIME"
/>
```

> **Note:** Google requires either `jobLocation` or `applicantLocationRequirements` — at least one must be provided.

| Prop | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | Yes | Job title |
| `description` | `string` | Yes | Job description (HTML accepted by Google) |
| `datePosted` | `string` | Yes | ISO date the posting was published |
| `validThrough` | `string` | No | ISO date the posting expires |
| `employmentType` | `'FULL_TIME' \| 'PART_TIME' \| 'CONTRACTOR' \| 'TEMPORARY' \| 'INTERN' \| 'VOLUNTEER' \| 'OTHER'` | No | Default: `'FULL_TIME'` |
| `hiringOrganizationName` | `string` | No | Hiring company name (falls back to `defaultArticlePublisher`) |
| `hiringOrganizationUrl` | `string` | No | Hiring company URL |
| `hiringOrganizationLogo` | `string` | No | Hiring company logo URL |
| `jobLocation` | `{ streetAddress, addressLocality, addressRegion?, postalCode, addressCountry }` | No* | Job location — required unless `applicantLocationRequirements` is set |
| `baseSalary` | `{ value: number \| string; currency: string; unit?: 'HOUR' \| 'DAY' \| 'WEEK' \| 'MONTH' \| 'YEAR' }` | No | Salary details |
| `identifier` | `{ name: string; value: string }` | No | Employer-specific job ID (e.g. `{ name: 'Acme', value: 'JR-12345' }`) |
| `directApply` | `boolean` | No | Shows "Apply on your site" badge in Google rich results |
| `jobLocationType` | `'TELECOMMUTE'` | No | Set for remote positions |
| `applicantLocationRequirements` | `string \| string[]` | No* | Country/region where remote applicants must be located — required unless `jobLocation` is set |

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
| `description` | `string` | No | Short app description |
| `url` | `string` | No | Link to the app or its landing page |
| `operatingSystem` | `string` | No | e.g. `'Web'`, `'Windows, macOS'`. Default: `'Web'` |
| `applicationCategory` | `string` | No | e.g. `'BusinessApplication'`, `'Game'`. Default: `'DeveloperApplication'` |
| `price` | `string \| number` | No | Price (use `0` for free apps) |
| `priceCurrency` | `string` | No | ISO 4217 currency code |
| `ratingValue` | `number` | No | Aggregate rating (0–5) |
| `reviewCount` | `number` | No | Number of reviews |

---

### RecipeSchema

Docs: [schema.org/Recipe](https://schema.org/Recipe) · [Google: Recipe](https://developers.google.com/search/docs/appearance/structured-data/recipe)

```astro
<RecipeSchema
  name="Classic Chocolate Chip Cookies"
  description="Crispy edges, chewy and soft in the center."
  imageUrl="https://example.com/cookies.jpg"
  authorName="Baker Bob"
  prepTime="PT15M"
  cookTime="PT10M"
  recipeYield="12 cookies"
  recipeCategory="Dessert"
  recipeCuisine="American"
  calories={220}
  ingredients={[
    "200g butter",
    "150g brown sugar",
    "2 eggs",
    "300g flour",
    "200g chocolate chips"
  ]}
  instructions={[
    { text: "Preheat oven to 190°C.", name: "Preheat" },
    { text: "Mix butter, sugar, and eggs. Fold in dry ingredients and chocolate chips.", name: "Make Dough" },
    { text: "Scoop cookie balls onto sheet and bake for 10 minutes.", name: "Bake" }
  ]}
  ratingValue={4.9}
  reviewCount={45}
/>
```

| Prop | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Recipe name |
| `description` | `string` | Yes | Recipe description |
| `imageUrl` | `string \| string[]` | Yes | Image URL(s) |
| `authorName` | `string \| string[]` | Yes | Author name(s) |
| `authorType` | `'Person' \| 'Organization'` | No | Default: `'Person'` |
| `prepTime` | `string` | No | ISO duration, e.g. `'PT15M'` |
| `cookTime` | `string` | No | ISO duration, e.g. `'PT10M'` |
| `totalTime` | `string` | No | ISO duration |
| `recipeYield` | `string \| number` | No | Servings or yield |
| `recipeCategory` | `string` | No | e.g. `'Dessert'` |
| `recipeCuisine` | `string` | No | e.g. `'American'` |
| `calories` | `number \| string` | No | Calorie count |
| `ingredients` | `string[]` | Yes | List of ingredient descriptions |
| `instructions` | `string[] \| InstructionStep[]` | Yes | Step-by-step instructions |
| `ratingValue` | `number` | No | Rating value (0-5) |
| `reviewCount` | `number` | No | Number of ratings |
| `datePublished` | `string \| Date` | No | Publication date |

---

### VideoSchema

Docs: [schema.org/VideoObject](https://schema.org/VideoObject) · [Google: Video](https://developers.google.com/search/docs/appearance/structured-data/video)

```astro
<VideoSchema
  name="Astro v6 Server Islands Tutorial"
  description="Learn how to use server islands in Astro v6."
  thumbnailUrl="https://example.com/thumb.jpg"
  uploadDate="2026-06-01"
  duration="PT8M45S"
  contentUrl="https://example.com/video.mp4"
  interactionCount={15420}
/>
```

| Prop | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Video title |
| `description` | `string` | Yes | Video description |
| `thumbnailUrl` | `string \| string[]` | Yes | Thumbnail image URL(s) |
| `uploadDate` | `string \| Date` | Yes | Video upload date |
| `duration` | `string` | No | ISO duration, e.g. `'PT8M45S'` |
| `contentUrl` | `string` | No* | URL to the actual video file — at least one of `contentUrl` or `embedUrl` required for indexing |
| `embedUrl` | `string` | No* | URL to the embeddable video player — at least one of `contentUrl` or `embedUrl` required for indexing |
| `interactionCount` | `number \| string` | No | Total view counts |
| `expires` | `string \| Date` | No | Expiration date |
| `publisher` | `{ name: string; logoUrl?: string }` | No | Publishing organization (recommended by Google) |

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

All components ship with a matching Zod schema, exported from `@casoon/astro-structured-data/zod`. Use them in Content Collections, form validation, or any runtime validation.

```ts
import {
  articleZodSchema,
  faqZodSchema,
  productZodSchema,
  localBusinessZodSchema,
  eventZodSchema,
  organizationZodSchema,
  webPageZodSchema,
  webSiteZodSchema,
  profilePageZodSchema,
  jobPostingZodSchema,
  softwareAppZodSchema,
  collectionPageZodSchema,
  breadcrumbZodSchema,
  autoBreadcrumbZodSchema,
  recipeZodSchema,
  videoZodSchema,
} from '@casoon/astro-structured-data/zod';
```

### validateRecommended

Check any schema object for missing recommended fields (matching what the build warning reports):

```ts
import { validateRecommended } from '@casoon/astro-structured-data/zod';
import type { SchemaType, RecommendedWarning } from '@casoon/astro-structured-data/zod';

const warnings: RecommendedWarning[] = validateRecommended('Organization', {
  name: 'ACME Corp',
  url: 'https://acme.com',
});
// → [{ field: 'sameAs', message: 'Organization should include "sameAs" ...' }, ...]
```

The `type` argument uses schema.org `@type` names: `'Article'`, `'BlogPosting'`, `'NewsArticle'`, `'FAQPage'`, `'Product'`, `'LocalBusiness'`, `'Event'`, `'Organization'`, `'WebPage'`, `'WebSite'`, `'ProfilePage'`, `'JobPosting'`, `'SoftwareApplication'`, `'CollectionPage'`, `'BreadcrumbList'`.

Fields marked as recommended are a subset of optional props that Google's Rich Results guidelines list as strongly beneficial — omitting them won't break validation but may reduce search result richness.

## Utilities

```ts
import { calculateReadingTime } from '@casoon/astro-structured-data/utils';
```

### calculateReadingTime

Calculates word count and reading time from a plain-text or HTML string. Useful for populating `wordCount` and `readingTimeMinutes` on `ArticleSchema` from MDX content.

```ts
const { wordCount, readingTimeMinutes, timeRequired } = calculateReadingTime(content);
// timeRequired is ISO 8601 duration, e.g. 'PT4M'
```

```astro
---
import { calculateReadingTime } from '@casoon/astro-structured-data/utils';
import { ArticleSchema } from '@casoon/astro-structured-data/components';
import { getEntry } from 'astro:content';

const post = await getEntry('blog', Astro.params.slug);
const { wordCount, readingTimeMinutes } = calculateReadingTime(post.body);
---
<ArticleSchema
  title={post.data.title}
  datePublished={post.data.date}
  authorName={post.data.author}
  wordCount={wordCount}
  readingTimeMinutes={readingTimeMinutes}
/>
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `text` | `string` | — | Plain text or HTML string |
| `wordsPerMinute` | `number` | `200` | Reading speed used for the calculation |

Returns `{ wordCount: number; readingTimeMinutes: number; timeRequired: string }`.

### Build-time warnings

When `warnOnMissingRecommended: true` (the default), the same recommended-field logic runs automatically after every build. The integration scans all output HTML for `<script type="application/ld+json">` blocks and logs one warning per missing field per type:

```
[structured-data] Organization is missing recommended field "sameAs" — add it for richer search results.
```

To disable:

```js
structuredData({ warnOnMissingRecommended: false })
```

## License

MIT
