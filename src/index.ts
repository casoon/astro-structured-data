import type { AstroIntegration } from 'astro';
import type { LocalBusiness, Organization, Brand, MerchantReturnPolicy, OfferShippingDetails } from 'schema-dts';
import { z } from 'zod';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

export interface StructuredDataOptions {
  siteUrl?: string;
  useGraph?: boolean;
  generateMeta?: boolean;
  siteName?: string;
  locale?: string;
  twitterSite?: string;
  twitterCreator?: string;
  warnOnMissingRecommended?: boolean;
  defaultLocalBusiness?: Omit<LocalBusiness, '@context' | '@type'>;
  defaultArticlePublisher?: Omit<Organization, '@context' | '@type'>;
  defaultBrand?: Omit<Brand, '@context' | '@type'> | string;
  defaultShippingDetails?: Omit<OfferShippingDetails, '@context' | '@type'>;
  defaultReturnPolicy?: Omit<MerchantReturnPolicy, '@context' | '@type'>;
}

const configSchema = z.object({
  siteUrl: z.string().url('siteUrl must be a valid absolute URL (e.g. https://example.com)').optional(),
  useGraph: z.boolean().optional(),
  generateMeta: z.boolean().optional(),
  siteName: z.string().optional(),
  locale: z.string().optional(),
  twitterSite: z.string().optional(),
  twitterCreator: z.string().optional(),
  warnOnMissingRecommended: z.boolean().optional(),
  defaultLocalBusiness: z.any().optional(),
  defaultArticlePublisher: z.any().optional(),
  defaultBrand: z.union([z.string(), z.any()]).optional(),
  defaultShippingDetails: z.any().optional(),
  defaultReturnPolicy: z.any().optional(),
});

// Recommended fields per schema.org type (using schema.org field names)
const RECOMMENDED_FIELDS: Record<string, string[]> = {
  Organization: ['sameAs', 'telephone', 'email', 'address'],
  Article: ['dateModified', 'publisher', 'image'],
  BlogPosting: ['dateModified', 'publisher', 'image'],
  NewsArticle: ['dateModified', 'publisher', 'image'],
  Product: ['offers', 'brand', 'sku', 'aggregateRating'],
  LocalBusiness: ['image', 'telephone', 'address', 'geo', 'openingHours'],
  Event: ['endDate', 'description', 'image'],
  WebPage: ['description', 'image', 'author', 'datePublished', 'dateModified'],
  JobPosting: ['validThrough', 'employmentType', 'baseSalary'],
  SoftwareApplication: ['operatingSystem', 'applicationCategory', 'offers', 'aggregateRating'],
  Recipe: ['prepTime', 'cookTime', 'recipeYield', 'recipeCategory', 'recipeCuisine', 'nutrition', 'recipeIngredient', 'recipeInstructions', 'aggregateRating'],
  VideoObject: ['duration', 'contentUrl', 'embedUrl', 'interactionStatistic'],
};

const JSONLD_RE = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;

export default function structuredData(options: StructuredDataOptions = {}): AstroIntegration {
  configSchema.parse(options);
  return {
    name: 'astro-structured-data',
    hooks: {
      'astro:config:setup': ({ addDevToolbarApp, updateConfig, config, logger }) => {
        const siteUrl = options.siteUrl ?? config.site;
        if (!siteUrl) {
          logger.error(
            'astro-structured-data: no siteUrl provided and no `site` set in astro.config. ' +
            'Add `site: "https://example.com"` to your Astro config or pass `siteUrl` to the integration.'
          );
          return;
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

        // Add the Dev Toolbar App for validation
        addDevToolbarApp({
          id: 'structured-data-validator',
          name: 'Structured Data',
          icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="astro-structured-data-icon" style="width: 100%; height: 100%;"><circle cx="12" cy="5" r="3"></circle><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"></path></svg>`,
          entrypoint: new URL('./dev-toolbar.js', import.meta.url).pathname,
        });
      },

      'astro:build:done': async ({ dir, logger }) => {
        if (options.warnOnMissingRecommended === false) return;

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
            try { data = JSON.parse(match[1]); } catch { continue; }

            const items: any[] = Array.isArray(data['@graph']) ? data['@graph'] : [data];

            for (const item of items) {
              const type = item['@type'] as string | undefined;
              if (!type) continue;
              const recommended = RECOMMENDED_FIELDS[type];
              if (!recommended) continue;

              for (const field of recommended) {
                const key = `${type}:${field}`;
                if (!warned.has(key) && item[field] == null) {
                  warned.add(key);
                  logger.warn(
                    `[structured-data] ${type} is missing recommended field "${field}" — add it for richer search results. Disable with warnOnMissingRecommended: false`
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
