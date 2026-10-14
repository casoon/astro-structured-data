// Sample project for the start page recording (see ../capture.sh). It uses the package
// built at the repository root, as a project would use the npm package.
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import structuredData from '../../../dist/index.js';

export default defineConfig({
  site: 'https://example.com',
  vite: {
    resolve: {
      alias: {
        '@casoon/astro-structured-data/components': fileURLToPath(
          new URL('../../../dist/components.js', import.meta.url)
        ),
      },
    },
  },
  integrations: [structuredData({ generateMeta: true, siteName: 'Example Blog' })],
});
