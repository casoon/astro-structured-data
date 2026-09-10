import { defineConfig } from 'vitest/config';

// Real Astro builds, dev server and SSR server against the built package.
export default defineConfig({
  test: {
    name: 'e2e',
    include: ['test/e2e.test.ts'],
    globalSetup: ['test/global-setup.ts'],
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
