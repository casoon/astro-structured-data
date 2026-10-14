import { tokenize } from './html.js';
import type { GeneratedMeta } from './meta.js';

interface Tag {
  /** Identity used to detect a tag the page already defines itself. */
  key: string;
  html: string;
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildTags(seo: GeneratedMeta): Tag[] {
  const tags: Tag[] = [];
  const meta = (attr: 'name' | 'property', key: string, content: string) =>
    tags.push({ key: `${attr}:${key.toLowerCase()}`, html: `<meta ${attr}="${escapeAttr(key)}" content="${escapeAttr(content)}">` });

  if (seo.canonical) tags.push({ key: 'link:canonical', html: `<link rel="canonical" href="${escapeAttr(seo.canonical)}">` });
  if (seo.description) meta('name', 'description', seo.description);
  if (seo.robots) meta('name', 'robots', seo.robots);
  if (seo.author) meta('name', 'author', seo.author);
  if (seo.readingTime) meta('name', 'reading-time', seo.readingTime);
  for (const { href, hreflang } of seo.alternates ?? []) {
    tags.push({
      key: `hreflang:${hreflang.toLowerCase()}`,
      html: `<link rel="alternate" hreflang="${escapeAttr(hreflang)}" href="${escapeAttr(href)}">`,
    });
  }
  for (const [property, value] of Object.entries(seo.openGraph)) {
    for (const content of Array.isArray(value) ? value : [value]) meta('property', property, content);
  }
  for (const [name, content] of Object.entries(seo.twitter)) meta('name', name, content);
  return tags;
}

interface HeadScan {
  /** Offset of the real `</head>` end tag. */
  headEnd: number;
  keys: Set<string>;
  canonical?: string;
}

/**
 * Finds the end of `<head>` and the meta/link tags the page defines before it. Uses the
 * tokenizer, so tags in comments, scripts or other text content are not mistaken for real ones.
 */
function scanHead(html: string): HeadScan | undefined {
  const keys = new Set<string>();
  let canonical: string | undefined;
  // `<template>` content is inert: its tags do not apply to the page, and a `</head>` inside
  // it is ignored by browsers.
  let templateDepth = 0;
  for (const tag of tokenize(html)) {
    if (tag.name === 'template') {
      templateDepth = Math.max(templateDepth + (tag.kind === 'start' ? 1 : -1), 0);
      continue;
    }
    if (templateDepth > 0) continue;
    if (tag.kind === 'end') {
      if (tag.name === 'head') return { headEnd: tag.start, keys, canonical };
      continue;
    }
    const attrs = tag.attrs;
    if (tag.name === 'meta') {
      if (attrs.name) keys.add(`name:${attrs.name.trim().toLowerCase()}`);
      if (attrs.property) keys.add(`property:${attrs.property.trim().toLowerCase()}`);
    } else if (tag.name === 'link') {
      const rel = (attrs.rel ?? '').toLowerCase().split(/\s+/);
      if (rel.includes('canonical')) {
        keys.add('link:canonical');
        if (attrs.href) canonical ??= attrs.href.trim();
      }
      if (rel.includes('alternate') && attrs.hreflang) keys.add(`hreflang:${attrs.hreflang.trim().toLowerCase()}`);
    }
  }
  return undefined;
}

/**
 * Inserts the generated meta/link tags at the end of `<head>`. Tags the page already
 * defines (same name/property, canonical, or hreflang) are kept and not duplicated.
 * A canonical link the page sets itself also becomes the generated `og:url`, so both agree.
 */
export function injectMetaTags(html: string, seo: GeneratedMeta, page: string): string {
  const existing = scanHead(html);
  if (!existing) {
    throw new Error(`[astro-structured-data] generateMeta is enabled but ${page} has no </head> to insert the meta tags into.`);
  }
  const { headEnd } = existing;
  if (existing.canonical && seo.openGraph['og:url']) {
    const ogUrl = new URL(existing.canonical, seo.openGraph['og:url'] as string).href;
    seo = { ...seo, openGraph: { ...seo.openGraph, 'og:url': ogUrl } };
  }
  // Image details belong to their image: when the page sets its own image, none of the
  // schema image's width, height, type or alt are added. Twitter falls back to og:image.
  const ownOgImage = existing.keys.has('property:og:image');
  const ownTwitterImage = ownOgImage || existing.keys.has('name:twitter:image');
  const tags = buildTags(seo).filter((tag) =>
    !existing.keys.has(tag.key) &&
    !(ownOgImage && tag.key.startsWith('property:og:image')) &&
    !(ownTwitterImage && tag.key.startsWith('name:twitter:image'))
  );
  if (tags.length === 0) return html;
  return html.slice(0, headEnd) + tags.map((tag) => tag.html).join('') + html.slice(headEnd);
}
