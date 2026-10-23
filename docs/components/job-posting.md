---
title: JobPostingSchema
description: Outputs a JobPosting with hiring organization, location, salary and remote-work details; use it on the page of each open position.
order: 6
---

`JobPostingSchema` describes one open position. It outputs a
[`JobPosting`](https://schema.org/JobPosting) and targets Google's
[job posting experience](https://developers.google.com/search/docs/appearance/structured-data/job-posting)
(the job search listing with title, employer, location and salary).

## Usage

```astro
---
// src/pages/jobs/[slug].astro
import { getCollection } from 'astro:content';
import { JobPostingSchema } from '@casoon/astro-structured-data/components';

export async function getStaticPaths() {
  const jobs = await getCollection('jobs');
  return jobs.map((job) => ({ params: { slug: job.id }, props: { job } }));
}

const { job } = Astro.props;
---
<JobPostingSchema
  title={job.data.title}
  description={job.data.summaryHtml}
  datePosted={job.data.datePosted}
  validThrough={job.data.validThrough}
  employmentType="FULL_TIME"
  hiringOrganizationName="ACME GmbH"
  hiringOrganizationUrl="https://acme.example"
  hiringOrganizationLogo="https://acme.example/logo.png"
  jobLocation={{
    streetAddress: 'Hauptstraße 1',
    addressLocality: 'Berlin',
    postalCode: '10115',
    addressCountry: 'DE',
  }}
  baseSalary={{ value: 80000, currency: 'EUR', unit: 'YEAR' }}
  identifier={{ name: 'ACME GmbH', value: job.data.reference }}
  directApply
/>
```

`description` may contain HTML, as Google accepts it for job postings. It is written to the
JSON-LD as given (escaped only so it cannot close the `<script>` block). With
`generateMeta`, the tags are removed for the meta description.

## Output

On `/jobs/senior-developer/`, for a posting with `datePosted: '2026-10-01'`,
`validThrough: '2026-12-31'` and reference `JR-1042`:

```json
{
  "@context": "https://schema.org",
  "@type": "JobPosting",
  "title": "Senior Developer",
  "description": "<p>We are looking for a senior developer to join our platform team in Berlin.</p>",
  "datePosted": "2026-10-01",
  "validThrough": "2026-12-31",
  "employmentType": "FULL_TIME",
  "hiringOrganization": {
    "@type": "Organization",
    "name": "ACME GmbH",
    "url": "https://acme.example",
    "logo": "https://acme.example/logo.png"
  },
  "jobLocation": {
    "@type": "Place",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Hauptstraße 1",
      "addressLocality": "Berlin",
      "postalCode": "10115",
      "addressCountry": "DE"
    }
  },
  "baseSalary": {
    "@type": "MonetaryAmount",
    "currency": "EUR",
    "value": {
      "@type": "QuantitativeValue",
      "value": 80000,
      "unitText": "YEAR"
    }
  },
  "identifier": {
    "@type": "PropertyValue",
    "name": "ACME GmbH",
    "value": "JR-1042"
  },
  "directApply": true
}
```

`baseSalary` becomes a `MonetaryAmount` with a `QuantitativeValue`; `unit` is output as
`unitText`. `identifier` becomes a `PropertyValue`.

## Remote job

A fully remote position sets `jobLocationType="TELECOMMUTE"` and names the countries or
regions applicants may live in. Here the hiring organization comes from
`defaultArticlePublisher`:

```js
// astro.config.mjs
structuredData({
  siteUrl: 'https://example.com',
  defaultArticlePublisher: { name: 'ACME GmbH', logo: { url: '/logo.png' } },
})
```

```astro
<JobPostingSchema
  title="Remote Frontend Engineer"
  description="<p>Fully remote position for applicants in Germany or Austria.</p>"
  datePosted="2026-09-01"
  validThrough="2026-12-31"
  employmentType="FULL_TIME"
  jobLocationType="TELECOMMUTE"
  applicantLocationRequirements={['DE', 'AT']}
  baseSalary={{ value: 6000, currency: 'EUR', unit: 'MONTH' }}
/>
```

```json
{
  "@context": "https://schema.org",
  "@type": "JobPosting",
  "title": "Remote Frontend Engineer",
  "description": "<p>Fully remote position for applicants in Germany or Austria.</p>",
  "datePosted": "2026-09-01",
  "validThrough": "2026-12-31",
  "employmentType": "FULL_TIME",
  "hiringOrganization": {
    "@type": "Organization",
    "name": "ACME GmbH",
    "url": "https://example.com",
    "logo": "/logo.png"
  },
  "baseSalary": {
    "@type": "MonetaryAmount",
    "currency": "EUR",
    "value": {
      "@type": "QuantitativeValue",
      "value": 6000,
      "unitText": "MONTH"
    }
  },
  "jobLocationType": "TELECOMMUTE",
  "applicantLocationRequirements": [
    {
      "@type": "Country",
      "name": "DE"
    },
    {
      "@type": "Country",
      "name": "AT"
    }
  ]
}
```

- `hiringOrganization.name` and `logo` come from `defaultArticlePublisher`; `url` falls back
  to `siteUrl`.
- Each entry of `applicantLocationRequirements` becomes a `Country` with that `name`.

A hybrid position, partly on site and partly remote, sets `jobLocation`, `jobLocationType`
and `applicantLocationRequirements` together.

## Props

| Prop | Type | Required | Default / fallback | Description |
| --- | --- | --- | --- | --- |
| `title` | `string` | Yes | – | Job title |
| `description` | `string` | Yes | – | Full job description; HTML allowed |
| `datePosted` | `string \| Date` | Yes | – | Date the posting was published, ISO 8601 |
| `validThrough` | `string \| Date` | No (recommended) | – | Date the posting expires; not before `datePosted` |
| `employmentType` | `'FULL_TIME' \| 'PART_TIME' \| 'CONTRACTOR' \| 'TEMPORARY' \| 'INTERN' \| 'VOLUNTEER' \| 'OTHER'` | No (recommended) | – | Omitted when not set |
| `hiringOrganizationName` | `string` | Yes, unless configured | `defaultArticlePublisher.name` | Hiring company |
| `hiringOrganizationUrl` | `string` (absolute URL) | No | `siteUrl` | Hiring company website |
| `hiringOrganizationLogo` | `string` (URL or `/path`) | No | `defaultArticlePublisher.logo.url` | Hiring company logo |
| `hiringOrganizationId` | `string` | No | `defaultArticlePublisher.id`, unless `hiringOrganizationName` is set | Hiring company `@id` |
| `jobLocation` | `PostalAddress` | Unless remote | – | `{ streetAddress, addressLocality, addressRegion?, postalCode, addressCountry }`, output as `Place` |
| `baseSalary` | `{ value: number \| string; currency: string; unit: 'HOUR' \| 'DAY' \| 'WEEK' \| 'MONTH' \| 'YEAR' }` | No (recommended) | – | Salary; `value` positive, a string must be numeric like `'50000'`; `currency` ISO 4217 |
| `identifier` | `{ name: string; value: string }` | No (recommended) | – | Employer's reference for the posting, output as `PropertyValue` |
| `directApply` | `boolean` | No (recommended) | – | `true` when applicants can apply directly on the page |
| `jobLocationType` | `'TELECOMMUTE'` | No | – | Marks a remote position |
| `applicantLocationRequirements` | `string \| string[]` | Remote only | – | Countries or regions remote applicants must be in, output as `Country` |
| `changefreq`, `priority` | sitemap hints | No | – | See [Meta tags and sitemap hints](../../guides/meta-tags/) |

"URL or `/path`" means an absolute `http(s)` URL or a root-relative path. `jobLocation`,
`baseSalary` and `identifier` allow no other fields.

## Rules

Violations fail the build (see [Validation](../../guides/validation/)):

- `jobLocation` is required unless `jobLocationType` is `'TELECOMMUTE'`.
- `applicantLocationRequirements` is required for `'TELECOMMUTE'` jobs and not allowed for
  other jobs.
- A hiring organization name is required: without `hiringOrganizationName` and without
  `defaultArticlePublisher.name` the build fails with
  `Missing hiring organization: set "hiringOrganizationName" or defaultArticlePublisher.name`.
- `validThrough` must not be before `datePosted`.
- Text fields must not be empty.

| Position | `jobLocation` | `jobLocationType` | `applicantLocationRequirements` |
| --- | --- | --- | --- |
| On site | required | – | not allowed |
| Fully remote | optional | `'TELECOMMUTE'` | required |
| Hybrid | set | `'TELECOMMUTE'` | required |

The hiring organization falls back to the integration option `defaultArticlePublisher`: its
`name` when `hiringOrganizationName` is not set and its `logo.url` when
`hiringOrganizationLogo` is not set. The organization URL falls back to `siteUrl`. See
[Integration options](../../reference/options/).

Recommended fields (`validThrough`, `employmentType`, `baseSalary`, `identifier`,
`directApply`) are reported after the build when missing, unless `warnOnMissingRecommended`
is off.
