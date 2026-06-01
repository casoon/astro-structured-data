import type { AstroIntegration } from 'astro';
import type { LocalBusiness, Organization, Brand, MerchantReturnPolicy, OfferShippingDetails } from 'schema-dts';
import { z } from 'zod';

export interface StructuredDataOptions {
  siteUrl?: string;
  useGraph?: boolean;
  defaultLocalBusiness?: Omit<LocalBusiness, '@context' | '@type'>;
  defaultArticlePublisher?: Omit<Organization, '@context' | '@type'>;
  defaultBrand?: Omit<Brand, '@context' | '@type'> | string;
  defaultShippingDetails?: Omit<OfferShippingDetails, '@context' | '@type'>;
  defaultReturnPolicy?: Omit<MerchantReturnPolicy, '@context' | '@type'>;
}

const configSchema = z.object({
  siteUrl: z.string().url('siteUrl must be a valid absolute URL (e.g. https://example.com)').optional(),
  useGraph: z.boolean().optional(),
  defaultLocalBusiness: z.any().optional(),
  defaultArticlePublisher: z.any().optional(),
  defaultBrand: z.union([z.string(), z.any()]).optional(),
  defaultShippingDetails: z.any().optional(),
  defaultReturnPolicy: z.any().optional(),
});

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
    },
  };
}
