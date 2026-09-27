import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';

// Renders the files in ../examples with the package itself (the same components a site
// imports), exactly as the test suite does: through Astro's container API.
let container: AstroContainer | undefined;

const JSONLD_RE = /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;

export type Rendered = { ok: true; jsonLd: unknown[] } | { ok: false; error: string };

/** Renders `Component` as the page at `path` and returns its JSON-LD, or the error that stops the build. */
export async function renderExample(Component: AstroComponentFactory, path: string): Promise<Rendered> {
  container ??= await AstroContainer.create();
  try {
    const html = await container.renderToString(Component, {
      request: new Request(`https://example.com${path}`),
    });
    return { ok: true, jsonLd: [...html.matchAll(JSONLD_RE)].map(([, json]) => JSON.parse(json)) };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

const ESC = '\u001b[';
const paint = (code: number, text: string) => `${ESC}${code}m${text}${ESC}0m`;

/** Pretty-printed JSON with ANSI colours (keys cyan, strings green, numbers yellow), for the theme's terminal surface. */
export function jsonToAnsi(value: unknown): string {
  return JSON.stringify(value, null, 2).replace(
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null)\b/g,
    (match, str: string | undefined, colon: string | undefined, literal: string | undefined) => {
      if (str) return colon ? paint(36, str) + colon : paint(32, str);
      if (literal) return paint(33, literal);
      return match;
    }
  );
}

/** The error message as the build prints it: first line red. */
export function errorToAnsi(message: string): string {
  const [first, ...rest] = message.split('\n');
  return [paint(31, first), ...rest].join('\n');
}
