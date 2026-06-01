import { readFileSync, writeFileSync, mkdirSync } from 'fs';

mkdirSync('dist', { recursive: true });

const src = readFileSync('src/components/index.ts', 'utf-8');
// Rewrite relative paths to go through src/ since the output is in dist/
const js = src.replace(/from '\.\/(.+?)'/g, "from '../src/components/$1'");
const dts = src.replace(/from '\.\/(.+?)'/g, "from '../src/components/$1'");

writeFileSync('dist/components.js', js);
writeFileSync('dist/components.d.ts', dts);
