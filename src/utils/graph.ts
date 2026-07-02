/**
 * Registers a schema object in the Astro request locals graph store.
 * This is used to collect all structured data on a page and render it as a single @graph block.
 *
 * `pageKey` scopes the store to the current page. Under static (SSG) output without an
 * adapter/middleware, Astro does not guarantee a fresh `locals` object per page, so without
 * this the graph would silently accumulate schemas across every page in the build.
 */
export function registerSchema(locals: any, schema: Record<string, any>, pageKey?: string) {
  if (!locals) return;
  if (!locals.structuredDataGraph || locals.__structuredDataGraphPage !== pageKey) {
    locals.structuredDataGraph = [];
    locals.__structuredDataGraphPage = pageKey;
  }

  // Prevent duplicate entries of identical items
  const isDuplicate = locals.structuredDataGraph.some(
    (item: any) => item['@type'] === schema['@type'] && JSON.stringify(item) === JSON.stringify(schema)
  );

  if (!isDuplicate) {
    locals.structuredDataGraph.push(schema);
  }
}
