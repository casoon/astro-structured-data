// Serves one built benchmark site (Node adapter, middleware mode) and samples its memory.
// `/__mem/reset` starts a measurement window, `/__mem` returns the peaks since then.
// Usage: node --expose-gc serve.mjs <path to dist/server/entry.mjs>
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

const { handler } = await import(pathToFileURL(process.argv[2]).href);

let peak;
function reset() {
  globalThis.gc?.();
  const { rss, heapUsed, arrayBuffers } = process.memoryUsage();
  peak = { baseRss: rss, baseHeap: heapUsed + arrayBuffers, rss, heap: heapUsed + arrayBuffers };
}
reset();
setInterval(() => {
  const { rss, heapUsed, arrayBuffers } = process.memoryUsage();
  peak.rss = Math.max(peak.rss, rss);
  peak.heap = Math.max(peak.heap, heapUsed + arrayBuffers);
}, 2).unref();

const server = createServer((req, res) => {
  if (req.url === '/__mem/reset') {
    reset();
    return res.end('ok');
  }
  if (req.url === '/__mem') return res.end(JSON.stringify(peak));
  handler(req, res);
});
server.listen(0, () => process.stdout.write(`${JSON.stringify({ port: server.address().port })}\n`));
