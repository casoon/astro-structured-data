import { defineConfig } from 'vitest/config';

// Two projects: component/unit tests run inside Astro's Vite pipeline, the end-to-end tests
// drive real Astro builds and servers and therefore run in plain Node.
export default defineConfig({
  test: {
    projects: ['./vitest.unit.config.ts', './vitest.e2e.config.ts'],
  },
});
