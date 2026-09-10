import { z } from 'zod';
import { sitemapShape } from '../zod.js';

type SitemapOutput = z.output<z.ZodObject<typeof sitemapShape>>;

// Attributes that belong to Astro, not to the component: `slot` (places the component in a
// named slot of its parent, e.g. `<ArticleSchema slot="head" />`) and `data-astro-*`
// (e.g. `data-astro-cid-*` for scoped styles).
const isFrameworkProp = (key: string) => key === 'slot' || key.startsWith('data-astro-');

/**
 * Validates component props against the component's Zod schema (plus the sitemap props).
 * Unknown props are rejected. Throws — failing the build — with a readable error on invalid input.
 */
export function parseProps<T extends z.ZodObject>(
  component: string,
  schema: T,
  props: Record<string, unknown>,
  page: string
): z.output<T> & SitemapOutput {
  const ownProps = Object.fromEntries(Object.entries(props).filter(([key]) => !isFrameworkProp(key)));
  const result = schema.safeExtend(sitemapShape).strict().safeParse(ownProps);
  if (!result.success) {
    throw new Error(
      `[astro-structured-data] <${component}> on ${page} received invalid props:\n${z.prettifyError(result.error)}`
    );
  }
  return result.data as z.output<T> & SitemapOutput;
}

export function fail(component: string, page: string, message: string): never {
  throw new Error(`[astro-structured-data] <${component}> on ${page}: ${message}`);
}
