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

const TAG_RE = /<(meta|link)\b[^>]*>/gi;
const ATTR_RE = /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;

function existingKeys(head: string): Set<string> {
  const keys = new Set<string>();
  for (const [tag, element] of head.matchAll(TAG_RE)) {
    const attrs: Record<string, string> = {};
    for (const [, name, dq, sq, bare] of tag.matchAll(ATTR_RE)) {
      attrs[name.toLowerCase()] = (dq ?? sq ?? bare).trim();
    }
    if (element.toLowerCase() === 'meta') {
      if (attrs.name) keys.add(`name:${attrs.name.toLowerCase()}`);
      if (attrs.property) keys.add(`property:${attrs.property.toLowerCase()}`);
    } else {
      const rel = (attrs.rel ?? '').toLowerCase().split(/\s+/);
      if (rel.includes('canonical')) keys.add('link:canonical');
      if (rel.includes('alternate') && attrs.hreflang) keys.add(`hreflang:${attrs.hreflang.toLowerCase()}`);
    }
  }
  return keys;
}

/**
 * Inserts the generated meta/link tags at the end of `<head>`. Tags the page already
 * defines (same name/property, canonical, or hreflang) are kept and not duplicated.
 */
export function injectMetaTags(html: string, seo: GeneratedMeta, page: string): string {
  const headEnd = html.search(/<\/head\s*>/i);
  if (headEnd === -1) {
    throw new Error(`[astro-structured-data] generateMeta is enabled but ${page} has no </head> to insert the meta tags into.`);
  }
  const headStart = Math.max(html.search(/<head[\s>]/i), 0);
  const existing = existingKeys(html.slice(headStart, headEnd));
  const tags = buildTags(seo).filter((tag) => !existing.has(tag.key));
  if (tags.length === 0) return html;
  return html.slice(0, headEnd) + tags.map((tag) => tag.html).join('') + html.slice(headEnd);
}
