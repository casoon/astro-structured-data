/**
 * Per-page store of all schema objects rendered on a page, kept in `Astro.locals`. The
 * middleware reads it after the page has fully rendered to build the `@graph` block (graph
 * mode) and the meta tags.
 *
 * `pageKey` scopes the store to the current page. Under static (SSG) output Astro does not
 * guarantee a fresh `locals` object per page, so without this the store would silently
 * accumulate schemas across every page in the build.
 */
export function registerSchema(locals: any, schema: Record<string, any>, pageKey?: string) {
  if (!locals) return;
  if (!locals.structuredDataGraph || locals.__structuredDataGraphPage !== pageKey) {
    resetSchemas(locals, pageKey);
  }

  // Prevent duplicate entries of identical items
  const isDuplicate = locals.structuredDataGraph.some(
    (item: any) => item['@type'] === schema['@type'] && JSON.stringify(item) === JSON.stringify(schema)
  );

  if (!isDuplicate) {
    locals.structuredDataGraph.push(schema);
  }
}

export function resetSchemas(locals: any, pageKey?: string) {
  locals.structuredDataGraph = [];
  locals.__structuredDataGraphPage = pageKey;
}

export function getRegisteredSchemas(locals: any, pageKey?: string): Record<string, any>[] {
  return locals?.__structuredDataGraphPage === pageKey ? (locals.structuredDataGraph ?? []) : [];
}
