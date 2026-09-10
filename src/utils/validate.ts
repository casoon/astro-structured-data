import { z } from 'zod';
import { sitemapShape } from '../zod.js';

type SitemapOutput = z.output<z.ZodObject<typeof sitemapShape>>;

// Attributes Astro itself adds to component props (e.g. `data-astro-cid-*` for scoped styles).
const FRAMEWORK_PROP_RE = /^data-astro-/;

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
  const ownProps = Object.fromEntries(Object.entries(props).filter(([key]) => !FRAMEWORK_PROP_RE.test(key)));
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
