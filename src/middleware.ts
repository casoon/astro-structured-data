import type { MiddlewareHandler } from 'astro';
import { getGlobalConfig } from 'virtual:astro-structured-data/config';
import { getRegisteredPage, getRegisteredSchemas, resetSchemas } from './utils/graph.js';
import { injectMetaTags } from './utils/head.js';
import { collectSitemapHints, GRAPH_PLACEHOLDER, renderGraphScript, serializeSchemaItem } from './utils/json-ld.js';
import { findPageItems, findPrimaryItem, generateMetaTags, linkToPageNode, pageUrl } from './utils/meta.js';

/**
 * Completes every HTML page once it has fully rendered: inserts the `@graph` block (graph
 * mode), verifies the page-level invariants and — with `generateMeta` — inserts the meta tags
 * of the primary schema into `<head>`.
 *
 * `next()` resolves while the body is still streaming, and components that await data
 * register their schemas only later. The whole body is therefore read before the schema store
 * is used, which means HTML responses are buffered instead of streamed.
 *
 * The page is the one the components rendered under, read from the store after rendering: a
 * rewrite (`next('/target')`, `context.rewrite()`) renders another path than the requested one.
 */
export const onRequest: MiddlewareHandler = async (context, next) => {
  resetSchemas(context.locals, context.url.pathname);

  const response = await next();
  if (!response.headers.get('content-type')?.includes('text/html')) return response;
  // Nothing to complete without a body — and 204/205/304 must not get one.
  if (response.body === null) return response;

  // Reading the body drives the render to completion; only then is the store final.
  let html = await response.text();
  const page = getRegisteredPage(context.locals) ?? context.url.pathname;
  const registered = getRegisteredSchemas(context.locals, page);
  // `context.rewrite()` runs the middleware again for the target; the inner run completes the
  // page, so this one must not complete it a second time.
  resetSchemas(context.locals);
  const config = getGlobalConfig();
  const canonicalUrl = pageUrl(page, config.siteUrl!);
  const items = linkToPageNode(registered, canonicalUrl);

  if (config.useGraph) html = insertGraph(html, items, page);
  else html = relinkInlineSchemas(html, registered, items);

  if (items.length > 0) {
    collectSitemapHints(items); // throws on invalid or conflicting hints
    const primaryItem = config.generateMeta ? findPrimaryItem(items) : undefined;
    if (primaryItem) {
      const seo = generateMetaTags(primaryItem, {
        siteUrl: config.siteUrl,
        canonicalUrl,
        siteName: config.siteName,
        locale: config.locale,
        twitterSite: config.twitterSite,
        twitterCreator: config.twitterCreator,
      }, findPageItems(items));
      html = injectMetaTags(html, seo, page);
    }
  }

  const headers = new Headers(response.headers);
  headers.delete('content-length');
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
};

/** Without graph mode, rewrites the blocks whose page reference was resolved after they rendered. */
function relinkInlineSchemas(html: string, registered: Record<string, any>[], items: Record<string, any>[]): string {
  registered.forEach((item, i) => {
    if (items[i] !== item) html = html.split(serializeSchemaItem(item)).join(serializeSchemaItem(items[i]));
  });
  return html;
}

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
