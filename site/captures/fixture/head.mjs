// Prints what the build put into <head> of a page — `--meta`: the meta and link tags as
// "name  value" lines; `--json-ld`: the JSON-LD, pretty-printed. Only formats the real build
// output for the recording on the start page.
import { readFileSync } from 'node:fs';

const [mode, file] = process.argv.slice(2);
const html = readFileSync(file, 'utf8');
const head = html.slice(0, html.indexOf('</head>'));

if (mode === '--meta') {
  for (const [tag] of head.matchAll(/<(meta|link)\b[^>]*>/g)) {
    const attr = (name) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];
    const key = attr('property') ?? attr('name') ?? (attr('rel') === 'canonical' ? 'canonical' : undefined);
    if (key) console.log(`${key.padEnd(23)}${attr('content') ?? attr('href')}`);
  }
} else {
  for (const [, json] of head.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    console.log(JSON.stringify(JSON.parse(json), null, 2));
  }
}
