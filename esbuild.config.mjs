import { build } from 'esbuild';

// This banner shim is required because we bundle as ESM (--format=esm)
// but some dependencies (e.g. dotenv, bcrypt) use CJS dynamic require() internally.
// The shim re-introduces require(), __dirname, and __filename into the ESM context.
const cjsShim = `
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
`.trim();

await build({
  entryPoints: ['index.ts'],
  platform: 'node',
  bundle: true,
  format: 'esm',
  outdir: 'dist',
  banner: {
    js: cjsShim,
  },
  external: [
    'bcrypt',
    'bufferutil',
    'utf-8-validate',
    'cpu-features',
    'ssh2',
  ],
  logLevel: 'info',
});
