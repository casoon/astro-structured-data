import type { AstroIntegration } from 'astro';
import { z } from 'zod';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { missingRecommended, structuredDataOptionsSchema, type StructuredDataOptions } from './zod.js';

export type { StructuredDataOptions };

const JSONLD_RE = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;

export default function structuredData(options: StructuredDataOptions = {}): AstroIntegration {
  const parsed = structuredDataOptionsSchema.safeParse(options);
  if (!parsed.success) {
    throw new Error(`[astro-structured-data] Invalid integration options:\n${z.prettifyError(parsed.error)}`);
  }

  return {
    name: 'astro-structured-data',
    hooks: {
      'astro:config:setup': ({ addDevToolbarApp, addMiddleware, updateConfig, config }) => {
        const siteUrl = options.siteUrl ?? config.site;
        if (!siteUrl) {
          throw new Error(
            '[astro-structured-data] No siteUrl provided and no `site` set in astro.config. ' +
            'Add `site: "https://example.com"` to your Astro config or pass `siteUrl` to the integration.'
          );
        }
        const resolvedOptions = { ...options, siteUrl };

        const virtualModuleId = 'virtual:astro-structured-data/config';
        const resolvedVirtualModuleId = '\0' + virtualModuleId;

        updateConfig({
          vite: {
            plugins: [
              {
                name: 'astro-structured-data-vite',
                resolveId(id) {
                  if (id === virtualModuleId) {
                    return resolvedVirtualModuleId;
                  }
                },
                load(id) {
                  if (id === resolvedVirtualModuleId) {
                    return `export function getGlobalConfig() {
                      return ${JSON.stringify(resolvedOptions)};
                    }`;
                  }
                },
              },
            ],
          },
        });

        // Page-level checks and meta tags need the fully rendered page, so they run as middleware.
        addMiddleware({
          entrypoint: new URL('./middleware.js', import.meta.url),
          order: 'pre',
        });

        // Add the Dev Toolbar App for validation
        addDevToolbarApp({
          id: 'structured-data-validator',
          name: 'Structured Data',
          icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="astro-structured-data-icon" style="width: 100%; height: 100%;"><circle cx="12" cy="5" r="3"></circle><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"></path></svg>`,
          entrypoint: new URL('./dev-toolbar.js', import.meta.url).pathname,
        });
      },

      'astro:build:done': async ({ dir, logger }) => {
        const outputDir = fileURLToPath(dir);
        let entries: string[];
        try {
          entries = (await readdir(outputDir, { recursive: true })) as string[];
        } catch {
          return;
        }
        const htmlFiles = entries.filter(f => f.endsWith('.html'));

        // Deduplicate: warn once per (type, field) across all pages
        const warned = new Set<string>();

        for (const file of htmlFiles) {
          const html = await readFile(join(outputDir, file), 'utf-8');

          for (const match of html.matchAll(JSONLD_RE)) {
            let data: any;
            try {
              data = JSON.parse(match[1]);
            } catch (error) {
              throw new Error(`[astro-structured-data] Invalid JSON-LD in ${file}: ${(error as Error).message}`);
            }
            if (options.warnOnMissingRecommended === false) continue;

            const items: any[] = Array.isArray(data['@graph']) ? data['@graph'] : [data];

            for (const item of items) {
              for (const field of missingRecommended(item)) {
                const key = `${item['@type']}:${field}`;
                if (!warned.has(key)) {
                  warned.add(key);
                  logger.warn(
                    `[structured-data] ${item['@type']} is missing recommended field "${field}" — add it for richer search results. Disable with warnOnMissingRecommended: false`
                  );
                }
              }
            }
          }
        }
      },
    },
  };
}
