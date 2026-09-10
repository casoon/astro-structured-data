import type { MiddlewareHandler } from 'astro';
import { getGlobalConfig } from 'virtual:astro-structured-data/config';
import { getRegisteredSchemas, resetSchemas } from './utils/graph.js';
import { injectMetaTags } from './utils/head.js';
import { collectSitemapHints, GRAPH_PLACEHOLDER, renderGraphScript } from './utils/json-ld.js';
import { findPrimaryItem, generateMetaTags, pageUrl } from './utils/meta.js';

/**
 * Completes every HTML page once it has fully rendered: inserts the `@graph` block (graph
 * mode), verifies the page-level invariants and — with `generateMeta` — inserts the meta tags
 * of the primary schema into `<head>`.
 *
 * `next()` resolves while the body is still streaming, and components that await data
 * register their schemas only later. The whole body is therefore read before the schema store
 * is used, which means HTML responses are buffered instead of streamed.
 */
export const onRequest: MiddlewareHandler = async (context, next) => {
  const page = context.url.pathname;
  resetSchemas(context.locals, page);

  const response = await next();
  if (!response.headers.get('content-type')?.includes('text/html')) return response;
  // Nothing to complete without a body — and 204/205/304 must not get one.
  if (response.body === null) return response;

  // Reading the body drives the render to completion; only then is the store final.
  let html = await response.text();
  const items = getRegisteredSchemas(context.locals, page);
  const config = getGlobalConfig();

  if (config.useGraph) html = insertGraph(html, items, page);

  if (items.length > 0) {
    collectSitemapHints(items); // throws on invalid or conflicting hints
    const primaryItem = config.generateMeta ? findPrimaryItem(items) : undefined;
    if (primaryItem) {
      const seo = generateMetaTags(primaryItem, {
        siteUrl: config.siteUrl,
        canonicalUrl: pageUrl(page, config.siteUrl!),
        siteName: config.siteName,
        locale: config.locale,
        twitterSite: config.twitterSite,
        twitterCreator: config.twitterCreator,
      });
      html = injectMetaTags(html, seo, page);
    }
  }

  const headers = new Headers(response.headers);
  headers.delete('content-length');
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
};

function insertGraph(html: string, items: Record<string, any>[], page: string): string {
  const parts = html.split(GRAPH_PLACEHOLDER);
  if (parts.length > 2) {
    throw new Error(`[astro-structured-data] <SchemaGraph /> is rendered more than once on ${page}. Render it once, e.g. in the base layout.`);
  }
  if (parts.length === 1) {
    if (items.length > 0) {
      throw new Error(
        `[astro-structured-data] useGraph is enabled but <SchemaGraph /> is not rendered on ${page}, so its schemas would be missing. ` +
        'Add <SchemaGraph /> to the base layout.'
      );
    }
    return html;
  }
  return parts[0] + (items.length > 0 ? renderGraphScript(items) : '') + parts[1];
}
