import type { APIContext, MiddlewareHandler } from 'astro';
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
 * register their schemas only later. With graph mode or meta tags the whole body is therefore
 * read before the schema store is used, which means those HTML responses are buffered; without
 * both, the page streams (`streamPage`).
 */
export const onRequest: MiddlewareHandler = async (context, next) => {
  resetSchemas(context.locals, context.url.pathname);

  const response = await next();
  if (!response.headers.get('content-type')?.includes('text/html')) return response;
  // Nothing to complete without a body — and 204/205/304 must not get one.
  if (response.body === null) return response;

  const config = getGlobalConfig();
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  if (!config.useGraph && !config.generateMeta) {
    return new Response(await streamPage(response.body, context), { status: response.status, statusText: response.statusText, headers });
  }

  // Reading the body drives the render to completion; only then is the store final.
  let html = await response.text();
  const { page, registered, items } = completeStore(context);

  if (config.useGraph) html = insertGraph(html, items, page);
  else html = relinkInlineSchemas(html, registered, items);

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
      }, findPageItems(items));
      html = injectMetaTags(html, seo, page);
    }
  }

  return new Response(html, { status: response.status, statusText: response.statusText, headers });
};

/**
 * The page's schemas once it has rendered, with page references resolved. The page is the
 * one the components rendered under: a rewrite (`next('/target')`, `context.rewrite()`)
 * renders another path than the requested one.
 */
function completeStore(context: APIContext) {
  const config = getGlobalConfig();
  const page = getRegisteredPage(context.locals) ?? context.url.pathname;
  const registered = getRegisteredSchemas(context.locals, page);
  // `context.rewrite()` runs the middleware again for the target; the inner run completes the
  // page, so this one must not complete it a second time.
  resetSchemas(context.locals);
  return { page, registered, items: linkToPageNode(registered, pageUrl(page, config.siteUrl!)) };
}

/**
 * Without graph mode and meta tags nothing is inserted, so the page streams. The sitemap hints
 * are checked before every chunk: a schema registers before its block renders, so a conflicting
 * block is never sent — the response breaks off there instead.
 *
 * A schema with a `mainEntityOfPage` (`ArticleSchema`) may still be relinked at the end
 * (`linkToPageNode`), unless a page schema with the page's own URL registered before it and so
 * fixed the page node. Otherwise the rest of the page is held back from that schema on.
 *
 * The first chunk is checked before the response starts, so an error up to there still fails
 * the request with Astro's error response; a later one breaks off the response.
 */
async function streamPage(body: ReadableStream<Uint8Array>, context: APIContext): Promise<ReadableStream<Uint8Array>> {
  const decoder = new TextDecoder();
  let held: string | undefined;
  const reader = body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      const page = getRegisteredPage(context.locals);
      const registered = getRegisteredSchemas(context.locals, page);
      collectSitemapHints(registered); // throws on invalid or conflicting hints
      if (held === undefined && registered.some((item) => item.mainEntityOfPage) && !pageNodeFixed(registered, page ?? context.url.pathname)) {
        held = '';
      }
      if (held === undefined) controller.enqueue(chunk);
      else held += decoder.decode(chunk, { stream: true });
    },
    flush(controller) {
      const { registered, items } = completeStore(context);
      collectSitemapHints(items);
      if (held === undefined) return;
      const html = held + decoder.decode();
      controller.enqueue(new TextEncoder().encode(relinkInlineSchemas(html, registered, items)));
    },
  })).getReader();

  const first = await reader.read();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      if (first.done) controller.close();
      else controller.enqueue(first.value);
    },
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) controller.close();
      else controller.enqueue(value);
    },
    cancel: (reason) => reader.cancel(reason),
  });
}

/** The first page schema with a `url` decides the page node; with the page's own URL nothing is relinked. */
function pageNodeFixed(registered: Record<string, any>[], page: string): boolean {
  const first = findPageItems(registered).find((item) => typeof item.url === 'string');
  return first?.url === pageUrl(page, getGlobalConfig().siteUrl!);
}

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
