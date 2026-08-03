// Dev server for the React job-bank remote -- port 4203, matching the
// Angular dev-server it replaces exactly, so nothing downstream (Playwright
// webServer config, developer muscle memory, the shell's dev-default
// manifest) needs to change. See build.mjs for why the federation build
// (./Component + shared react bundle) and the standalone main.js bundle
// are two genuinely separate esbuild invocations, not one. esbuild
// watch-rebuilds both on file change; a small built-in static server (no
// extra dependency) serves the output with SPA fallback, mirroring what
// `@nx/web:file-server` does for serve-static.
import { runEsBuildBuilder } from '@softarc/native-federation-esbuild';
import * as esbuild from 'esbuild';
import { createServer } from 'node:http';
import { readFile, mkdir, cp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { extname, join } from 'node:path';

const require = createRequire(import.meta.url);
const outputPath = 'dist/apps/job-bank/browser';
const port = Number(process.env.JOB_BANK_DEV_PORT ?? 4203);

await rm(outputPath, { recursive: true, force: true });
await mkdir(outputPath, { recursive: true });
await cp('apps/job-bank/public', outputPath, { recursive: true });
await cp('apps/job-bank/src/index.html', join(outputPath, 'index.html'));
await cp(require.resolve('es-module-shims'), join(outputPath, 'es-module-shims.js'));

await runEsBuildBuilder('apps/job-bank/federation.config.mjs', {
  workspaceRoot: process.cwd(),
  outputPath,
  tsConfig: 'apps/job-bank/tsconfig.federation.json',
  packageJson: 'package.json',
  dev: true,
  watch: true,
  adapterConfig: {
    plugins: [],
    // See build.mjs's comment on the equivalent option: this keeps
    // `needsCommonJsPlugin: true` (fixes the shared react chunk missing
    // named exports) without `reactFrameworkPlugin()`'s stale React-19
    // `fileReplacements` paths.
    frameworks: [{ needsCommonJsPlugin: true }],
  },
});

const mainCtx = await esbuild.context({
  entryPoints: ['apps/job-bank/src/main.tsx'],
  outfile: join(outputPath, 'main.js'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  jsx: 'automatic',
  target: 'es2022',
  sourcemap: true,
  define: {
    'process.env.NODE_ENV': JSON.stringify('development'),
  },
});
await mainCtx.watch();

const CONTENT_TYPES = {
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.html': 'text/html',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
};

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${port}`);
  let filePath = join(outputPath, decodeURIComponent(url.pathname));
  if (!existsSync(filePath) || url.pathname.endsWith('/')) {
    filePath = join(outputPath, 'index.html');
  }
  try {
    const body = await readFile(filePath);
    res.setHeader('Content-Type', CONTENT_TYPES[extname(filePath)] ?? 'application/octet-stream');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(body);
  } catch {
    res.statusCode = 404;
    res.end('Not found');
  }
}).listen(port, () => {
  console.log(`job-bank dev server listening on http://localhost:${port}`);
});
