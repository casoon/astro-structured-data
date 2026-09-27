// @ts-check
import { fileURLToPath } from 'node:url';
import casoonPages from '@casoon/pages-theme';
import { defineConfig } from 'astro/config';
// The package itself, built at the repository root (`npm run build`). It renders the examples.
import structuredData from '../dist/index.js';

// Project page: https://casoon.github.io/astro-structured-data/ — `base` is the GitHub Pages path.
export default defineConfig({
  site: 'https://casoon.github.io/astro-structured-data',
  base: '/astro-structured-data/',
  vite: {
    resolve: {
      alias: {
        // examples/*.astro import the package by its name, as a project would.
        '@casoon/astro-structured-data/components': fileURLToPath(
          new URL('../dist/components.js', import.meta.url)
        ),
      },
    },
  },
  integrations: [
    casoonPages({
      name: 'astro-structured-data',
      description:
        'Astro integration that generates validated JSON-LD structured data from typed components.',
      repo: 'casoon/astro-structured-data',
      version: '2.0.1',
      license: 'MIT',
      packages: [
        { label: 'npm', href: 'https://www.npmjs.com/package/@casoon/astro-structured-data' },
        { label: 'Website', href: 'https://astro-structured-data.casoon.de/' },
      ],
      docsGroups: {
        'getting-started': 'Getting started',
        guides: 'Guides',
        reference: 'Reference',
      },
    }),
    // Provides the configuration the components read. The examples render against
    // https://example.com, independent of this site's URL.
    structuredData({ siteUrl: 'https://example.com' }),
  ],
});
