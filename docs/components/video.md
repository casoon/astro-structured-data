---
title: VideoSchema
description: Outputs a VideoObject with thumbnail, upload date, duration, video URLs and view count; use it on pages whose main content is a video.
order: 8
---

`VideoSchema` describes one video on the page. It outputs a
[`VideoObject`](https://schema.org/VideoObject) and targets Google's
[video rich results](https://developers.google.com/search/docs/appearance/structured-data/video)
(thumbnail, duration and upload date in search results, the Videos tab and Discover). Google
needs a way to fetch the video: the file itself (`contentUrl`), a player (`embedUrl`) or both.

## Usage

A tutorial page with an embedded YouTube video:

```astro
---
// src/pages/videos/[slug].astro
import { getCollection } from 'astro:content';
import { VideoSchema } from '@casoon/astro-structured-data/components';

export async function getStaticPaths() {
  const videos = await getCollection('videos');
  return videos.map((video) => ({ params: { slug: video.id }, props: { video } }));
}

const { data } = Astro.props.video;
// data.youtubeId: 'abc123xyz00', data.views: 15420
---
<VideoSchema
  name={data.title}
  description={data.description}
  thumbnailUrl={`https://i.ytimg.com/vi/${data.youtubeId}/maxresdefault.jpg`}
  uploadDate={data.uploadDate}
  duration={data.duration}
  embedUrl={`https://www.youtube.com/embed/${data.youtubeId}`}
  interactionCount={data.views}
  publisher={{ name: 'Example Media', logoUrl: 'https://example.com/logo.png' }}
/>

<iframe src={`https://www.youtube.com/embed/${data.youtubeId}`} title={data.title} allowfullscreen></iframe>
```

## Output

On `/videos/server-islands/`, with `uploadDate: '2026-06-01T10:00:00+02:00'` and
`duration: 'PT8M45S'`:

```json
{
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": "Astro server islands tutorial",
  "description": "Learn how to use server islands in Astro.",
  "thumbnailUrl": [
    "https://i.ytimg.com/vi/abc123xyz00/maxresdefault.jpg"
  ],
  "uploadDate": "2026-06-01T10:00:00+02:00",
  "duration": "PT8M45S",
  "embedUrl": "https://www.youtube.com/embed/abc123xyz00",
  "interactionStatistic": {
    "@type": "InteractionCounter",
    "interactionType": {
      "@type": "WatchAction"
    },
    "userInteractionCount": 15420
  },
  "publisher": {
    "@type": "Organization",
    "name": "Example Media",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.png"
    }
  }
}
```

- `thumbnailUrl` is always output as an array.
- `interactionCount` becomes an `InteractionCounter` with `WatchAction`, the count as number.
- `publisher` becomes an `Organization`; `logoUrl` is output as `logo` (`ImageObject`).

## Self-hosted video

A video file served by the site itself uses `contentUrl`. `expires` tells search engines when
the video is no longer available:

```astro
<VideoSchema
  name="Launch event recap"
  description="Highlights from the launch event."
  thumbnailUrl={['/videos/launch-recap-16x9.jpg', '/videos/launch-recap-4x3.jpg']}
  uploadDate="2026-09-15"
  duration="PT2M30S"
  contentUrl="/videos/launch-recap.mp4"
  expires="2027-09-15"
/>
```

```json
{
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": "Launch event recap",
  "description": "Highlights from the launch event.",
  "thumbnailUrl": [
    "/videos/launch-recap-16x9.jpg",
    "/videos/launch-recap-4x3.jpg"
  ],
  "uploadDate": "2026-09-15",
  "duration": "PT2M30S",
  "contentUrl": "/videos/launch-recap.mp4",
  "expires": "2027-09-15"
}
```

Root-relative URLs are written as given, not resolved against `siteUrl`. Pass absolute URLs
if you want absolute URLs in the JSON-LD.

## Props

| Prop | Type | Required | Default / fallback | Description |
| --- | --- | --- | --- | --- |
| `name` | `string` | Yes | – | Video title |
| `description` | `string` | Yes | – | Video description |
| `thumbnailUrl` | `string \| string[]` (URL or `/path`) | Yes | – | Thumbnail image(s), output as an array |
| `uploadDate` | `string \| Date` | Yes | – | Date of first publication, ISO 8601 |
| `duration` | `string` (ISO 8601 duration) | No (recommended) | – | Length, e.g. `'PT8M45S'` |
| `contentUrl` | `string` (URL or `/path`) | One of `contentUrl` / `embedUrl` (recommended) | – | URL of the video file |
| `embedUrl` | `string` (URL or `/path`) | One of `contentUrl` / `embedUrl` (recommended) | – | URL of the player, e.g. `https://www.youtube.com/embed/…` |
| `interactionCount` | `number \| string` | No (recommended) | – | View count; a whole number, as a string digits only |
| `expires` | `string \| Date` | No | – | Date after which the video is no longer available; not before `uploadDate` |
| `publisher` | `{ name: string; logoUrl?: string; id?: string }` | No (recommended) | – | Publishing organisation; `logoUrl` URL or `/path`; `id` output as `@id` |
| `changefreq`, `priority` | sitemap hints | No | – | See [Meta tags and sitemap hints](../../guides/meta-tags/) |

"URL or `/path`" means an absolute `http(s)` URL or a root-relative path. `publisher` allows
no other fields.

## Rules

Violations fail the build (see [Validation](../../guides/validation/)):

- At least one of `contentUrl` and `embedUrl` is required
  (`Either contentUrl or embedUrl is required for Google video indexing`).
- `expires` must not be before `uploadDate`. Dates are ISO 8601 or `Date` objects; a `Date`
  is output as an ISO date-time in UTC.
- `duration` is an ISO 8601 duration (`PT8M45S`, `PT1H2M`).
- Text fields must not be empty.

The component uses no integration options. Recommended fields (`duration`, `contentUrl`,
`embedUrl`, `interactionStatistic`, `publisher`) are reported after the build when missing,
unless `warnOnMissingRecommended` is off. Both `contentUrl` and `embedUrl` count as
recommended, so a video with only one of them gets a warning for the other.

With `generateMeta`, a `VideoSchema` can drive the page's meta tags, including
`video:duration` (see [Meta tags and sitemap hints](../../guides/meta-tags/)).
