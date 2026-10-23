---
title: ProfilePageSchema
description: Outputs a ProfilePage whose main entity is a Person, for author and team member pages.
order: 13
---

`ProfilePageSchema` produces a [`ProfilePage`](https://schema.org/ProfilePage) whose
`mainEntity` is a [`Person`](https://schema.org/Person). Use it on pages about one person,
such as author pages on a blog or team member pages. Google uses profile pages to understand
the creators behind content; see [Google: Profile
page](https://developers.google.com/search/docs/appearance/structured-data/profile-page).

The main entity is always a `Person`. For an organization, use
[`OrganizationSchema`](../organization/).

## Example

Author pages generated from a content collection:

```astro
---
// src/pages/team/[slug].astro
import { getCollection } from 'astro:content';
import Layout from '../../layouts/Layout.astro';
import { ProfilePageSchema } from '@casoon/astro-structured-data/components';

export async function getStaticPaths() {
  const people = await getCollection('team');
  return people.map((person) => ({ params: { slug: person.id }, props: { person } }));
}

const { person } = Astro.props;
---
<Layout title={person.data.name}>
  <ProfilePageSchema
    name={person.data.name}
    description={person.data.bio}
    imageUrl={person.data.avatar}
    sameAs={person.data.profiles}
    publishingPrinciples="/editorial-guidelines/"
  />
</Layout>
```

## Output

For an entry with the name "Ada Lovelace", a bio, the avatar `/images/team/ada.jpg` and two
profile links:

```json
{
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "mainEntity": {
    "@type": "Person",
    "name": "Ada Lovelace",
    "image": "/images/team/ada.jpg",
    "description": "Writes about compilers and the history of computing.",
    "sameAs": [
      "https://github.com/ada",
      "https://mastodon.social/@ada"
    ],
    "publishingPrinciples": "/editorial-guidelines/"
  }
}
```

All props describe the person and end up on `mainEntity`; the ProfilePage itself has no
further properties. URLs are output as given.

## Props

| Prop | Type | Required | Default/fallback | Description |
| --- | --- | --- | --- | --- |
| `name` | `string` | Yes | – | Name of the person. |
| `id` | `string` | No | – | Output as the person's `@id`, the target for `authorId` / `author.id` in other schemas. |
| `description` | `string` | No (recommended) | – | Short bio, output as `mainEntity.description`. |
| `imageUrl` | `string` (absolute URL or `/path`) | No (recommended) | – | Photo of the person, output as `mainEntity.image`. |
| `sameAs` | `string[]` (absolute http(s) URLs) | No (recommended) | – | Profiles of the person elsewhere, output as `mainEntity.sameAs`. |
| `publishingPrinciples` | `string` (absolute URL or `/path`) | No | – | Page with the person's editorial or publishing guidelines. |
| `changefreq` | `'always' \| 'hourly' \| 'daily' \| 'weekly' \| 'monthly' \| 'yearly' \| 'never'` | No | – | Sitemap hint, see [Sitemap hints](../../guides/meta-tags/#sitemap-hints). |
| `priority` | `number` (0–1) | No | – | Sitemap hint. |

## Rules

- `name` must not be empty.
- Every `sameAs` entry must be an absolute `http(s)` URL; an empty list is rejected. A
  collection field that may be empty should be passed as `undefined` rather than `[]`.
- `imageUrl` and `publishingPrinciples` must be absolute `http(s)` URLs or root-relative paths.
- Recommended fields: `description`, `imageUrl`, `sameAs` (reported as
  `mainEntity.description`, `mainEntity.image`, `mainEntity.sameAs`). Each missing one
  produces a warning after the build (see [Validation](../../guides/validation/)).

## Meta tags

With `generateMeta: true` a ProfilePage can be the primary schema: the person's name becomes
`og:title` and `twitter:title`, the bio the description, and the image `og:image` and
`twitter:image` (resolved to an absolute URL with `siteUrl`). For the example above:

```html
<link rel="canonical" href="https://example.com/team/ada-lovelace/">
<meta name="description" content="Writes about compilers and the history of computing.">
<meta property="og:title" content="Ada Lovelace">
<meta property="og:description" content="Writes about compilers and the history of computing.">
<meta property="og:url" content="https://example.com/team/ada-lovelace/">
<meta property="og:image" content="https://example.com/images/team/ada.jpg">
<meta property="og:type" content="website">
<meta name="twitter:title" content="Ada Lovelace">
<meta name="twitter:description" content="Writes about compilers and the history of computing.">
<meta name="twitter:image" content="https://example.com/images/team/ada.jpg">
<meta name="twitter:card" content="summary_large_image">
```

See [Meta tags and sitemap hints](../../guides/meta-tags/).
