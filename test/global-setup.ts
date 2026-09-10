import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// The end-to-end tests load the integration the way consumers do: from the built package.
export default function setup() {
  execSync('npm run build', { cwd: fileURLToPath(new URL('..', import.meta.url)), stdio: 'inherit' });
}
