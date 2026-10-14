---
title: On-demand rendering
description: How the integration behaves for pages rendered on request with an adapter, and what changes compared to a static build.
order: 6
---

The components work the same in static builds, in `astro dev` and on pages rendered on
request with an adapter (`output: 'server'`, or `export const prerender = false`). A few
things differ in when and where they happen.

## Errors fail the request

Props are validated when the page renders. In a static build that is during `astro build`,
so wrong data stops the build. On a page rendered on demand it is the request: the page
answers with Astro's error response instead of serving wrong structured data. Data from a
CMS or an API therefore needs the same care as any other input. Validate it where it comes
in, for example with the exported [Zod schemas](../content-collections/), and decide there
what a page without valid data shows.

## Responses are buffered

The integration adds a middleware that completes every HTML page once it has rendered: it
inserts the `@graph` block in [graph mode](../graph-mode/), checks the sitemap hints of the
page and inserts the [meta tags](../meta-tags/) with `generateMeta`. Components that await
data register their schemas only while the page streams, so the middleware reads the whole
response before it changes anything. HTML responses are therefore sent in one piece instead
of being streamed.

For most pages this makes no measurable difference. For very large pages rendered on demand,
it delays the first byte until the page is complete. Responses that are not HTML, and
responses without a body, are passed through unchanged.

## The build report covers built HTML

The [build report](../dev-toolbar/#the-build-report) reads the HTML files the build writes,
which are the prerendered pages. Pages rendered on demand are not in it. For them, the
validation at render time applies, and the Dev Toolbar panel shows their output in
`astro dev`.

## Site URL

Canonical URLs, `og:url` and relative image URLs are built from `siteUrl` (or Astro's
`site`), not from the host of the request. Set it to the public URL of the site, also when the
server runs behind a proxy.
