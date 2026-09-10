// Starts the Astro dev server for the async fixture in a separate Node process and prints
// `{"port": …}` once it listens. Astro's dev server skips its page routing when it detects
// vitest (process.env.VITEST), so the test starts this script without vitest's environment.
// The test ends it with SIGTERM.
// Usage: node dev-server.mjs '<integration options as JSON>' <port>
import { fileURLToPath } from 'node:url';
import { dev } from 'astro';
import structuredData from '../../dist/index.js';

const [options, port] = process.argv.slice(2);

const server = await dev({
  root: fileURLToPath(new URL('./async-site/', import.meta.url)),
  configFile: false,
  site: 'https://example.com',
  logLevel: 'error',
  devToolbar: { enabled: false },
  server: { port: Number(port) },
  integrations: [structuredData(JSON.parse(options))],
});

process.stdout.write(`${JSON.stringify({ port: server.address.port })}\n`);
