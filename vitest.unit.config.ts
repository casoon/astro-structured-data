/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';
import structuredData from './src/index.ts';

// Components are rendered through Astro's container API, so the tests run inside
// Astro's Vite pipeline with the integration installed (it provides the virtual
// config module). Individual tests override the config via `vi.mock`.
export default getViteConfig(
  {
    test: {
      name: 'unit',
      include: ['test/**/*.test.ts'],
      exclude: ['test/e2e.test.ts'],
    },
  },
  {
    site: 'https://example.com',
    integrations: [structuredData()],
  }
);
