// Runs the full test suite (component, graph, meta, static build, dev server, Node SSR)
// against older Astro majors. Each major gets a throwaway copy of the repo in the OS temp dir
// with astro and @astrojs/node pinned to that major; the repo's own node_modules stay untouched.
//
//   npm run test:compat            # Astro 5 and 6
//   npm run test:compat -- 6       # only Astro 6
//   npm run test:compat -- --keep  # keep the temp dirs for debugging
import { execSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Adapter and Vite majors that match each Astro major (adapter peerDependencies, Astro's own
// Vite dependency). Vite is pinned so vitest runs on the same Vite as Astro instead of its newest.
// Vitest 5 on Vite 7 cannot load Astro 6's virtual modules in the component tests, so Astro 6
// uses Vitest 4 (test harness only, the package itself is unaffected).
const MATRIX = {
  5: { astro: '^5.0.0', node: '^9.0.0', vite: '^6.4.1' },
  6: { astro: '^6.0.0', node: '^10.0.0', vite: '^7.3.2', vitest: '^4.0.0' },
};

const args = process.argv.slice(2);
const keep = args.includes('--keep');
const majors = args.filter((arg) => arg !== '--keep');
const selected = majors.length > 0 ? majors : Object.keys(MATRIX);

const repo = fileURLToPath(new URL('..', import.meta.url));
const copied = ['src', 'test', 'scripts', 'tsconfig.json', 'vitest.config.ts', 'vitest.unit.config.ts', 'vitest.e2e.config.ts'];
const results = [];

for (const major of selected) {
  const versions = MATRIX[major];
  if (!versions) throw new Error(`No compatibility setup for Astro ${major} (known: ${Object.keys(MATRIX).join(', ')})`);

  const dir = mkdtempSync(join(tmpdir(), `astro-structured-data-astro${major}-`));
  for (const entry of copied) {
    cpSync(join(repo, entry), join(dir, entry), {
      recursive: true,
      filter: (path) => !/[\\/]\.e2e-[^\\/]*$/.test(path),
    });
  }
  const pkg = JSON.parse(readFileSync(join(repo, 'package.json'), 'utf-8'));
  pkg.devDependencies.astro = versions.astro;
  pkg.devDependencies['@astrojs/node'] = versions.node;
  pkg.devDependencies.vite = versions.vite;
  if (versions.vitest) pkg.devDependencies.vitest = versions.vitest;
  pkg.overrides = { vite: versions.vite };
  writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg, null, 2));

  console.log(`\n=== Astro ${major} (${dir}) ===`);
  let ok = false;
  try {
    execSync('npm install --no-audit --no-fund --loglevel=error', { cwd: dir, stdio: 'inherit' });
    const installed = (name) => JSON.parse(readFileSync(join(dir, 'node_modules', name, 'package.json'), 'utf-8')).version;
    console.log(`astro ${installed('astro')}, @astrojs/node ${installed('@astrojs/node')}, vite ${installed('vite')}, vitest ${installed('vitest')}, Node ${process.version}`);
    execSync('npx vitest run', { cwd: dir, stdio: 'inherit' });
    ok = true;
  } catch {
    // vitest/npm already printed the failure
  }
  results.push({ major, ok });
  if (keep) console.log(`kept ${dir}`);
  else rmSync(dir, { recursive: true, force: true });
}

console.log('\n=== Summary ===');
for (const { major, ok } of results) console.log(`Astro ${major}: ${ok ? 'passed' : 'FAILED'}`);
if (results.some(({ ok }) => !ok)) process.exitCode = 1;
