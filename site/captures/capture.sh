#!/usr/bin/env bash
# Regenerates the terminal captures on the start page: real builds of the sample project in
# fixture/ with the package built at the repository root.
#   npm run build && site/captures/capture.sh
# Rebuild the scenes (wide, and narrow for phones) after a capture:
#   cd site/captures && for f in build build-narrow; do
#     npx -y -p @casoon/castwright@0.5.0 -p shiki castwright build "$f.terminal.yaml" --format svg -o .; done
set -euo pipefail

out="$(cd "$(dirname "$0")" && pwd)"
fixture="$out/fixture"
astro="$out/../node_modules/.bin/astro"
page="$fixture/src/pages/blog/hello-astro.astro"
backup="$(mktemp)"
cp "$page" "$backup"
trap 'mv "$backup" "$page"; rm -rf "$fixture/dist" "$fixture/.astro"' EXIT

# 1. A valid page: the build summary, then what ended up in <head>.
(cd "$fixture" && "$astro" build) | grep -E '\[build\] (1 page|Complete)' | sed -E 's/^[0-9:]+ //' > "$out/build-ok.txt"
node "$fixture/head.mjs" --meta "$fixture/dist/blog/hello-astro/index.html" > "$out/meta.txt"
node "$fixture/head.mjs" --json-ld "$fixture/dist/blog/hello-astro/index.html" > "$out/json-ld.txt"

# 2. The same page with a German date: the build stops with the component's message.
sed -i '' 's/datePublished="2026-10-01"/datePublished="01.10.2026"/' "$page"
grep datePublished "$page" > "$out/broken-line.txt"
(cd "$fixture" && "$astro" build 2>&1 || true) \
  | sed -n '/^\[astro-structured-data\] <ArticleSchema>/,/→ at/p' | head -3 > "$out/build-error.txt"

# 3. The scenes show the error wrapped at a space before their width (64 and 54 columns), so the
#    long first line does not break mid-word; the text itself stays as captured.
for cols in 64 54; do
  node -e '
    const w = Number(process.argv[1]);
    const out = [];
    for (let line of require("node:fs").readFileSync(0, "utf8").replace(/\n$/, "").split("\n")) {
      while ([...line].length > w) {
        const cut = line.lastIndexOf(" ", w);
        if (cut <= 0) break;
        out.push(line.slice(0, cut));
        line = line.slice(cut + 1);
      }
      out.push(line);
    }
    process.stdout.write(out.join("\n") + "\n");
  ' "$cols" < "$out/build-error.txt" > "$out/build-error-$cols.txt"
done
