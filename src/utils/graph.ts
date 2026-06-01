/**
 * Registers a schema object in the Astro request locals graph store.
 * This is used to collect all structured data on a page and render it as a single @graph block.
 */
export function registerSchema(locals: any, schema: Record<string, any>) {
  if (!locals) return;
  if (!locals.structuredDataGraph) {
    locals.structuredDataGraph = [];
  }
  
  // Prevent duplicate entries of identical items
  const isDuplicate = locals.structuredDataGraph.some(
    (item: any) => item['@type'] === schema['@type'] && JSON.stringify(item) === JSON.stringify(schema)
  );
  
  if (!isDuplicate) {
    locals.structuredDataGraph.push(schema);
  }
}
