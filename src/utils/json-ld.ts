import { sitemapShape } from '../zod.js';

// Page-level hints (sitemap, robots, hreflang, reading time) travel on the schema item so
// they reach sitemap attributes and meta tags, but they are not schema.org properties and
// must not end up in the JSON-LD output.
const NON_SCHEMA_KEYS = new Set(['changefreq', 'priority', 'robots', 'noindex', 'nofollow', 'alternates', 'readingTime']);

// `<`, `>`, `&` plus U+2028/U+2029 (line/paragraph separators).
const UNSAFE_CHARS_RE = new RegExp(`[<>&${String.fromCharCode(0x2028, 0x2029)}]`, 'g');

export function stripNonSchemaKeys(item: Record<string, any>): Record<string, any> {
  return Object.fromEntries(Object.entries(item).filter(([key]) => !NON_SCHEMA_KEYS.has(key)));
}

/**
 * Serializes a value for embedding inside `<script type="application/ld+json">` via `set:html`.
 * `set:html` does not escape, so a string containing `</script>` would otherwise close the block
 * and allow HTML/script injection from CMS content. Replacing the unsafe characters with JSON
 * unicode escapes keeps the parsed JSON identical.
 */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(
    UNSAFE_CHARS_RE,
    (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`
  );
}

export interface SitemapHints {
  changefreq?: string;
  priority?: number;
}

/**
 * Collects the sitemap hints of all schema items on a page. Throws on invalid values and on
 * items that disagree — a page has exactly one sitemap entry.
 */
export function collectSitemapHints(items: Record<string, any>[]): SitemapHints {
  const hints: SitemapHints = {};
  for (const item of items) {
    for (const key of ['changefreq', 'priority'] as const) {
      const value = item[key];
      if (value === undefined) continue;
      const parsed = sitemapShape[key].safeParse(value);
      if (!parsed.success) {
        throw new Error(`[astro-structured-data] Invalid sitemap ${key} ${JSON.stringify(value)} on ${item['@type']} schema`);
      }
      if (hints[key] !== undefined && hints[key] !== value) {
        throw new Error(
          `[astro-structured-data] Conflicting sitemap ${key} on one page: ${JSON.stringify(hints[key])} vs ${JSON.stringify(value)}`
        );
      }
      (hints as Record<string, unknown>)[key] = value;
    }
  }
  return hints;
}

export function sitemapAttributes(hints: SitemapHints): Record<string, string> {
  const attrs: Record<string, string> = {};
  if (hints.changefreq !== undefined) attrs['data-sitemap-changefreq'] = hints.changefreq;
  if (hints.priority !== undefined) attrs['data-sitemap-priority'] = hints.priority.toString();
  return attrs;
}

/**
 * Rendered by `<SchemaGraph />` in graph mode. The middleware replaces it with the page's
 * `@graph` block once the page has fully rendered — only then are the schemas of components
 * that await data registered. Left unreplaced it is invalid JSON-LD and fails the build check.
 */
export const GRAPH_PLACEHOLDER = '<script type="application/ld+json" data-structured-data-graph></script>';

/** The single `@graph` script of a page (graph mode). */
export function renderGraphScript(items: Record<string, any>[]): string {
  const graph = items.map((item) => {
    // The root object carries the global @context.
    const { '@context': _, ...rest } = stripNonSchemaKeys(item);
    return rest;
  });
  // Values are validated by collectSitemapHints (enum / number), so they need no escaping.
  const attrs = Object.entries(sitemapAttributes(collectSitemapHints(items)))
    .map(([name, value]) => ` ${name}="${value}"`)
    .join('');
  return `<script type="application/ld+json"${attrs}>${serializeJsonLd({ '@context': 'https://schema.org', '@graph': graph })}</script>`;
}
