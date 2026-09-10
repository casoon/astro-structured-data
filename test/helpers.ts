import { experimental_AstroContainer as AstroContainer } from 'astro/container';

let container: Awaited<ReturnType<typeof AstroContainer.create>> | undefined;

export interface Rendered {
  html: string;
  scripts: Array<{ attrs: string; data: any }>;
}

/** Renders a component the way a page at `path` would; the request origin deliberately differs from `siteUrl`. */
export async function render(
  Component: any,
  props: Record<string, unknown> = {},
  locals: Record<string, any> = {},
  path = '/blog/post/'
): Promise<Rendered> {
  container ??= await AstroContainer.create();
  const html = await container.renderToString(Component, {
    props,
    locals,
    request: new Request(`http://localhost:4321${path}`),
  });
  // The empty <SchemaGraph /> placeholder is filled in by the middleware, which does not run here.
  const scripts = [...html.matchAll(/<script type="application\/ld\+json"([^>]*)>([\s\S]*?)<\/script>/g)]
    .filter(([, , json]) => json !== '')
    .map(([, attrs, json]) => ({ attrs: attrs.trim(), data: JSON.parse(json) }));
  return { html, scripts };
}

export const address = {
  streetAddress: 'Hauptstraße 1',
  addressLocality: 'Berlin',
  postalCode: '10115',
  addressCountry: 'DE',
};
