---
title: EventSchema
description: Outputs an Event with venue, online location, tickets, organizer and performer; use it on pages for concerts, meetups, conferences and webinars.
order: 5
---

`EventSchema` describes one event. It outputs an [`Event`](https://schema.org/Event) whose
`location` is a [`Place`](https://schema.org/Place), a
[`VirtualLocation`](https://schema.org/VirtualLocation) or both, depending on the attendance
mode, and targets Google's
[event experience](https://developers.google.com/search/docs/appearance/structured-data/event)
(date, place and tickets in event listings).

## Usage

An event page rendered from a content collection. If the frontmatter uses the prop names,
the collection schema can be `eventZodSchema`, so wrong data is reported where it is written
(see [Zod schemas and content](../../guides/content-collections/)). Here the frontmatter has
its own field names, mapped to the props in the page:

```yaml
# src/content/events/astro-meetup-berlin.md (frontmatter)
name: Astro Meetup Berlin
description: Talks on content collections and structured data, followed by drinks.
startDate: '2026-11-19T18:30:00+01:00'
endDate: '2026-11-19T22:00:00+01:00'
image: /images/events/meetup.jpg
venue: Hub Berlin
address:
  streetAddress: Alexanderplatz 1
  addressLocality: Berlin
  postalCode: '10178'
  addressCountry: DE
ticketPrice: 15
speaker: Jane Doe
```

```astro
---
// src/pages/events/[slug].astro
import { getCollection } from 'astro:content';
import { EventSchema } from '@casoon/astro-structured-data/components';

export async function getStaticPaths() {
  const events = await getCollection('events');
  return events.map((event) => ({ params: { slug: event.id }, props: { event } }));
}

const { data } = Astro.props.event;
---
<EventSchema
  name={data.name}
  description={data.description}
  startDate={data.startDate}
  endDate={data.endDate}
  imageUrl={data.image}
  locationName={data.venue}
  locationAddress={data.address}
  price={data.ticketPrice}
  priceCurrency="EUR"
  availability="InStock"
  organizer={{ name: 'Astro Berlin', url: 'https://example.com' }}
  performer={{ name: data.speaker }}
/>
```

Quote date-times in YAML. Unquoted, YAML may turn them into `Date` objects, which are output
in UTC (`2026-11-19T17:30:00.000Z`) instead of with the offset as written.

## Output

On `/events/astro-meetup-berlin/`:

```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Astro Meetup Berlin",
  "startDate": "2026-11-19T18:30:00+01:00",
  "endDate": "2026-11-19T22:00:00+01:00",
  "description": "Talks on content collections and structured data, followed by drinks.",
  "image": [
    "/images/events/meetup.jpg"
  ],
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "eventStatus": "https://schema.org/EventScheduled",
  "location": {
    "@type": "Place",
    "name": "Hub Berlin",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Alexanderplatz 1",
      "addressLocality": "Berlin",
      "postalCode": "10178",
      "addressCountry": "DE"
    }
  },
  "offers": {
    "@type": "Offer",
    "price": 15,
    "priceCurrency": "EUR",
    "availability": "https://schema.org/InStock",
    "url": "https://example.com/events/astro-meetup-berlin/"
  },
  "organizer": {
    "@type": "Organization",
    "name": "Astro Berlin",
    "url": "https://example.com"
  },
  "performer": {
    "@type": "Person",
    "name": "Jane Doe"
  }
}
```

- `attendanceMode` defaults to `Offline` and `status` to `Scheduled`; both are output as
  schema.org URLs.
- The ticket offer links to `url` when set, otherwise to the current page.
- `imageUrl` is always output as an array; root-relative paths are written as given.

## Online event

An online event has no venue. Its `onlineUrl` becomes a `VirtualLocation`:

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

```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Astro Live Webinar",
  "startDate": "2026-10-20T17:00:00+02:00",
  "endDate": "2026-10-20T18:30:00+02:00",
  "description": "Structured data in Astro, live with Q&A.",
  "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
  "eventStatus": "https://schema.org/EventScheduled",
  "location": {
    "@type": "VirtualLocation",
    "url": "https://example.com/live"
  },
  "offers": {
    "@type": "Offer",
    "price": 0,
    "priceCurrency": "EUR",
    "availability": "https://schema.org/InStock",
    "url": "https://example.com/events/astro-live-webinar/"
  },
  "organizer": {
    "@type": "Organization",
    "name": "Example GmbH",
    "url": "https://example.com"
  }
}
```

`price={0}` describes a free event and still produces an offer.

## Hybrid event

`attendanceMode="Mixed"` needs both the venue and `onlineUrl`, and outputs both locations.
This example also shows a rescheduled event whose tickets are sold on another site:

```astro
<EventSchema
  name="Example Conf 2027"
  startDate="2027-03-11"
  endDate="2027-03-12"
  attendanceMode="Mixed"
  status="Rescheduled"
  locationName="Kulturbrauerei"
  locationAddress={{
    streetAddress: 'Schönhauser Allee 36',
    addressLocality: 'Berlin',
    postalCode: '10435',
    addressCountry: 'DE',
  }}
  onlineUrl="https://example.com/conf/stream"
  url="https://tickets.example.org/conf-2027"
  price="249.00"
  priceCurrency="EUR"
  availability="PreOrder"
/>
```

```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Example Conf 2027",
  "startDate": "2027-03-11",
  "endDate": "2027-03-12",
  "url": "https://tickets.example.org/conf-2027",
  "eventAttendanceMode": "https://schema.org/MixedEventAttendanceMode",
  "eventStatus": "https://schema.org/EventRescheduled",
  "location": [
    {
      "@type": "Place",
      "name": "Kulturbrauerei",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Schönhauser Allee 36",
        "addressLocality": "Berlin",
        "postalCode": "10435",
        "addressCountry": "DE"
      }
    },
    {
      "@type": "VirtualLocation",
      "url": "https://example.com/conf/stream"
    }
  ],
  "offers": {
    "@type": "Offer",
    "price": "249.00",
    "priceCurrency": "EUR",
    "availability": "https://schema.org/PreOrder",
    "url": "https://tickets.example.org/conf-2027"
  }
}
```

## Props

| Prop | Type | Required | Default / fallback | Description |
| --- | --- | --- | --- | --- |
| `name` | `string` | Yes | – | Event name |
| `startDate` | `string \| Date` | Yes | – | Start date or date-time, ISO 8601 |
| `endDate` | `string \| Date` | No (recommended) | – | End date or date-time; not before `startDate` |
| `description` | `string` | No (recommended) | – | Event description |
| `imageUrl` | `string \| string[]` (URL or `/path`) | No (recommended) | – | Event image(s), output as an array |
| `url` | `string` (absolute URL) | No (recommended) | – | Event page or ticket shop; also the offer URL |
| `attendanceMode` | `'Offline' \| 'Online' \| 'Mixed'` | No | `'Offline'` | Output as `eventAttendanceMode` |
| `status` | `'Scheduled' \| 'Cancelled' \| 'Postponed' \| 'Rescheduled'` | No | `'Scheduled'` | Output as `eventStatus` |
| `locationName` | `string` | Offline / Mixed | – | Venue name |
| `locationAddress` | `PostalAddress` | Offline / Mixed | – | `{ streetAddress, addressLocality, addressRegion?, postalCode, addressCountry }` |
| `onlineUrl` | `string` (absolute URL) | Online / Mixed | – | Stream or event platform URL, output as `VirtualLocation` |
| `price` | `number \| string` | No (recommended) | – | Ticket price; `0` for free events; a string must be numeric like `'249.00'` |
| `priceCurrency` | `string` (ISO 4217) | No (recommended) | – | Currency, e.g. `'EUR'` |
| `availability` | `'InStock' \| 'OutOfStock' \| 'PreOrder' \| 'OnlineOnly'` | No | `'InStock'` | Ticket availability; needs `price` |
| `organizer` | `{ name: string; url?: string }` | No (recommended) | – | Organizer, output as `Organization`; `url` absolute |
| `performer` | `{ name: string; url?: string }` | No | – | Performer or speaker, output as `Person`; `url` absolute |
| `changefreq`, `priority` | sitemap hints | No | – | See [Meta tags and sitemap hints](../../guides/meta-tags/) |

"URL or `/path`" means an absolute `http(s)` URL or a root-relative path. In
`locationAddress`, all fields except `addressRegion` are required. `organizer`, `performer`
and `locationAddress` allow no other fields.

## Rules

Violations fail the build (see [Validation](../../guides/validation/)):

- The location follows `attendanceMode`:

  | `attendanceMode` | `locationName` + `locationAddress` | `onlineUrl` | `location` output |
  | --- | --- | --- | --- |
  | `Offline` (default) | required | not allowed | `Place` |
  | `Online` | not allowed | required | `VirtualLocation` |
  | `Mixed` | required | required | `[Place, VirtualLocation]` |

- `price` and `priceCurrency` are set together or not at all. `availability` needs `price`.
- `endDate` must not be before `startDate`. Dates are ISO 8601 or `Date` objects.
- `url`, `onlineUrl`, `organizer.url` and `performer.url` must be absolute `http(s)` URLs.

The component uses no integration defaults apart from `siteUrl` (for the offer URL).
Recommended fields (`endDate`, `description`, `image`, `url`, `offers`, `organizer`) are
reported after the build when missing, unless `warnOnMissingRecommended` is off.
